export interface EventOption {
  text: string;
  outcome: string;
  changes?: {
    economy?: number;
    stability?: number;
    military?: number;
    diplomacy?: {
      italy?: number;
      uk?: number;
      saudi?: number;
    };
  };
}

export interface GameEvent {
  id: string;
  round: number;
  title: string;
  description: string;
  options: EventOption[];
}
