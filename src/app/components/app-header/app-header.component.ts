import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type FireMenuTab = 'main' | 'watched' | 'favorites' | 'all';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.scss'
})
export class AppHeaderComponent {
  @Input() isAuthenticated = false;
  @Input() appVersion = '';
  @Input() selectedTab: FireMenuTab = 'main';
  @Input() tabs: Array<{ label: string; value: FireMenuTab }> = [];
  @Input() isModalActive = false;
  @Input() enableDebug = false;

  @Output() loginClick = new EventEmitter<void>();
  @Output() logoutClick = new EventEmitter<void>();
  @Output() tabSelected = new EventEmitter<FireMenuTab>();
  @Output() headerDoubleClick = new EventEmitter<MouseEvent>();
  @Output() enableDebugChange = new EventEmitter<boolean>();

  showSettingsMenu = false;
  showTabsMenu = false;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (this.showSettingsMenu && !target.closest('.settings-menu')) {
      this.showSettingsMenu = false;
    }

    if (this.showTabsMenu && !target.closest('.tabs-dropdown')) {
      this.showTabsMenu = false;
    }
  }

  toggleSettingsMenu(): void {
    this.showSettingsMenu = !this.showSettingsMenu;
  }

  toggleTabsMenu(): void {
    this.showTabsMenu = !this.showTabsMenu;
  }

  getCurrentTabLabel(): string {
    const currentTab = this.tabs.find((t) => t.value === this.selectedTab);
    return currentTab?.label || 'Select Tab';
  }

  onSelectTab(tab: FireMenuTab): void {
    this.tabSelected.emit(tab);
    this.showTabsMenu = false;
  }

  onLogoutClick(): void {
    this.showSettingsMenu = false;
    this.logoutClick.emit();
  }

  onEnableDebugToggle(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.enableDebugChange.emit(!!target?.checked);
    this.showSettingsMenu = false;
  }
}
