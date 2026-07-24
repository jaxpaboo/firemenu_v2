import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FireLink } from '../../models/fire-link';

@Component({
    selector: 'app-fire-link-card',
    imports: [CommonModule],
    templateUrl: './fire-link-card.component.html',
    styleUrl: './fire-link-card.component.scss'
})
export class FireLinkCardComponent {
  @Input() item!: FireLink;
  @Input() isAuthenticated = false;
  @Input() currentTab: 'main' | 'watched' | 'favorites' | 'all' = 'main';
  @Output() edit = new EventEmitter<FireLink>();
  @Output() delete = new EventEmitter<FireLink>();
  @Output() toggleFavorite = new EventEmitter<FireLink>();
  @Output() toggleWatched = new EventEmitter<FireLink>();
  @Output() confirmationNeeded = new EventEmitter<{action: string, item: FireLink, callback: () => void}>();

  onEditClick(): void {
    this.edit.emit(this.item);
  }

  onDeleteClick(): void {
    this.confirmationNeeded.emit({
      action: 'Are you sure you want to <strong>delete</strong> this item?',
      item: this.item,
      callback: () => this.delete.emit(this.item)
    });
  }

  onFavoriteClick(): void {
    this.toggleFavorite.emit(this.item);
  }

  onWatchedClick(): void {
    this.toggleWatched.emit(this.item);
  }
}
