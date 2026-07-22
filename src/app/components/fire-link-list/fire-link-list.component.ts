import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FireLink } from '../../models/fire-link';
import { FireLinkCardComponent } from '../fire-link-card/fire-link-card.component';

@Component({
  selector: 'app-fire-link-list',
  standalone: true,
  imports: [CommonModule, FireLinkCardComponent],
  template: `
    <div class="grid">
      <app-fire-link-card
        *ngFor="let item of items"
        [item]="item"
        [isAuthenticated]="isAuthenticated"
        [currentTab]="currentTab"
        (edit)="editItem.emit($event)"
        (delete)="deleteItem.emit($event)"
        (toggleFavorite)="toggleFavorite.emit($event)"
        (toggleWatched)="toggleWatched.emit($event)"
      />
    </div>
  `,
  styles: [`.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }`],
})
export class FireLinkListComponent {
  @Input() items: FireLink[] = [];
  @Input() isAuthenticated = false;
  @Input() currentTab: 'main' | 'watched' | 'favorites' | 'all' = 'main';
  @Output() editItem = new EventEmitter<FireLink>();
  @Output() deleteItem = new EventEmitter<FireLink>();
  @Output() toggleFavorite = new EventEmitter<FireLink>();
  @Output() toggleWatched = new EventEmitter<FireLink>();
}
