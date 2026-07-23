import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { FireLink } from '../../models/fire-link';

@Component({
  selector: 'app-fire-link-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fire-link-form.component.html',
  styleUrl: './fire-link-form.component.scss',
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
