// utils/geminiService.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyCiuL5VrLx4aUqB5-CXRTf0xo_CtgcrMA8'); // You'll need to get this from Google AI Studio

export interface ScenarioResponse {
  title: string;
  description: string;
  initialSituation: string;
  environment: string;
  objectives: string[];
  hazards: string[];
  availableResources: string[];
  timePressure: number;
  difficulty: number;
  scenarioType: 'earthquake' | 'fire' | 'flood' | 'hurricane' | 'medical' | 'tsunami';
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateScenario(scenarioType: string, difficulty: number = 3): Promise<ScenarioResponse> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
      Generate a realistic emergency preparedness training scenario for a ${scenarioType} disaster.
      Difficulty level: ${difficulty}/5
      
      Return ONLY a JSON object with the following structure:
      {
        "title": "Creative scenario title",
        "description": "Brief overview of the scenario",
        "initialSituation": "Detailed starting situation the user finds themselves in",
        "environment": "Description of the physical environment",
        "objectives": ["objective1", "objective2", "objective3"],
        "hazards": ["hazard1", "hazard2", "hazard3"],
        "availableResources": ["resource1", "resource2", "resource3", "resource4"],
        "timePressure": number (seconds between 120-300),
        "difficulty": ${difficulty},
        "scenarioType": "${scenarioType}"
      }

      Make it realistic, educational, and engaging. Focus on actual emergency procedures.
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Invalid response format from Gemini');
    } catch (error) {
      console.error('Gemini API Error:', error);
      // Fallback scenario
      return this.getFallbackScenario(scenarioType, difficulty);
    }
  }

  async generateConsequence(action: string, currentSituation: string, scenarioType: string): Promise<{
    description: string;
    healthChange: number;
    situationChange: string;
    success: boolean;
  }> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
      Evaluate this emergency action and generate a realistic consequence:
      
      Scenario: ${scenarioType}
      Current Situation: ${currentSituation}
      Action Taken: ${action}
      
      Return ONLY a JSON object:
      {
        "description": "Realistic consequence description",
        "healthChange": number between -20 and 20,
        "situationChange": "How the situation evolves",
        "success": boolean
      }
      
      Make it educational and based on real emergency procedures.
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      // Fallback consequence
      return {
        description: "You take action and the situation evolves.",
        healthChange: 0,
        situationChange: currentSituation + " The situation continues to develop.",
        success: true
      };
    }
  }

  private getFallbackScenario(scenarioType: string, difficulty: number): ScenarioResponse {
    const scenarios: { [key: string]: ScenarioResponse } = {
      earthquake: {
        title: "Office Building Earthquake",
        description: "A major earthquake strikes while you're working in a high-rise office building",
        initialSituation: "You're on the 12th floor when violent shaking begins. Computers fall, ceiling tiles drop, and the building sways dangerously. Emergency lights flicker on.",
        environment: "Modern office building with glass walls, emergency exits, and multiple floors",
        objectives: ["Protect yourself from falling debris", "Evacuate to safety", "Help coworkers if possible"],
        hazards: ["Falling objects", "Broken glass", "Structural damage", "Aftershocks"],
        availableResources: ["Office desk", "Emergency flashlight", "First aid kit", "Cell phone"],
        timePressure: 180,
        difficulty: difficulty,
        scenarioType: "earthquake"
      },
      fire: {
        title: "Apartment Building Fire",
        description: "A fire breaks out in your apartment building while you're sleeping",
        initialSituation: "You wake up to smoke alarms and the smell of smoke. Your room is filling with smoke, and you hear crackling from the hallway.",
        environment: "Residential apartment building with smoke-filled corridors and emergency exits",
        objectives: ["Evacuate safely", "Avoid smoke inhalation", "Alert neighbors", "Call for help"],
        hazards: ["Thick smoke", "Intense heat", "Blocked exits", "Panic"],
        availableResources: ["Wet towel", "Flashlight", "Cell phone", "Emergency ladder"],
        timePressure: 120,
        difficulty: difficulty,
        scenarioType: "fire"
      }
    };

    return scenarios[scenarioType] || scenarios.earthquake;
  }
}