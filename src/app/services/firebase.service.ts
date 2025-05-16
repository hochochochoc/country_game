import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
  DocumentData,
} from 'firebase/firestore';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private app = initializeApp(environment.firebase);
  private db = getFirestore(this.app);

  constructor() {
    console.log('Firebase initialized');
  }

  async createGame(): Promise<string> {
    try {
      // Create game document with initial metadata
      const gameData = {
        createdAt: new Date(),
        currentDate: new Date(1930, 0, 1),
        currentRound: 1,
      };

      const gameRef = await addDoc(collection(this.db, 'games'), gameData);
      const gameId = gameRef.id;

      // Create first round document in rounds subcollection
      const initialRound = {
        roundNumber: 1,
        date: new Date(1930, 0, 1),
        pa: 3,
        economy: 10,
        stability: 20,
        military: 20,
        diplomacy: {
          italy: 50,
          uk: 30,
          saudi: 20,
        },
        commands: [],
      };

      await setDoc(doc(this.db, `games/${gameId}/rounds/1`), initialRound);

      console.log('New game created with ID:', gameId);
      return gameId;
    } catch (error) {
      console.error('Error creating game:', error);
      throw error;
    }
  }

  async getGameState(gameId: string): Promise<any> {
    try {
      // Get game metadata
      const gameRef = doc(this.db, 'games', gameId);
      const gameSnap = await getDoc(gameRef);

      if (!gameSnap.exists()) {
        throw new Error('Game not found');
      }

      const gameData = gameSnap.data();
      const currentRound = gameData['currentRound'];

      // Get current round data
      const roundRef = doc(this.db, `games/${gameId}/rounds/${currentRound}`);
      const roundSnap = await getDoc(roundRef);

      if (!roundSnap.exists()) {
        throw new Error('Round data not found');
      }

      // Return combined data
      return {
        ...gameData,
        ...roundSnap.data(),
      };
    } catch (error) {
      console.error('Error getting game:', error);
      throw error;
    }
  }

  async addCommand(
    gameId: string,
    command: string,
    result: any
  ): Promise<void> {
    try {
      const gameData = await this.getGameState(gameId);
      const currentRound = gameData['currentRound'];

      // Add command to the current round
      const roundRef = doc(this.db, `games/${gameId}/rounds/${currentRound}`);

      // Update PA points
      const updatedPA = gameData.pa - 1;

      // Add command to history
      const commandData = {
        command,
        result: result.result,
        outcome: result.outcome,
        changes: result.changes,
        timestamp: new Date(),
      };

      // Get existing commands
      const commands = gameData.commands || [];
      commands.push(commandData);

      // Update round document
      await setDoc(
        roundRef,
        {
          pa: updatedPA,
          commands,
          economy:
            result.changes.economy !== undefined
              ? result.changes.economy
              : gameData.economy,
          stability:
            result.changes.stability !== undefined
              ? result.changes.stability
              : gameData.stability,
          military:
            result.changes.military !== undefined
              ? result.changes.military
              : gameData.military,
          diplomacy: {
            italy:
              result.changes.diplomacy?.italy !== undefined
                ? result.changes.diplomacy.italy
                : gameData.diplomacy.italy,
            uk:
              result.changes.diplomacy?.uk !== undefined
                ? result.changes.diplomacy.uk
                : gameData.diplomacy.uk,
            saudi:
              result.changes.diplomacy?.saudi !== undefined
                ? result.changes.diplomacy.saudi
                : gameData.diplomacy.saudi,
          },
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error adding command:', error);
      throw error;
    }
  }

  async nextTurn(gameId: string): Promise<void> {
    try {
      // Get current game state
      const gameData = await this.getGameState(gameId);

      // Calculate new date (3 months later)
      const currentDate = new Date(gameData['date'].seconds * 1000);
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + 3);

      // Calculate new round number
      const newRound = gameData['currentRound'] + 1;

      // Update game metadata
      await setDoc(
        doc(this.db, 'games', gameId),
        {
          currentDate: newDate,
          currentRound: newRound,
        },
        { merge: true }
      );

      // Create new round document with previous stats
      await setDoc(doc(this.db, `games/${gameId}/rounds/${newRound}`), {
        roundNumber: newRound,
        date: newDate,
        pa: 3,
        economy: gameData.economy,
        stability: gameData.stability,
        military: gameData.military,
        diplomacy: gameData.diplomacy,
        commands: [],
      });
    } catch (error) {
      console.error('Error advancing turn:', error);
      throw error;
    }
  }
}
