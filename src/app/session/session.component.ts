import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-session',
  standalone: true,

  templateUrl: './session.component.html',
})
export class SessionComponent {
  constructor(private router: Router) {}

  goToMenu() {
    console.log('goToMenu called');
    this.router.navigate(['/menu']);
  }
}
