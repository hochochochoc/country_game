import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../services/firebase.service';
import { OpenAIService } from '../services/openai.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons';
import { MapComponent } from '../map/map.component';
import { IssuesComponent } from '../issues/issues.component';
import { MilComponent } from '../mil/mil.component';

@Component({
  selector: 'app-session',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    MapComponent,
    IssuesComponent,
    MilComponent,
  ],
  templateUrl: './session.component.html',
})
export class SessionComponent implements OnInit {
  faArrowUp = faArrowUp;
  gameId: string = '';
  gameState: any = null;
  command: string = '';
  isProcessing: boolean = false;
  activeTab: string = 'map';

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

  formatDate(date: any): string {
    if (!date) return 'Unknown date';

    // Convert Firestore Timestamp to Date if needed
    const dateObj =
      date instanceof Date
        ? date
        : date.toDate
        ? date.toDate()
        : date.seconds
        ? new Date(date.seconds * 1000)
        : new Date(date);

    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  }

  getLowestDiplomacyValue(): number {
    if (!this.gameState?.diplomacy) return 0;

    const diplomacy = this.gameState.diplomacy;
    return Math.min(
      diplomacy.italy || 0,
      diplomacy.uk || 0,
      diplomacy.saudi || 0
    );
  }

  getLowestDiplomacyCountry(): string {
    if (!this.gameState?.diplomacy) return 'Diplomacy';

    const diplomacy = this.gameState.diplomacy;
    const minValue = this.getLowestDiplomacyValue();

    if (diplomacy.italy === minValue) return 'Italy';
    if (diplomacy.uk === minValue) return 'UK';
    if (diplomacy.saudi === minValue) return 'Saudi';

    return 'Diplomacy';
  }

  getLastCommand(): any {
    if (!this.gameState?.commands || this.gameState.commands.length === 0) {
      return null;
    }
    return this.gameState.commands[this.gameState.commands.length - 1];
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

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}
