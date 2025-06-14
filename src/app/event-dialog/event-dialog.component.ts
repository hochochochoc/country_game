import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameEvent, EventOption } from '../models/event.model';

@Component({
  selector: 'app-event-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div
        class="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fadeIn"
      >
        <h2 class="text-xl font-bold mb-3">{{ event.title }}</h2>
        <p class="text-gray-700 mb-6">{{ event.description }}</p>

        <div class="flex flex-col space-y-2">
          <button
            *ngFor="let option of event.options"
            (click)="selectOption(option)"
            class="px-4 py-2 bg-orange-700 text-white rounded hover:bg-orange-800 transition-colors"
          >
            {{ option.text }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .animate-fadeIn {
        animation: fadeIn 0.3s ease-out;
      }
    `,
  ],
})
export class EventDialogComponent {
  @Input() event!: GameEvent;
  @Output() optionSelected = new EventEmitter<EventOption>();

  selectOption(option: EventOption) {
    this.optionSelected.emit(option);
  }
}
