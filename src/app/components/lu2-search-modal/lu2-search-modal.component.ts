import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { FireLink } from '../../models/fire-link';
import { Lu2Mode, Lu2MovieResult } from '../../models/lu2-search';

@Component({
  selector: 'app-lu2-search-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './lu2-search-modal.component.html',
  styleUrl: './lu2-search-modal.component.scss'
})
export class Lu2SearchModalComponent implements OnChanges, OnDestroy {
  @ViewChild('lu2SearchInputRef') private lu2SearchInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('lu2ScrollAreaRef') private lu2ScrollAreaRef?: ElementRef<HTMLElement>;

  @Input() visible = false;
  @Input() mode: Lu2Mode = 'movies';
  @Input() existingItems: FireLink[] = [];

  @Output() closeModal = new EventEmitter<void>();
  @Output() linkAdded = new EventEmitter<FireLink>();

  // Use Angular dev proxy to avoid browser CORS during local development.
  readonly lu2ProxyBase = '/lu2-api';
  readonly lu2SiteBase = 'https://www.lookmovie2.to';
  readonly lu2AssetBase = 'https://www.lookmovie2.to';
  readonly lu2NoPosterImage = 'https://via.placeholder.com/600x340?text=No+Poster';

  lu2Query = '';
  lu2Loading = false;
  lu2Error = '';
  lu2Results: Lu2MovieResult[] = [];
  lu2HasSearched = false;
  showLu2NoResultsToast = false;
  private lu2NoResultsTimer: number | null = null;
  private lu2SearchDebounceTimer: number | null = null;
  private lu2EdgeScrollTimer: number | null = null;
  private lu2EdgeScrollDirection: -1 | 0 | 1 = 0;

  private readonly lu2EdgeScrollStepPx = 14;
  private readonly lu2ArrowScrollStepPx = 120;

