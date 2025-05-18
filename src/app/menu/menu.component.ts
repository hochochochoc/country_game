import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FirebaseService, GameSummary } from '../services/firebase.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu.component.html',
})
export class MenuComponent implements OnInit {
  savedGames: GameSummary[] = [];
  isLoading = true;

  constructor(
    private router: Router,
    private firebaseService: FirebaseService
  ) {}

  async ngOnInit() {
    try {
      this.savedGames = await this.firebaseService.getAllGames();
      this.isLoading = false;
    } catch (error) {
      console.error('Failed to load saved games:', error);
      this.isLoading = false;
    }
  }

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

  loadGame(gameId: string) {
    console.log('Loading game:', gameId);
    localStorage.setItem('currentGameId', gameId);
    this.router.navigate(['/session']);
  }

  formatDate(date: any): string {
    if (!date) return 'Unknown date';

    // Convert Firestore Timestamp to Date if needed
    const dateObj =
      date instanceof Date
        ? date
        : date.toDate
        ? date.toDate()
        : new Date(date);

    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
