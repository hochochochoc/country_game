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
  Timestamp,
  limit,
} from 'firebase/firestore';
import { environment } from '../../environments/environment';

export interface GameSummary {
  id: string;
  gameNumber: number;
  createdAt: Date;
  currentDate: Date;
  currentRound: number;
}

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
      // Get the highest game number so far
      const nextGameNumber = await this.getNextGameNumber();

      // Create game document with initial metadata and game number
      const gameData = {
        gameNumber: nextGameNumber,
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
        economy: 20,
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

      console.log(
        'New game created with ID:',
        gameId,
        'and number:',
        nextGameNumber
      );
      return gameId;
    } catch (error) {
      console.error('Error creating game:', error);
      throw error;
    }
  }

  private async getNextGameNumber(): Promise<number> {
    try {
      // Query to get the game with the highest number
      const gamesRef = collection(this.db, 'games');
      const q = query(gamesRef, orderBy('gameNumber', 'desc'), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return 1; // First game
      }

      const highestGame = querySnapshot.docs[0].data();
      return (highestGame['gameNumber'] || 0) + 1;
    } catch (error) {
      console.error('Error getting next game number:', error);
      return 1; // Default to 1 if there's an error
    }
  }

  async getAllGames(): Promise<GameSummary[]> {
    try {
      const gamesRef = collection(this.db, 'games');
      const q = query(gamesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const games: GameSummary[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        games.push({
          id: doc.id,
          gameNumber: data['gameNumber'] || 0,
          createdAt: data['createdAt instanceof Timestamp']
            ? data['createdAt.toDate()']
            : data['createdAt'],
          currentDate: data['currentDate instanceof Timestamp']
            ? data['currentDate.toDate()']
            : data['currentDate'],
          currentRound: data['currentRound'],
        });
      });

      return games;
    } catch (error) {
      console.error('Error getting games:', error);
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

      // Calculate updated values by adding changes to current values
      const updatedEconomy =
        result.changes.economy !== undefined
          ? gameData.economy + result.changes.economy
          : gameData.economy;

      const updatedStability =
        result.changes.stability !== undefined
          ? gameData.stability + result.changes.stability
          : gameData.stability;

      const updatedMilitary =
        result.changes.military !== undefined
          ? gameData.military + result.changes.military
          : gameData.military;

      // Calculate updated diplomacy values
      const updatedDiplomacy = {
        italy:
          result.changes.diplomacy?.italy !== undefined
            ? gameData.diplomacy.italy + result.changes.diplomacy.italy
            : gameData.diplomacy.italy,
        uk:
          result.changes.diplomacy?.uk !== undefined
            ? gameData.diplomacy.uk + result.changes.diplomacy.uk
            : gameData.diplomacy.uk,
        saudi:
          result.changes.diplomacy?.saudi !== undefined
            ? gameData.diplomacy.saudi + result.changes.diplomacy.saudi
            : gameData.diplomacy.saudi,
      };

      // Update round document
      await setDoc(
        roundRef,
        {
          pa: updatedPA,
          commands,
          economy: updatedEconomy,
          stability: updatedStability,
          military: updatedMilitary,
          diplomacy: updatedDiplomacy,
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
        events: [],
      });
    } catch (error) {
      console.error('Error advancing turn:', error);
      throw error;
    }
  }

  async processEvent(
    gameId: string,
    eventId: string,
    selectedOption: any
  ): Promise<void> {
    try {
      const gameData = await this.getGameState(gameId);
      const currentRound = gameData['currentRound'];

      // Get current round reference
      const roundRef = doc(this.db, `games/${gameId}/rounds/${currentRound}`);

      // Calculate updated values
      const updatedEconomy =
        selectedOption.changes?.economy !== undefined
          ? gameData.economy + selectedOption.changes.economy
          : gameData.economy;

      const updatedStability =
        selectedOption.changes?.stability !== undefined
          ? gameData.stability + selectedOption.changes.stability
          : gameData.stability;

      const updatedMilitary =
        selectedOption.changes?.military !== undefined
          ? gameData.military + selectedOption.changes.military
          : gameData.military;

      // Calculate updated diplomacy values
      const updatedDiplomacy = {
        italy:
          selectedOption.changes?.diplomacy?.italy !== undefined
            ? gameData.diplomacy.italy + selectedOption.changes.diplomacy.italy
            : gameData.diplomacy.italy,
        uk:
          selectedOption.changes?.diplomacy?.uk !== undefined
            ? gameData.diplomacy.uk + selectedOption.changes.diplomacy.uk
            : gameData.diplomacy.uk,
        saudi:
          selectedOption.changes?.diplomacy?.saudi !== undefined
            ? gameData.diplomacy.saudi + selectedOption.changes.diplomacy.saudi
            : gameData.diplomacy.saudi,
      };

      // Add event to history
      const eventData = {
        eventId,
        choice: selectedOption.text,
        outcome: selectedOption.outcome,
        changes: selectedOption.changes || {},
        timestamp: new Date(),
      };

      const events = gameData.events || [];
      events.push(eventData);

      // Update round document
      await setDoc(
        roundRef,
        {
          events,
          economy: updatedEconomy,
          stability: updatedStability,
          military: updatedMilitary,
          diplomacy: updatedDiplomacy,
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error processing event:', error);
      throw error;
    }
  }
}
