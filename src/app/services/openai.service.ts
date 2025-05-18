import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import OpenAI from 'openai';

interface CommandResult {
  result: string; // 'Excellent', 'Moderate Success', 'Failure', 'Catastrophic Failure'
  outcome: string;
  changes: {
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

interface GameState {
  date: { seconds: number };
  economy: number;
  stability: number;
  military: number;
  diplomacy: {
    italy: number;
    uk: number;
    saudi: number;
  };
}

interface CommandHistoryItem {
  command: string;
  result: string;
  outcome: string;
}

@Injectable({
  providedIn: 'root',
})
export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: environment.openai.apiKey,
      dangerouslyAllowBrowser: true,
    });
  }

  async processCommand(
    command: string,
    gameState: GameState,
    commandHistory: CommandHistoryItem[]
  ): Promise<CommandResult> {
    const historicalContext = this.buildHistoricalContext(gameState.date);
    const prompt = this.buildPrompt(
      command,
      gameState,
      commandHistory,
      historicalContext
    );

    console.log('Sending prompt to OpenAI:', prompt);

    return this.callOpenAI(prompt);
  }

  private async callOpenAI(prompt: string): Promise<CommandResult> {
    try {
      const response = await this.openai.chat.completions.create({
        model: environment.openai.model,
        messages: [
          {
            role: 'system',
            content: `You are an AI simulating Yemen's historical development from 1930 to 1936. 
            Evaluate player commands and determine outcomes based on general historical context and most importantly game state. 
            Take special care to consider the previous commands and their outcomes, especially if they are building towards the goal of the current command. 
            E.g. if an intelligence agency was set up a few years ago and a listening post was created in another country, the player should be able to command intelligence operations in that country. 
            Also note that I don't want every outcome to be a moderate success, there should always be the chance of any outcome, the probabilities should just be adjusted to the context. Always moderate success gets really boring, at the very least make the text interesting then. 

            IMPORTANT: ALL stats are between 0 and 100. and represent development levels, not resources. They are not expended but can be impacted by decisions and events. 
            While the economy is humble, the player should be allowed to make moderate investments and improvements, like infrastructure projects, buying military equipment. 
            For reference, in the beginning at max a fleet of cars. The economy stat does not symbolize a budget, simply the state of the economy, but does influence how large expenses can be, so as it grows larger projects become possible. 
            Unsuccessful acquisitions or projects should not be penalized with a loss of economy points, except when extreme failure makes this reasonable. There should be less permissiveness for social reforms reflecting the traditional, tribal and decentralized society. 
            As stability and authority increase there should be more likelihood of this increasing. 

            IMPORTANT: For each player command:
            1. Determine probabilities out of 100% for four possible outcomes (Excellent, Moderate Success, Failure, Catastrophic Failure) based on previous instructions. However, the probability of each outcome can't be below 5%.
            2. Roll a virtual 100-sided die and select ONE outcome based on these probabilities.
            3. Generate appropriate description and stat changes for the selected outcome.

            In the outcome description, avoid restating the main points of the command and instead focus on results, building on the command and previous outcomes, as well as adding minor flavor details while avoiding commentary that's too generic and bland. 
            Write like a historian might, avoid too many flourishes and ai speak and keep the context of 30s yemen in mind always. 
            Can be humorous occasionally but not too much and not always.
            Do keep outcome descriptions brief (always under 50 words, sometimes under 30).

            Respond with a JSON object only containing: 
            {
              "result": "Excellent|Moderate Success|Failure|Catastrophic Failure",
              "outcome": "Brief description of what happened",
              "changes": {
                "economy": change_value,
                "stability": change_value,
                "military": change_value,
                "diplomacy": {
                  "italy": change_value,
                  "uk": change_value,
                  "saudi": change_value
                }
              }
            }`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      });

      const content = response.choices[0].message.content;
      console.log('OpenAI response:', content);

      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      return JSON.parse(content) as CommandResult;
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      throw error;
    }
  }

  private buildPrompt(
    command: string,
    gameState: GameState,
    commandHistory: CommandHistoryItem[],
    historicalContext: string
  ): string {
    const date = new Date(gameState.date.seconds * 1000);
    const formattedDate = `${date.toLocaleString('default', {
      month: 'long',
    })} ${date.getFullYear()}`;

    return `
Current Date: ${formattedDate}
Current Game State:
- Economy: ${gameState.economy}
- Stability: ${gameState.stability}
- Military: ${gameState.military}
- Diplomacy:
  - Italy: ${gameState.diplomacy.italy}
  - UK: ${gameState.diplomacy.uk}
  - Saudi Arabia: ${gameState.diplomacy.saudi}

Historical Context:
${historicalContext}

Command History:
${this.formatCommandHistory(commandHistory)}

Player Command: "${command}"
`;
  }

  private formatCommandHistory(commandHistory: CommandHistoryItem[]): string {
    if (!commandHistory || commandHistory.length === 0) {
      return 'No previous commands.';
    }

    return commandHistory
      .map(
        (cmd) =>
          `- Command: "${cmd.command}"\n  Result: ${cmd.result} - ${cmd.outcome}`
      )
      .join('\n');
  }

  private buildHistoricalContext(date: { seconds: number }): string {
    const year = new Date(date.seconds * 1000).getFullYear();

    const contexts: Record<string, string> = {
      default: `Only North Yemen in the 1930s was controlled by the Mutawakkilite Kingdom under Imam Yahya Muhammad Hamid ed-Din. The South was a British protectorate centered around Aden.`,

      1930: `In 1930, Yemen was largely isolated, with Imam Yahya pursuing modernization while maintaining independence and consolidating power over the tribes. Italy and the UK competed for influence in the Red Sea region. Moderate taxes from tribes, crafted goods from population centers, agriculture and fisheries on the coast were the main economic activities, providing the government with funds to make moderate investments and acquisitions and start projects.`,

      1934: `In 1934, Saudi-Yemeni tensions escalated into the Saudi-Yemeni War.`,
    };

    if (year < 1932) return contexts['1930'] || contexts['default'];
    else if (year < 1935) return contexts['1934'] || contexts['default'];
    else return contexts['default'];
  }
}
