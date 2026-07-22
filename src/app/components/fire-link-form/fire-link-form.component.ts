import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { FireLink } from '../../models/fire-link';

@Component({
  selector: 'app-fire-link-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" *ngIf="visible">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Edit Fire Link' : 'Create Fire Link' }}</h3>
          <button class="btn btn-secondary" type="button" (click)="cancel.emit()">Close</button>
        </div>

        <form #form="ngForm" (ngSubmit)="save.emit(form)" class="modal-body" novalidate>
          <label class="field-label" for="name">Fire Name</label>
          <input id="name" name="name" type="text" [(ngModel)]="model.name" #nameControl="ngModel" required placeholder="LUMovies" />
          <div class="field-message" *ngIf="form.submitted || nameControl.touched"><span *ngIf="nameControl.errors?.['required']" class="error">Fire Name is required.</span></div>

          <label class="field-label" for="icon">Fire Icon</label>
          <input id="icon" name="icon" type="url" [(ngModel)]="model.icon" required placeholder="/fire.ico" />
          <div class="preview"><img [src]="model.icon || '/fire.ico'" alt="Fire icon preview" /></div>

          <label class="field-label" for="url">Fire Link</label>
          <textarea id="url" name="url" rows="5" [(ngModel)]="model.url" #urlControl="ngModel" required placeholder="https://..."></textarea>
          <div class="field-message" *ngIf="form.submitted || urlControl.touched"><span *ngIf="urlControl.errors?.['required']" class="error">Fire Link is required.</span></div>

          <div class="form-actions">
            <button class="btn btn-outline btn-outline-primary" type="submit" [disabled]="form.invalid || !isAuthenticated">{{ isEditing ? 'Save changes' : 'Save' }}</button>
            <button class="btn btn-outline btn-outline-secondary" type="button" (click)="cancel.emit()">Cancel</button>
            <button *ngIf="isEditing && isAuthenticated" class="btn btn-outline btn-outline-danger" type="button" (click)="delete.emit(model)">Delete</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `.modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; z-index: 60; padding: 1.5rem; }`,
    `.modal { width: 100%; max-width: 820px; background: #ffffff; border-radius: 0.75rem; box-shadow: 0 20px 60px rgba(2,6,23,0.4); overflow: hidden; }`,
    `.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid #eef2ff; }`,
    `.modal-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }`,
    `.field-label { display: block; margin-bottom: 0.5rem; font-weight: 600; }`,
    `input, textarea { width: 100%; border: 1px solid #d1d5db; border-radius: 0.75rem; padding: 0.9rem 1rem; font-size: 0.95rem; color: #111827; background: #ffffff; }`,
    `.preview { margin: 0.75rem 0 1.25rem; display: flex; justify-content: center; align-items: center; min-height: 120px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.75rem; }`,
    `.preview img { max-width: 100%; max-height: 150px; border-radius: 0.75rem; object-fit: contain; }`,
    `.field-message { min-height: 1.25rem; font-size: 0.875rem; color: #dc2626; margin-top: 0.25rem; }`,
    `.form-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1rem; }`,
    `.btn { border: none; border-radius: 0.75rem; padding: 0.8rem 1.25rem; font-size: 0.95rem; cursor: pointer; transition: transform 0.15s ease, background-color 0.15s ease; }`,
    `.btn:hover { transform: translateY(-1px); }`,
    `.btn-outline { background: transparent; border: 1px solid currentColor; color: inherit; }`,
    `.btn-outline-primary { color: #2563eb; border-color: #c7d2fe; }`,
    `.btn-outline-secondary { color: #374151; border-color: #e5e7eb; }`,
    `.btn-outline-danger { color: #b91c1c; border-color: #fecaca; }`,
    `.btn[disabled], .btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; filter: grayscale(0.15); }`,
    `.btn-secondary { background: #f3f4f6; color: #111827; }`
  ],
})
export class FireLinkFormComponent {
  @Input() visible = false;
  @Input() model: FireLink = { id: 0, name: '', icon: '', url: '' };
  @Input() isEditing = false;
  @Input() isAuthenticated = false;
  @Output() save = new EventEmitter<NgForm>();
  @Output() cancel = new EventEmitter<void>();
  @Output() delete = new EventEmitter<FireLink>();
}
