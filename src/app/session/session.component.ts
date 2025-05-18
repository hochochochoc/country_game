import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../services/firebase.service';
import { OpenAIService } from '../services/openai.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-session',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './session.component.html',
})
export class SessionComponent implements OnInit {
  faArrowUp = faArrowUp;
  gameId: string = '';
  gameState: any = null;
  command: string = '';
  isProcessing: boolean = false;

  constructor(
    private router: Router,
    private firebaseService: FirebaseService,
    private openAIService: OpenAIService
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

  async submitCommand() {
    if (!this.command.trim() || this.isProcessing || !this.gameState) {
      return;
    }

    if (this.gameState.pa <= 0) {
      console.log('No PA points left! Advance to next turn.');
      return;
    }

    this.isProcessing = true;
    console.log('Processing command:', this.command);

    try {
      // Process command with OpenAI
      const result = await this.openAIService.processCommand(
        this.command,
        this.gameState,
        this.gameState.commands || []
      );

      console.log('Command result:', result);

      // Save the command and result to Firebase
      await this.firebaseService.addCommand(this.gameId, this.command, result);

      // Refresh game state
      this.gameState = await this.firebaseService.getGameState(this.gameId);
      this.command = ''; // Clear the command input
    } catch (error) {
      console.error('Error processing command:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  async nextTurn() {
    if (!this.gameState) return;

    try {
      await this.firebaseService.nextTurn(this.gameId);
      this.gameState = await this.firebaseService.getGameState(this.gameId);
      console.log('Advanced to next turn:', this.gameState);
    } catch (error) {
      console.error('Failed to advance turn');
    }
  }

  goToMenu() {
    this.router.navigate(['/menu']);
  }
}
