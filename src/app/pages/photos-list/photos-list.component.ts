import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CardItemComponent } from '../../shared/card-item/card-item.component';
import { GridTableComponent } from '../../shared/grid-table/grid-table.component';
import { PhotosService } from '../../services/photos.service';
import { ReleaseHit } from '../../models/itunes';

type ViewMode = 'cards' | 'table';

@Component({
  selector: 'app-photos-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    CardItemComponent,
    GridTableComponent,
  ],
  templateUrl: './photos-list.component.html',
  styleUrls: ['./photos-list.component.scss'],
})
export class PhotosListComponent implements OnInit {
  private readonly photosService = inject(PhotosService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly viewMode = signal<ViewMode>('cards');
  readonly items = signal<ReleaseHit[]>([]);
  readonly displayedColumns = [
    'artist',
    'title',
    'label',
    'year',
    'country',
    'genre',
  ];

  ngOnInit(): void {
    this.photosService.getPhotos('post punk', 12).subscribe({
      next: (releaseHits) => {
        this.items.set(releaseHits);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  goDetail(release: ReleaseHit): void {
    this.router.navigate(['/photos', release.id]);
  }
}
