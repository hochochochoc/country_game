import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../services/firebase.service';

@Component({
  selector: 'app-session',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './session.component.html',
})
export class SessionComponent implements OnInit {
  gameId: string = '';
  gameState: any = null;
  command: string = '';

  constructor(
    private router: Router,
    private firebaseService: FirebaseService
  ) {}

  async ngOnInit() {
    // Get game ID from localStorage
    this.gameId = localStorage.getItem('currentGameId') || '';

    if (this.gameId) {
      try {
        this.gameState = await this.firebaseService.getGameState(this.gameId);
        console.log('Loaded game:', this.gameState);
      } catch (error) {
        console.error('Error loading game');
        this.goToMenu(); // Redirect back to menu if game not found
      }
    } else {
      console.error('No game ID found');
      this.goToMenu(); // Redirect back to menu
    }
  }

  async nextTurn() {
    if (!this.gameState) return;

    // Advance date by 3 months
    const newDate = new Date(this.gameState.currentDate.seconds * 1000);
    newDate.setMonth(newDate.getMonth() + 3);

    const updates = {
      currentDate: newDate,
      pa: 3,
    };

    try {
      this.gameState = await this.firebaseService.nextTurn(this.gameId);
      console.log('Advanced to next turn:', this.gameState);
    } catch (error) {
      console.error('Failed to advance turn');
    }
  }

  goToMenu() {
    this.router.navigate(['/menu']);
  }
}
