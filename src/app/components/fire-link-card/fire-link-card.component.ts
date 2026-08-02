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

  isFavoriteHovered = false;
  isWatchedHovered = false;
  isCardHovered = false;
  hoveredActionButtons = 0;

  get isFavoritePreviewActive(): boolean {
    return this.isFavoriteHovered ? !Boolean(this.item?.isFavorite) : Boolean(this.item?.isFavorite);
  }

  get isWatchedPreviewActive(): boolean {
    return this.isWatchedHovered ? !Boolean(this.item?.isWatched) : Boolean(this.item?.isWatched);
  }

  get shouldUseDarkTitleBackground(): boolean {
    return this.isCardHovered && this.hoveredActionButtons === 0;
  }

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

  onFavoriteHoverStart(): void {
    this.isFavoriteHovered = true;
  }

  onFavoriteHoverEnd(): void {
    this.isFavoriteHovered = false;
  }

  onWatchedHoverStart(): void {
    this.isWatchedHovered = true;
  }

  onWatchedHoverEnd(): void {
    this.isWatchedHovered = false;
  }

  onCardHoverStart(): void {
    this.isCardHovered = true;
  }

  onCardHoverEnd(): void {
    this.isCardHovered = false;
    this.hoveredActionButtons = 0;
  }

  onActionButtonHoverStart(): void {
    this.hoveredActionButtons += 1;
  }

  onActionButtonHoverEnd(): void {
    this.hoveredActionButtons = Math.max(0, this.hoveredActionButtons - 1);
  }
}
