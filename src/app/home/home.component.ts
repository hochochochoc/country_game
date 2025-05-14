import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  template: `
    <div
      class="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4"
      (click)="goToMenu()"
    >
      <h1 class="text-4xl font-bold text-gray-800 mb-4">Yemen simulator</h1>
      <p class="text-sm text-gray-600 text-center">
        Does not accurately represent Yemen's history or culture, this is an
        amateur project.
      </p>
    </div>
  `,
})
export class HomeComponent {
  constructor(private router: Router) {}

  goToMenu() {
    console.log('goToMenu called');
    this.router.navigate(['/menu']);
  }
}
