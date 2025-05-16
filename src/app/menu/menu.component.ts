// src/app/menu/menu.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu.component.html',
})
export class MenuComponent {
  constructor(
    private router: Router,
    private firebaseService: FirebaseService
  ) {}

  async goToSession() {
    console.log('Creating new game...');
    try {
      const gameId = await this.firebaseService.createGame();
      localStorage.setItem('currentGameId', gameId);
      this.router.navigate(['/session']);
    } catch (error) {
      console.error('Failed to create new game:', error);
    }
  }
}
