import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FireLink } from '../../models/fire-link';

@Component({
  selector: 'app-fire-link-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="card">
      <div class="card-image-wrapper">
        <a class="card-image" [href]="item.url" target="_blank" rel="noopener noreferrer">
          <img [src]="item.icon || '/fire.ico'" [alt]="item.name" />
        </a>
        <div class="card-overlay-icons" *ngIf="isAuthenticated">
          <button 
            class="icon-toggle favorite-icon" 
            [class.active]="item.isFavorite"
            type="button" 
            (click)="toggleFavorite.emit(item)"
            title="Toggle Favorite"
            aria-label="Toggle Favorite">
            ★
          </button>
          <button 
            class="icon-toggle watched-icon" 
            [class.active]="item.isWatched"
            type="button" 
            (click)="toggleWatched.emit(item)"
            title="Toggle Watched"
            aria-label="Toggle Watched">
            <span *ngIf="item.isWatched">📺</span>
            <span *ngIf="!item.isWatched">📺</span>
          </button>
        </div>
      </div>
      <div class="card-body">
        <div class="card-header">
          <h3>{{ item.name }}</h3>
        </div>
        <div class="card-actions">
          <button *ngIf="isAuthenticated" class="icon-button primary" type="button" (click)="edit.emit(item)">Edit</button>
          <button *ngIf="isAuthenticated" class="icon-button danger" type="button" (click)="delete.emit(item)">Delete</button>
        </div>
      </div>
    </article>
  `,
  styles: [
    `.card { display: flex; flex-direction: column; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 1rem; overflow: hidden; transition: transform 0.2s ease, box-shadow 0.2s ease; }`,
    `.card:hover { transform: translateY(-3px); box-shadow: 0 18px 50px rgb(15 23 42 / 0.08); }`,
    `.card-image-wrapper { position: relative; width: 100%; min-height: 140px; background: #f3f4f6; }`,
    `.card-image { display: block; width: 100%; height: 100%; }`,
    `.card-image img { width: 100%; height: 140px; object-fit: contain; background: #ffffff; }`,
    `.card-overlay-icons { position: absolute; top: 0.5rem; right: 0.5rem; display: flex; gap: 0.25rem; }`,
    `.icon-toggle { border: none; background: rgba(255, 255, 255, 0.9); cursor: pointer; width: 2rem; height: 2rem; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; border-radius: 0.5rem; opacity: 0.7; transition: opacity 0.2s ease, background-color 0.2s ease; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); }`,
    `.icon-toggle:hover { opacity: 1; }`,
    `.favorite-icon.active { background: #fbbf24; opacity: 1; color: #92400e; }`,
    `.watched-icon.active { background: #fbbf24; opacity: 1; color: #92400e; }`,
    `.watched-icon:not(.active) { opacity: 0.7; }`,
    `.card-body { padding: 1rem; }`,
    `.card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; }`,
    `.card-header h3 { margin: 0; font-size: 1rem; flex: 1; }`,
    `.card-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.75rem; }`,
    `.icon-button { border: 1px solid #d1d5db; background: transparent; color: #111827; border-radius: 999px; padding: 0.5rem 0.9rem; cursor: pointer; font-size: 0.9rem; }`,
    `.icon-button.primary { border-color: #c7d2fe; color: #2563eb; }`,
    `.icon-button.danger { border-color: #fecaca; color: #b91c1c; }`
  ],
})
export class FireLinkCardComponent {
  @Input() item!: FireLink;
  @Input() isAuthenticated = false;
  @Input() currentTab: 'main' | 'watched' | 'favorites' | 'all' = 'main';
  @Output() edit = new EventEmitter<FireLink>();
  @Output() delete = new EventEmitter<FireLink>();
  @Output() toggleFavorite = new EventEmitter<FireLink>();
  @Output() toggleWatched = new EventEmitter<FireLink>();
}
