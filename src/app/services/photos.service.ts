import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  of,
  from,
  map,
  switchMap,
  catchError,
  concatMap,
  reduce,
  timeout,
  retry,
  timer,
} from 'rxjs';
import { SearchResponse, ReleaseHit, ReleaseDetail } from '../models/itunes';

@Injectable({ providedIn: 'root' })
export class PhotosService {
  private readonly httpClient = inject(HttpClient);
  private readonly itunesBaseUrl = 'https://itunes.apple.com';

  private toHighResArtworkUrl(url: string): string {
    if (!url) return url;
    return url.replace(/\/[0-9]+x[0-9]+bb\./, '/600x600bb.');
  }

  private inferLabelFromCopyright(copyrightValue: unknown): string | null {
    if (typeof copyrightValue !== 'string' || !copyrightValue.trim())
      return null;
    const patterns = [
      /℗\s*\d{4}\s*([^.,]+)/i,
      /©\s*\d{4}\s*([^.,]+)/i,
      /under (?:exclusive )?license to\s*([^.,]+)/i,
      /under (?:exclusive )?licence to\s*([^.,]+)/i,
    ];
    for (const regex of patterns) {
      const match = copyrightValue.match(regex);
      if (match?.[1]) return match[1].trim();
    }
    return null;
  }

  getPhotos(term = 'post punk', limit = 12): Observable<ReleaseHit[]> {
    const query = new URLSearchParams({
      term,
      media: 'music',
      entity: 'album',
      limit: String(limit),
    });

    return this.httpClient
      .jsonp<SearchResponse>(
        `${this.itunesBaseUrl}/search?${query.toString()}`,
        'callback'
      )
      .pipe(
        map((response) => {
          const results = response.results || [];
          results.sort(
            (albumA: any, albumB: any) =>
              Date.parse(albumB.releaseDate || 0) -
              Date.parse(albumA.releaseDate || 0)
          );
          return results.map(
            (result: any) =>
              ({
                id: result.collectionId,
                artist: result.artistName ?? '',
                title: result.collectionName ?? '',
                label: undefined,
                year: result.releaseDate
                  ? new Date(result.releaseDate).getFullYear()
                  : undefined,
                country: result.country,
                genre: result.primaryGenreName ?? '',
                cover_image: this.toHighResArtworkUrl(
                  result.artworkUrl100 || result.artworkUrl60 || ''
                ),
              } as ReleaseHit)
          );
        }),
        switchMap((releaseHits: ReleaseHit[]) =>
          this.enrichLabels(releaseHits).pipe(catchError(() => of(releaseHits)))
        )
      );
  }

  private enrichLabels(releaseHits: ReleaseHit[]): Observable<ReleaseHit[]> {
    if (!releaseHits.length) return of(releaseHits);

    const batches: ReleaseHit[][] = [];
    for (let i = 0; i < releaseHits.length; i += 10) {
      batches.push(releaseHits.slice(i, i + 10));
    }

    return from(batches).pipe(
      concatMap((batch, index) =>
        timer(index === 0 ? 0 : 250).pipe(map(() => batch))
      ),
      concatMap((batch) => {
        const idList = batch.map((hit) => hit.id).join(',');
        const query = new URLSearchParams({ id: idList, entity: 'album' });

        return this.httpClient
          .jsonp<any>(
            `${this.itunesBaseUrl}/lookup?${query.toString()}`,
            'callback'
          )
          .pipe(
            timeout({ each: 8000 }),
            retry({
              count: 2,
              delay: (_err, retryCount) =>
                timer(500 * Math.pow(2, retryCount - 1)),
            }),
            map((response) => {
              const labelById = new Map<number, string>();
              for (const item of response?.results ?? []) {
                if (item.wrapperType === 'collection') {
                  const inferred = this.inferLabelFromCopyright(item.copyright);
                  if (inferred) labelById.set(item.collectionId, inferred);
                }
              }
              return labelById;
            }),
            catchError(() => of(new Map<number, string>()))
          );
      }),
      reduce(
        (accumulated, current) =>
          new Map<number, string>([...accumulated, ...current]),
        new Map<number, string>()
      ),
      map((labelById) =>
        releaseHits.map((hit) => ({
          ...hit,
          label: labelById.get(hit.id) ?? hit.label,
        }))
      )
    );
  }

