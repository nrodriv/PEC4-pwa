export interface ReleaseHit {
  id: number;
  artist: string;
  title: string;
  label?: string;
  year?: number;
  country?: string;
  genre?: string;
  cover_image: string;
}

export interface SearchResponse {
  resultCount: number;
  results: any[];
}

export interface ImageResource {
  uri: string;
  uri150: string;
  type: string;
}

export interface ArtistRef {
  name: string;
}

export interface LabelRef {
  name: string;
}

export interface TrackItem {
  position: string;
  title: string;
  duration?: string;
}

export interface ReleaseDetail {
  id: number;
  title: string;
  year?: number;
  country?: string;
  origin?: string;
  images?: ImageResource[];
  artists?: ArtistRef[];
  labels?: LabelRef[];
  genres?: string[];
  styles?: string[];
  tracklist?: TrackItem[];
}
