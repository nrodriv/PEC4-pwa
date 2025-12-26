import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { ReleaseHit } from '../../models/itunes';

@Component({
  selector: 'app-grid-table',
  standalone: true,
  imports: [CommonModule, MatTableModule],
  templateUrl: './grid-table.component.html',
})
export class GridTableComponent {
  @Input() items: ReleaseHit[] = [];
  @Output() select = new EventEmitter<ReleaseHit>();
  displayedColumns = ['artist', 'title', 'label', 'year', 'country', 'genre'];
}