  private getArtistOriginFromMusicBrainz(
    artistName: string | undefined
  ): Observable<string | null> {
    if (!artistName) return of(null);
    const query = new URLSearchParams({
      query: `artist:${artistName}`,
      fmt: 'json',
      limit: '1',
    });
    return this.httpClient
      .get<any>(`https://musicbrainz.org/ws/2/artist?${query.toString()}`)
      .pipe(
        map((response) => {
          const artist = response?.artists?.[0];
          return artist?.area?.name || artist?.country || null;
        }),
        catchError(() => of(null))
      );
  }

  getPhotoById(collectionId: string | number): Observable<ReleaseDetail> {
    const idString = String(collectionId);

    const lookupSongs = () => {
      const query = new URLSearchParams({ id: idString, entity: 'song' });
      return this.httpClient
        .jsonp<any>(
          `${this.itunesBaseUrl}/lookup?${query.toString()}`,
          'callback'
        )
        .pipe(
          timeout({ each: 8000 }),
          retry({
            count: 2,
            delay: (_err, retryCount) =>
              timer(1000 * Math.pow(2, retryCount - 1)),
          })
        );
    };

    const lookupAlbumOnly = () => {
      const query = new URLSearchParams({ id: idString, entity: 'album' });
      return this.httpClient
        .jsonp<any>(
          `${this.itunesBaseUrl}/lookup?${query.toString()}`,
          'callback'
        )
        .pipe(
          timeout({ each: 8000 }),
          retry({ count: 1, delay: () => timer(1000) })
        );
    };

    return lookupSongs().pipe(
      catchError(() => lookupAlbumOnly()),
      map((response) => {
        const results = response?.results || [];
        const album =
          results.find((x: any) => x.wrapperType === 'collection') || {};
        const tracks = results.filter((x: any) => x.wrapperType === 'track');
        const artworkUrl = this.toHighResArtworkUrl(
          album.artworkUrl100 || album.artworkUrl60 || ''
        );

        const toMinutesSeconds = (ms?: number) =>
          typeof ms === 'number'
            ? `${Math.floor(ms / 60000)}:${String(
                Math.floor((ms % 60000) / 1000)
              ).padStart(2, '0')}`
            : '';

        const inferredLabel =
          this.inferLabelFromCopyright(album.copyright) ?? null;

        const baseDetail: ReleaseDetail = {
          id: album.collectionId,
          title: album.collectionName,
          year: album.releaseDate
            ? new Date(album.releaseDate).getFullYear()
            : undefined,
          country: album.country,
          images: artworkUrl
            ? [{ uri: artworkUrl, uri150: artworkUrl, type: 'front' }]
            : [],
          artists: album.artistName ? [{ name: album.artistName }] : [],
          labels: inferredLabel ? [{ name: inferredLabel }] : [],
          genres: album.primaryGenreName ? [album.primaryGenreName] : [],
          styles: [],
          tracklist: tracks.map((track: any, index: number) => ({
            position: String(index + 1),
            title: track.trackName,
            duration: toMinutesSeconds(track.trackTimeMillis),
          })),
        };

        return {
          baseDetail,
          artistName: album.artistName as string | undefined,
        };
      }),
      switchMap(({ baseDetail, artistName }) =>
        this.getArtistOriginFromMusicBrainz(artistName).pipe(
          map((origin) => ({ ...baseDetail, origin: origin ?? undefined })),
          catchError(() => of(baseDetail))
        )
      )
    );
  }
}
