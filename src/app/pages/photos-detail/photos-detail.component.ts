import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';

import { PhotosService } from '../../services/photos.service';
import { ReleaseDetail } from '../../models/itunes';

@Component({
  selector: 'app-photos-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatExpansionModule],
  templateUrl: './photos-detail.component.html',
  styleUrls: ['./photos-detail.component.scss'],
})
export class PhotosDetailComponent implements OnInit {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly photosService = inject(PhotosService);

  readonly data = signal<ReleaseDetail | null>(null);
  readonly expanded = signal(false);

  togglePanel(): void {
    this.expanded.update((isOpen) => !isOpen);
  }

  readonly titleText = computed(() => this.data()?.title ?? '');
  readonly artistsText = computed(() => {
    const artists = this.data()?.artists ?? [];
    return artists.length
      ? artists.map((artist) => artist.name).join(', ')
      : '-';
  });
  readonly labelsText = computed(() => {
    const labels = this.data()?.labels ?? [];
    return labels.length ? labels.map((label) => label.name).join(', ') : '-';
  });
  readonly genresText = computed(() => {
    const genres = this.data()?.genres ?? [];
    return genres.length ? genres.join(', ') : '-';
  });

  ngOnInit(): void {
    const collectionId = this.activatedRoute.snapshot.paramMap.get('id');
    if (!collectionId) return;
    this.photosService
      .getPhotoById(collectionId)
      .subscribe((detail) => this.data.set(detail));
  }

  back(): void {
    this.router.navigateByUrl('/photos');
  }
}
