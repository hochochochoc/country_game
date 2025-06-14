import { Injectable } from '@angular/core';
import { GameEvent } from '../models/event.model';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private events: GameEvent[] = [
    {
      id: 'carl_rathjens_arrival',
      round: 1,
      title: 'German Advisor Arrives',
      description:
        'Carl Rathjens, a German engineer and advisor, has arrived in Sanaa. He offers his expertise in modernization and could help establish better relations with European powers. Will you receive him at your court?',
      options: [
        {
          text: 'Receive him at court',
          outcome:
            'You welcome Carl Rathjens warmly. His expertise could prove valuable for modernization efforts, and European powers take note of your openness.',
          changes: {
            economy: 2,
            diplomacy: {
              italy: 3,
              uk: -1,
            },
          },
        },
        {
          text: 'Turn him away',
          outcome:
            'You decline to receive the German advisor. While this maintains your independence, you miss an opportunity for technical expertise.',
          changes: {
            stability: 1,
            diplomacy: {
              uk: 1,
            },
          },
        },
      ],
    },
    {
      id: 'tribal_dispute',
      round: 2,
      title: 'Tribal Conflict Escalates',
      description:
        'A dispute between two influential tribes in the northern highlands threatens to escalate into violence. They seek your judgment on the matter.',
      options: [
        {
          text: 'Mediate personally',
          outcome:
            'Your personal involvement in mediation strengthens your authority but consumes valuable time and resources.',
          changes: {
            stability: 3,
            economy: -1,
          },
        },
        {
          text: 'Send a representative',
          outcome:
            'You dispatch a trusted advisor to handle the dispute. This maintains distance but may be seen as weakness.',
          changes: {
            stability: 1,
          },
        },
      ],
    },
  ];

  constructor() {}

  getEventForRound(round: number): GameEvent | null {
    return this.events.find((event) => event.round === round) || null;
  }

  getEventById(id: string): GameEvent | null {
    return this.events.find((event) => event.id === id) || null;
  }
}