  constructor(private http: HttpClient) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && changes['visible'].currentValue === true) {
      this.lu2Error = '';
      this.showLu2NoResultsToast = false;
      this.clearLu2NoResultsTimer();

      window.setTimeout(() => {
        this.lu2SearchInputRef?.nativeElement.focus();
        this.lu2SearchInputRef?.nativeElement.select();
      });
    }

    if (changes['visible'] && changes['visible'].currentValue === false) {
      this.stopLu2EdgeScroll();
    }
  }

  ngOnDestroy(): void {
    this.stopLu2EdgeScroll();
    this.clearLu2SearchDebounceTimer();
    this.clearLu2NoResultsTimer();
  }

  closeAndReset(): void {
    this.resetLu2SearchState();
    this.closeModal.emit();
  }

  searchLu2(showEmptyQueryError = true): void {
    this.clearLu2SearchDebounceTimer();

    const query = this.lu2Query.trim();
    if (!query) {
      this.lu2HasSearched = false;
      this.lu2Error = showEmptyQueryError ? `Enter a ${this.getLu2ModeLabel().toLowerCase()} title to search.` : '';
      this.lu2Results = [];
      return;
    }

    this.lu2HasSearched = true;
    this.lu2Loading = true;
    this.lu2Error = '';
    this.showLu2NoResultsToast = false;
    this.clearLu2NoResultsTimer();

    const url = `${this.lu2ProxyBase}/${this.mode}/search/?q=${encodeURIComponent(query)}`;
    this.http.get(url, { responseType: 'text' }).subscribe({
      next: (html) => {
        const results = this.parseLu2SearchHtml(html);
        this.lu2Results = results;
        this.lu2Loading = false;

        if (results.length === 0) {
          this.showLu2NoResultsToast = true;
          this.scheduleLu2NoResultsToastHide();
        }
      },
      error: () => {
        this.lu2Loading = false;
        this.lu2Results = [];
        this.lu2Error = `Unable to fetch LU ${this.getLu2ModeLabel()} search results. Try again.`;
      },
    });
  }

  addLu2Result(result: Lu2MovieResult): void {
    const slug = String(result.slug ?? '').trim();
    if (!slug) {
      return;
    }

    const title = String(result.title ?? '').trim() || 'Untitled';
    const year = result.year ? ` (${result.year})` : '';
    const entryUrl = `${this.lu2SiteBase}/${this.mode}/view/${slug}`;
    const matchedIcon = this.findIconForSiteRoot(entryUrl);

    const entry: FireLink = {
      id: 0,
      name: `${title}${year}`,
      icon: matchedIcon || 'https://via.placeholder.com/320x140?text=No+icon',
      url: entryUrl,
      isFavorite: false,
      isWatched: false,
    };

    this.linkAdded.emit(entry);

    // After adding from LU2, close modal and clear search state for next use.
    this.closeAndReset();
  }

  getLu2CardBackground(result: Lu2MovieResult): string {
    const posterPath = result.poster?.w200 ?? result.poster?.w300 ?? result.poster?.w400 ?? result.poster?.w100 ?? '';
    if (!posterPath) {
      return this.lu2NoPosterImage;
    }

    return this.normalizeLu2AssetUrl(posterPath);
  }

  trackByLu2Result(index: number, result: Lu2MovieResult): string {
    return result.slug || String(result.id_movie || index);
  }

  playLu2Result(result: Lu2MovieResult): void {
    const slug = String(result.slug ?? '').trim();
    if (!slug) {
      return;
    }

    const entryUrl = `${this.lu2SiteBase}/${this.mode}/view/${slug}`;
    window.open(entryUrl, '_blank', 'noopener,noreferrer');
  }

  onLu2QueryInput(): void {
    this.clearLu2SearchDebounceTimer();
    this.showLu2NoResultsToast = false;
    this.clearLu2NoResultsTimer();

    this.lu2SearchDebounceTimer = window.setTimeout(() => {
      this.lu2SearchDebounceTimer = null;
      this.searchLu2(false);
    }, 500);
  }

  onLu2ModalMouseMove(event: MouseEvent): void {
    this.updateLu2EdgeScrollFromPointer(event.clientX, event.clientY);
  }

  @HostListener('document:mousemove', ['$event'])
  onDocumentMouseMove(event: MouseEvent): void {
    if (!this.visible) {
      return;
    }

    this.updateLu2EdgeScrollFromPointer(event.clientX, event.clientY);
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.visible) {
      return;
    }

    const isArrowDown = event.key === 'ArrowDown' || event.keyCode === 40;
    const isArrowUp = event.key === 'ArrowUp' || event.keyCode === 38;
    if (!isArrowDown && !isArrowUp) {
      return;
    }

    event.preventDefault();
    this.scrollLu2ByArrow(isArrowDown ? 1 : -1);
  }

  @HostListener('window:blur')
  onWindowBlur(): void {
    this.stopLu2EdgeScroll();
  }

  private updateLu2EdgeScrollFromPointer(clientX: number, clientY: number): void {
    const scrollArea = this.lu2ScrollAreaRef?.nativeElement;
    if (!scrollArea) {
      return;
    }

    const rect = scrollArea.getBoundingClientRect();
    const isWithinHorizontalBounds = clientX >= rect.left && clientX <= rect.right;
    if (!isWithinHorizontalBounds) {
      this.updateLu2EdgeScrollDirection(0);
      return;
    }

    let direction: -1 | 0 | 1 = 0;
    if (clientY < rect.top) {
      direction = -1;
    } else if (clientY > rect.bottom) {
      direction = 1;
    }

    this.updateLu2EdgeScrollDirection(direction);
  }

  getLu2ModeLabel(): 'Movie' | 'Show' {
    return this.mode === 'shows' ? 'Show' : 'Movie';
  }

  getLu2ModalTitle(): string {
    const baseTitle = `+LU ${this.getLu2ModeLabel()}`;
    if (!this.lu2HasSearched || this.lu2Results.length === 0) {
      return baseTitle;
    }

    return `${baseTitle} (${this.lu2Results.length})`;
  }

  getLu2Placeholder(): string {
    if (this.mode === 'shows') {
      return 'Search shows (example: Breaking Bad)';
    }

    return 'Search movies (example: matrix)';
  }

  clearLu2NoResultsToast(): void {
    this.showLu2NoResultsToast = false;
    this.clearLu2NoResultsTimer();
  }

  resetLu2SearchForRetry(): void {
    this.clearLu2NoResultsToast();
    this.lu2Results = [];
    this.lu2Error = '';
  }

  private normalizeLu2AssetUrl(path: string): string {
    if (!path) {
      return '';
    }

    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    return `${this.lu2AssetBase}${path.startsWith('/') ? '' : '/'}${path}`;
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

  private resetLu2SearchState(): void {
    this.stopLu2EdgeScroll();
    this.clearLu2SearchDebounceTimer();
    this.lu2Query = '';
    this.lu2HasSearched = false;
    this.lu2Results = [];
    this.lu2Error = '';
    this.showLu2NoResultsToast = false;
    this.clearLu2NoResultsTimer();
  }

  private parseLu2SearchHtml(html: string): Lu2MovieResult[] {
    if (!html?.trim()) {
      return [];
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const cards = Array.from(
      doc.querySelectorAll('.movie-item-style-2.movie-item-style-1, .show-item-style-2.show-item-style-1')
    );

    return cards
      .map((card) => {
        const linkEl = card.querySelector<HTMLAnchorElement>('.hvr-inner a, .mv-item-infor h6 a');
        const href = (linkEl?.getAttribute('href') ?? '').trim();
        const slug = this.extractLu2Slug(href);

        const title = this.extractText(card, '.mv-item-infor h6 a') || this.extractText(card, '.image__placeholder img') || 'Untitled';

        const yearRaw = this.extractText(card, '.year');
        const yearValue = Number.parseInt(yearRaw, 10);
        const year = Number.isNaN(yearValue) ? undefined : yearValue;

        const ratingRaw = this.extractText(card, '.rate span');
        const ratingValue = Number.parseFloat(ratingRaw);
        const imdbRating = Number.isNaN(ratingValue) ? undefined : ratingValue;

        const posterEl = card.querySelector<HTMLImageElement>('.image__placeholder img');
        const posterPath =
          posterEl?.getAttribute('data-src')?.trim() ||
          posterEl?.getAttribute('src')?.trim() ||
          '';

        if (!slug) {
          return null;
        }

        return {
          id_movie: 0,
          slug,
          title,
          description: 'Description unavailable from LU2 HTML search results.',
          year,
          imdb_rating: imdbRating,
          poster: posterPath ? { w300: posterPath } : undefined,
        } as Lu2MovieResult;
      })
      .filter((entry): entry is Lu2MovieResult => Boolean(entry));
  }

  private extractLu2Slug(href: string): string {
    if (!href) {
      return '';
    }

    const cleaned = href
      .replace(/^https?:\/\/[^/]+/i, '')
      .replace(/^\/movies\/view\//i, '')
      .replace(/^\/shows\/view\//i, '')
      .trim();

    return cleaned.split('?')[0].replace(/^\/+/, '');
  }

  private extractText(root: Element, selector: string): string {
    const value = root.querySelector(selector)?.textContent ?? '';
    return value.replace(/\s+/g, ' ').trim();
  }

  private scheduleLu2NoResultsToastHide(): void {
    this.clearLu2NoResultsTimer();
    this.lu2NoResultsTimer = window.setTimeout(() => {
      this.showLu2NoResultsToast = false;
      this.lu2NoResultsTimer = null;
    }, 3500);
  }

  private clearLu2NoResultsTimer(): void {
    if (this.lu2NoResultsTimer !== null) {
      window.clearTimeout(this.lu2NoResultsTimer);
      this.lu2NoResultsTimer = null;
    }
  }

  private clearLu2SearchDebounceTimer(): void {
    if (this.lu2SearchDebounceTimer !== null) {
      window.clearTimeout(this.lu2SearchDebounceTimer);
      this.lu2SearchDebounceTimer = null;
    }
  }

  private updateLu2EdgeScrollDirection(direction: -1 | 0 | 1): void {
    if (direction === this.lu2EdgeScrollDirection) {
      return;
    }

    if (direction === 0) {
      this.stopLu2EdgeScroll();
      return;
    }

    this.lu2EdgeScrollDirection = direction;
    if (this.lu2EdgeScrollTimer !== null) {
      return;
    }

    this.lu2EdgeScrollTimer = window.setInterval(() => {
      const scrollArea = this.lu2ScrollAreaRef?.nativeElement;
      if (!scrollArea || this.lu2EdgeScrollDirection === 0) {
        this.stopLu2EdgeScroll();
        return;
      }

      scrollArea.scrollBy({ top: this.lu2EdgeScrollDirection * this.lu2EdgeScrollStepPx });
    }, 16);
  }

  private scrollLu2ByArrow(direction: -1 | 1): void {
    const scrollArea = this.lu2ScrollAreaRef?.nativeElement;
    if (!scrollArea) {
      return;
    }

    scrollArea.scrollBy({ top: direction * this.lu2ArrowScrollStepPx, behavior: 'smooth' });
  }

  private stopLu2EdgeScroll(): void {
    this.lu2EdgeScrollDirection = 0;
    if (this.lu2EdgeScrollTimer !== null) {
      window.clearInterval(this.lu2EdgeScrollTimer);
      this.lu2EdgeScrollTimer = null;
    }
  }
}
