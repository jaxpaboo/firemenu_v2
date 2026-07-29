import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { FireLink } from '../../models/fire-link';

@Component({
    selector: 'app-fire-link-form',
    imports: [CommonModule, FormsModule],
    templateUrl: './fire-link-form.component.html',
    styleUrl: './fire-link-form.component.scss'
})
export class FireLinkFormComponent {
  @Input() visible = false;
  @Input() model: FireLink = { id: 0, name: '', icon: '', url: '' };
  @Input() existingItems: FireLink[] = [];
  @Input() isEditing = false;
  @Input() isAuthenticated = false;
  @Output() save = new EventEmitter<NgForm>();
  @Output() cancel = new EventEmitter<void>();
  @Output() delete = new EventEmitter<FireLink>();

  onUrlChange(url: string): void {
    if (this.isEditing) {
      return;
    }

    if ((this.model.name ?? '').trim().length > 0) {
      return;
    }

    const autoTitle = this.buildTitleFromUrl(url);
    if (autoTitle) {
      this.model.name = autoTitle;
    }

    const matchedIcon = this.findIconForSiteRoot(url);
    if (matchedIcon) {
      this.model.icon = matchedIcon;
    }
  }

  private buildTitleFromUrl(url: string): string {
    const parsedUrl = this.parseUrl(url);
    if (!parsedUrl) {
      return '';
    }

    const segments = parsedUrl.pathname.split('/').filter(Boolean);
    if (segments.length === 0) {
      return '';
    }

    const slug = decodeURIComponent(segments[segments.length - 1]).toLowerCase();
    const tokens = slug.split(/[-_]+/).filter(Boolean);
    if (tokens.length === 0) {
      return '';
    }

    while (tokens.length > 0 && /^\d+$/.test(tokens[0])) {
      tokens.shift();
    }

    if (tokens.length === 0) {
      return '';
    }

    let year = '';
    let yearIndex = -1;
    const lastIndex = tokens.length - 1;

    if (/^\d{4}$/.test(tokens[lastIndex])) {
      year = tokens[lastIndex];
      yearIndex = lastIndex;
    } else if (lastIndex > 0 && /^\d{4}$/.test(tokens[lastIndex - 1])) {
      year = tokens[lastIndex - 1];
      yearIndex = lastIndex - 1;
    } else {
      for (let i = tokens.length - 1; i >= 0; i -= 1) {
        if (/^\d{4}$/.test(tokens[i])) {
          year = tokens[i];
          yearIndex = i;
          break;
        }
      }
    }

    const titleTokens = (yearIndex >= 0 ? tokens.slice(0, yearIndex) : tokens)
      .filter((token) => !/^\d+$/.test(token));

    if (titleTokens.length === 0) {
      return '';
    }

    const properTitle = titleTokens
      .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
      .join(' ');

    return year ? `${properTitle} (${year})` : properTitle;
  }

  private findIconForSiteRoot(url: string): string {
    const targetRoot = this.extractSiteRoot(url);
    if (!targetRoot) {
      return '';
    }

    for (const item of this.existingItems) {
      if (!item?.url || !item?.icon) {
        continue;
      }

      const itemRoot = this.extractSiteRoot(item.url);
      if (itemRoot && itemRoot === targetRoot) {
        return item.icon;
      }
    }

    return '';
  }

  private extractSiteRoot(url: string): string {
    const parsedUrl = this.parseUrl(url);
    if (!parsedUrl) {
      return '';
    }

    const labels = parsedUrl.hostname
      .toLowerCase()
      .replace(/^www\./, '')
      .split('.')
      .filter(Boolean);

    if (labels.length === 0) {
      return '';
    }

    if (labels.length === 1) {
      return labels[0];
    }

    if (labels.length === 2) {
      return labels[0];
    }

    const secondLevel = labels[labels.length - 2];
    if (['co', 'com', 'net', 'org'].includes(secondLevel) && labels.length >= 3) {
      return labels[labels.length - 3];
    }

    return secondLevel;
  }

  private parseUrl(input: string): URL | null {
    if (!input?.trim()) {
      return null;
    }

    try {
      return new URL(input);
    } catch {
      try {
        return new URL(`https://${input}`);
      } catch {
        return null;
      }
    }
  }
}
