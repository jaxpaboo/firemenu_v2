import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FireLink } from '../../models/fire-link';
import { FireLinkCardComponent } from '../fire-link-card/fire-link-card.component';

@Component({
    selector: 'app-fire-link-list',
    imports: [CommonModule, FireLinkCardComponent],
    templateUrl: './fire-link-list.component.html',
    styleUrl: './fire-link-list.component.scss'
})
export class FireLinkListComponent {
  @Input() items: FireLink[] = [];
  @Input() isAuthenticated = false;
  @Input() currentTab: 'main' | 'watched' | 'favorites' | 'all' = 'main';
  @Output() editItem = new EventEmitter<FireLink>();
  @Output() deleteItem = new EventEmitter<FireLink>();
  @Output() toggleFavorite = new EventEmitter<FireLink>();
  @Output() toggleWatched = new EventEmitter<FireLink>();
  @Output() confirmationNeeded = new EventEmitter<{action: string, item: FireLink, callback: () => void}>();
}
