import { Routes } from '@angular/router';
import { PhotosListComponent } from './pages/photos-list/photos-list.component';
import { PhotosDetailComponent } from './pages/photos-detail/photos-detail.component';

export const routes: Routes = [
  { path: '', redirectTo: 'photos', pathMatch: 'full' },
  { path: 'photos', component: PhotosListComponent },
  { path: 'photos/:id', component: PhotosDetailComponent },
  { path: '**', redirectTo: 'photos' },
];
