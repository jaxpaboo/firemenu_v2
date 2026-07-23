import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FireLink } from '../../models/fire-link';

@Component({
  selector: 'app-fire-link-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fire-link-card.component.html',
  styleUrl: './fire-link-card.component.scss',
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

  hoveredButton: string | null = null;

  onEditClick(): void {
    this.confirmationNeeded.emit({
      action: 'Are you sure you want to <strong>edit</strong> this item?',
      item: this.item,
      callback: () => this.edit.emit(this.item)
    });
  }

  onDeleteClick(): void {
    this.confirmationNeeded.emit({
      action: 'Are you sure you want to <strong>delete</strong> this item?',
      item: this.item,
      callback: () => this.delete.emit(this.item)
    });
  }

  onFavoriteClick(): void {
    this.confirmationNeeded.emit({
      action: `Are you sure you want to ${this.item.isFavorite ? 'remove from' : 'add to'} <strong>favorites</strong>?`,
      item: this.item,
      callback: () => this.toggleFavorite.emit(this.item)
    });
  }

  onWatchedClick(): void {
    this.confirmationNeeded.emit({
      action: `Are you sure you want to ${this.item.isWatched ? 'remove from' : 'add to'} <strong>watched</strong>?`,
      item: this.item,
      callback: () => this.toggleWatched.emit(this.item)
    });
  }

  setHoveredButton(button: string | null): void {
    this.hoveredButton = button;
  }

  getPopupPosition(): { top: string; left?: string; right?: string } {
    const baseSize = 1.875; // 30px in rem (at 16px base)
    const buttonSize = 1; // 1rem
    const spacing = 0.5; // spacing from edge

    switch (this.hoveredButton) {
      case 'edit':
        return {
          top: `calc(${spacing}rem + ${buttonSize / 2}rem - ${baseSize / 2}rem)`,
          left: `calc(${spacing}rem + ${buttonSize / 2}rem - ${baseSize / 2}rem)`
        };
      case 'delete':
        return {
          top: `calc(${spacing}rem + ${buttonSize / 2}rem - ${baseSize / 2}rem)`,
          left: `calc(${spacing}rem + 1.25rem + ${buttonSize / 2}rem - ${baseSize / 2}rem)`
        };
      case 'favorite':
        return {
          top: `calc(${spacing}rem + ${buttonSize / 2}rem - ${baseSize / 2}rem)`,
          right: `calc(${spacing}rem + 1.25rem + ${buttonSize / 2}rem - ${baseSize / 2}rem)`
        };
      case 'watched':
        return {
          top: `calc(${spacing}rem + ${buttonSize / 2}rem - ${baseSize / 2}rem)`,
          right: `calc(${spacing}rem + ${buttonSize / 2}rem - ${baseSize / 2}rem)`
        };
      default:
        return { top: '0', left: '0' };
    }
  }
}
