import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" *ngIf="visible">
      <div class="modal login-modal">
        <div class="modal-header">
          <h3>Sign in</h3>
          <button class="btn btn-secondary" type="button" (click)="close.emit()">Close</button>
        </div>
        <form #authForm="ngForm" (ngSubmit)="submit.emit(authForm)" class="modal-body login-form">
          <div class="login-row">
            <label for="authEmail">Email</label>
            <input id="authEmail" name="authEmail" type="email" [ngModel]="email" (ngModelChange)="emailChange.emit($event)" required placeholder="you@example.com" />
          </div>
          <div class="login-row">
            <label for="authPassword">Password</label>
            <input id="authPassword" name="authPassword" type="password" [ngModel]="password" (ngModelChange)="passwordChange.emit($event)" required placeholder="Password" />
          </div>
          <div class="login-row login-controls">
            <button class="btn btn-primary" type="submit">Sign in</button>
            <button class="btn btn-secondary" type="button" (click)="close.emit()">Cancel</button>
          </div>
          <div class="auth-error" *ngIf="error">{{ error }}</div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `:host { display: block; }`,
    `.modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; z-index: 60; padding: 1.5rem; }`,
    `.modal { width: 100%; max-width: 820px; background: #ffffff; border-radius: 0.75rem; box-shadow: 0 20px 60px rgba(2,6,23,0.4); overflow: hidden; }`,
    `.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid #eef2ff; }`,
    `.modal-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }`,
    `.login-modal { max-width: 420px; width: 100%; }`,
    `.login-form .login-row { display: flex; flex-direction: column; gap: 0.4rem; }`,
    `.login-controls { flex-direction: row; gap: 0.75rem; }`,
    `.auth-error { color: #dc2626; font-size: 0.9rem; }`,
    `.btn { border: none; border-radius: 0.75rem; padding: 0.8rem 1.25rem; font-size: 0.95rem; cursor: pointer; transition: transform 0.15s ease, background-color 0.15s ease; }`,
    `.btn:hover { transform: translateY(-1px); }`,
    `.btn-primary { background: #2563eb; color: #ffffff; }`,
    `.btn-secondary { background: #f3f4f6; color: #111827; }`,
    `label { font-weight: 600; }`,
    `input { width: 100%; border: 1px solid #d1d5db; border-radius: 0.75rem; padding: 0.9rem 1rem; font-size: 0.95rem; color: #111827; background: #ffffff; }`
  ],
})
export class LoginModalComponent {
  @Input() visible = false;
  @Input() email = '';
  @Input() password = '';
  @Input() error = '';
  @Output() emailChange = new EventEmitter<string>();
  @Output() passwordChange = new EventEmitter<string>();
  @Output() submit = new EventEmitter<NgForm>();
  @Output() close = new EventEmitter<void>();
}
