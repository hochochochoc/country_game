import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
})
export class HomeComponent {
  constructor(private router: Router) {}

  goToMenu() {
    console.log('goToMenu called');
    this.router.navigate(['/menu']);
  }
}
