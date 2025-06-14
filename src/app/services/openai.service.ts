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
  events?: EventHistoryItem[];
}

interface CommandHistoryItem {
  command: string;
  result: string;
  outcome: string;
}

interface EventHistoryItem {
  eventId: string;
  choice: string;
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
    // Generate random roll between 0 and 100
    const roll = Math.floor(Math.random() * 101);
    console.log('Random roll generated:', roll);

    const historicalContext = this.buildHistoricalContext(gameState.date);
    const prompt = this.buildPrompt(
      command,
      gameState,
      commandHistory,
      historicalContext,
      roll
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
            Evaluate player commands and determine outcomes based on general historical context, game state, and the provided random roll.
            
            IMPORTANT ROLL MECHANICS:
            - You will receive a random roll between 0-100
            - 0-10: Forces Catastrophic Failure regardless of plausibility
            - 11-35: Weighs towards Failure, but consider context
            - 36-65: Normal probability distribution based on plausibility and context
            - 66-90: Weighs towards Success (not excellent), but consider context  
            - 91-100: Forces Excellent outcome almost regardless of plausibility
            
            The roll represents luck/chance, but should be secondary to and complementary to the plausibility of the action based on game state and context.
            
            Take special care to consider the previous commands and their outcomes, especially if they are building towards the goal of the current command. 
            E.g. if an intelligence agency was set up a few years ago and a listening post was created in another country, the player should be able to command intelligence operations in that country. 
            

            IMPORTANT: ALL stats are between 0 and 100. and represent development levels, not resources. They (especially the economy during purchases) are not expended but can be impacted by decisions and events. 
            The stats are also important for determining the plausibility of commands, some becoming easier the higher a corresponding stat is.
            While the economy is humble, the player should be allowed to make moderate investments and improvements, like infrastructure projects, buying military equipment. 
            For reference, in the beginning at max a fleet of cars. The economy stat does not symbolize a budget, simply the state of the economy, but does influence how large expenses can be, so as it grows larger projects become possible. 
            Unsuccessful acquisitions or projects should not be penalized with a loss of economy points, except when extreme failure makes this reasonable. 
            There should be less permissiveness for social reforms reflecting the traditional, tribal and decentralized society. 
            As stability and authority increase there should be more likelihood of this increasing.
            Diplomacy is a measure of the relationship with other countries, not their strength. It should be used to determine how likely they are to support or oppose the player, if it reaches 0 war is declared. 
            Note that if it's not implicit, stat changes in diplomacy, military and stability should not be applied randomly, especially if outcomes are ambiguous or hint at future but not immediate success. No increase or decrease in saudi diplo if the command is not directly related to them, for example.
            An excellent outcome should be more than just the success of the command but something extra.

            Don't give negative likelihoods to commands simply because they are unethical or tyrannical, keep your evaluation neutral and objective and based on the historical context and game state. 
            This applies especially to suppressing resistance within reason, especially as campaigns go on.

            IMPORTANT: For each player command:
            1. Consider the random roll and its impact on outcome likelihood
            2. Evaluate the plausibility of the command based on context and game state
            3. Combine roll luck with plausibility to determine the final outcome
            4. Generate appropriate description and stat changes for the selected outcome

            In the outcome description, avoid restating the main points of the command and instead focus on results, building on the command and previous outcomes, 
            as well as adding minor flavor details while avoiding commentary that's too generic and bland. 
            Avoid too many flourishes and ai speak and keep the context of 30s yemen in mind always. 
            Should be humorous occasionally but not too much and not always, if you find the recent comments too dry, add some humor to the next one.
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
    historicalContext: string,
    roll: number
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

Random Roll: ${roll} 

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
