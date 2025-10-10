import { GoogleGenerativeAI } from "@google/generative-ai";

export interface EducationalContent {
  id: string;
  title: string;
  description: string;
  type: 'infographic' | 'video' | 'guide' | 'simulation';
  category: 'water' | 'food' | 'safety' | 'health' | 'shelter' | 'general';
  duration: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  points: number;
  completed: boolean;
  content: string; // URL or text content
  resources: string[];
  tags: string[];
}

import { GEMINI_API_KEY } from "@/constants/gemini";

const API_KEY = GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const predefinedTopics = [
    "Emergency Water Purification",
    "Building a 3-Day Emergency Food Supply",
    "Basic First Aid for Common Injuries",
    "Creating a Home Fire Escape Plan",
    "Family Emergency Communication Plan",
    "Assembling a Go-Bag",
    "Understanding Weather Alerts",
    "Basic Shelter-in-Place Techniques",
];

const generatedContentCache = new Map<string, EducationalContent>();

export const fetchEducationalContent = async (topic: string): Promise<EducationalContent> => {
    if (generatedContentCache.has(topic)) {
        return generatedContentCache.get(topic)!;
    }

    const prompt = `
        Generate a piece of educational content for a disaster preparedness app on the topic: "${topic}".
        Provide the output in a structured JSON format. The JSON object should have the following keys:
        - "id": A unique slug-like ID (e.g., "emergency-water-purification").
        - "title": A concise and engaging title.
        - "description": A brief, one-sentence summary of the content.
        - "type": The type of content. Choose from 'guide', 'infographic', or 'video'. For this, always use 'guide'.
        - "category": The most relevant category. Choose from 'water', 'food', 'safety', 'health', 'shelter', 'general'.
        - "duration": An estimated reading time in minutes (e.g., 5).
        - "difficulty": The difficulty level. Choose from 'beginner', 'intermediate', 'advanced'.
        - "points": A point value for completing this module (e.g., 10, 15, 20).
        - "content": The main educational text. Use markdown for formatting. Include at least 3-4 paragraphs or a list of steps.
        - "resources": An array of 2-3 helpful, real (but generic) URLs for further reading.
        - "tags": An array of 3-5 relevant lowercase tags.

        Example for "Emergency Water Purification":
        {
          "id": "emergency-water-purification",
          "title": "Guide to Emergency Water Purification",
          "description": "Learn simple methods to make contaminated water safe to drink during a crisis.",
          "type": "guide",
          "category": "water",
          "duration": 7,
          "difficulty": "beginner",
          "points": 15,
          "content": "When clean drinking water isn't available, you need to know how to purify it. **Boiling** is the most effective method. Bring water to a rolling boil for at least 1 minute (3 minutes at altitudes above 6,500 feet). If you can't boil water, use **chemical disinfectants** like unscented household bleach or iodine tablets. Follow the instructions carefully. A third option is a **portable water filter** designed to remove pathogens like bacteria and protozoa.",
          "resources": ["https://www.ready.gov/water", "https://www.cdc.gov/healthywater/emergency/index.html"],
          "tags": ["water", "purification", "safety", "survival", "health"]
        }

        IMPORTANT: Return ONLY the JSON object, no additional text or explanations.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Clean the text to ensure it's valid JSON
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedContent = JSON.parse(cleanedText) as Omit<EducationalContent, 'completed'>;

        const educationalItem: EducationalContent = {
            ...parsedContent,
            completed: false, // This will be managed by user state
        };

        generatedContentCache.set(topic, educationalItem);
        return educationalItem;

    } catch (error) {
        console.error(`Error fetching content for topic "${topic}":`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Return a fallback content object instead of an error message
        return getFallbackContent(topic);
    }
};

// Fallback content generator for when the API fails
function getFallbackContent(topic: string): EducationalContent {
    const fallbackContent: Record<string, Omit<EducationalContent, 'id' | 'completed'>> = {
        "Emergency Water Purification": {
            title: "Emergency Water Purification Guide",
            description: "Essential methods to purify water during emergencies when clean water is unavailable.",
            type: 'guide',
            category: 'water',
            duration: 8,
            difficulty: 'beginner',
            points: 15,
            content: `## Emergency Water Purification Methods\n\n**Boiling Water**\n- Bring water to a rolling boil for 1 minute (3 minutes above 6,500 feet)\n- Let water cool before drinking\n- This kills bacteria, viruses, and parasites\n\n**Chemical Treatment**\n- Use unscented household bleach (5-6% sodium hypochlorite)\n- Add 8 drops per gallon of water (2 drops per liter)\n- Mix well and wait 30 minutes before drinking\n\n**Water Filters**\n- Use portable water filters designed for emergency use\n- Look for filters that remove bacteria and protozoa\n- Follow manufacturer instructions carefully\n\n**Solar Disinfection**\n- Fill clear plastic bottles with water\n- Place in direct sunlight for 6 hours (or 2 cloudy days)\n- This method uses UV radiation to kill microorganisms`,
            resources: [
                "https://www.ready.gov/water",
                "https://www.cdc.gov/healthywater/emergency/drinking/making-water-safe.html"
            ],
            tags: ['water', 'purification', 'emergency', 'survival', 'health']
        },
        "Building a 3-Day Emergency Food Supply": {
            title: "3-Day Emergency Food Supply Guide",
            description: "Learn how to assemble a balanced 3-day emergency food supply for your household.",
            type: 'guide',
            category: 'food',
            duration: 10,
            difficulty: 'beginner',
            points: 15,
            content: `## Building Your 3-Day Emergency Food Supply\n\n**Non-Perishable Food Selection**\n- Canned meats, fruits, and vegetables\n- Protein bars and dried fruits\n- Dry cereals and granola\n- Peanut butter and crackers\n- Canned juices and non-perishable pasteurized milk\n\n**Storage Tips**\n- Store in cool, dry place\n- Rotate food every 6 months\n- Include manual can opener\n- Consider special dietary needs\n\n**Water Requirements**\n- Store at least 1 gallon per person per day\n- Include 3-day supply minimum\n- Consider additional water for pets\n\n**Preparation Considerations**\n- Choose foods that require no refrigeration\n- Include foods that need minimal water preparation\n- Pack comfort foods and familiar items`,
            resources: [
                "https://www.ready.gov/food",
                "https://www.redcross.org/get-help/how-to-prepare-for-emergencies/survival-kit-supplies.html"
            ],
            tags: ['food', 'emergency', 'supplies', 'preparation', 'storage']
        }
        // Add more fallback content as needed
    };

    const fallback = fallbackContent[topic] || {
        title: topic,
        description: `Learn essential information about ${topic} for emergency preparedness.`,
        type: 'guide' as const,
        category: 'general' as const,
        duration: 5,
        difficulty: 'beginner' as const,
        points: 10,
        content: `This guide covers important information about ${topic}. While we're experiencing technical difficulties generating the full content, please check reliable emergency preparedness resources for comprehensive information on this topic.`,
        resources: [
            "https://www.ready.gov",
            "https://www.redcross.org/get-help/how-to-prepare-for-emergencies.html"
        ],
        tags: ['emergency', 'preparedness', 'safety']
    };

    return {
        ...fallback,
        id: topic.toLowerCase().replace(/\s+/g, '-'),
        completed: false
    };
}

export const fetchAllEducationalContent = async (): Promise<EducationalContent[]> => {
    const allContentPromises = predefinedTopics.map(topic => fetchEducationalContent(topic));
    const allContent = await Promise.all(allContentPromises);
    return allContent;
};