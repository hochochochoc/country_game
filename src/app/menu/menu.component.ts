import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  standalone: true,
  templateUrl: './menu.component.html',
})
export class MenuComponent {
  constructor(private router: Router) {}

  goToSession() {
    console.log('goToSession called');
    this.router.navigate(['/session']);
  }
}
