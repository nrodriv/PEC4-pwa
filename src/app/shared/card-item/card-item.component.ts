import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { ReleaseHit } from '../../models/itunes';

@Component({
  selector: 'app-card-item',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
  <mat-card class="animate__animated animate__fadeIn" (click)="select.emit(item)">
    <img [src]="item.cover_image"
         class="w-100"
         style="height:260px;object-fit:cover" alt="cover">
    <mat-card-content class="pt-2">
      <div class="text-muted" style="font-size:.9rem">{{ item.artist || '-' }}</div>
      <div class="fw-semibold" style="font-size:1.05rem">{{ item.title }}</div>
      <div class="text-muted" style="font-size:.85rem">{{ item.label || '-' }}</div>
      <div class="text-muted" style="font-size:.85rem">
        {{ item.year ?? '-' }} • {{ item.country || '-' }} • {{ item.genre || '-' }}
      </div>
    </mat-card-content>
  </mat-card>`,
  styles: [':host{display:block;cursor:pointer;}']
})
export class CardItemComponent {
  @Input({ required: true }) item!: ReleaseHit;
  @Output() select = new EventEmitter<ReleaseHit>();
}
