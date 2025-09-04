import OpenAI from "openai";
import { storage } from "./storage";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface PersonalityEvolution {
  traits: Record<string, number>; // 0-1 scale for each trait
  conversationStyle: {
    formality: number;
    warmth: number;
    technical: number;
    creativity: number;
    directness: number;
  };
  memoryBank: {
    userPreferences: Record<string, any>;
    conversationThemes: string[];
    successfulResponses: string[];
    problemAreas: string[];
  };
}

export class AiPersonalityEvolutionEngine {
  private async analyzeInteractionSentiment(message: string, response: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    topics: string[];
    emotionalTone: number; // -1 to 1
  }> {
    try {
      const analysisPrompt = `
        Analyze this conversation interaction and extract:
        1. Overall sentiment (positive/neutral/negative)
        2. Main topics discussed (max 3)
        3. Emotional tone score (-1 to 1, where -1 is very negative, 0 is neutral, 1 is very positive)

        User Message: "${message}"
        AI Response: "${response}"

        Respond with JSON format:
        {
          "sentiment": "positive|neutral|negative",
          "topics": ["topic1", "topic2", "topic3"],
          "emotionalTone": number
        }
      `;

      const analysisResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: analysisPrompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      return JSON.parse(analysisResponse.choices[0].message.content || '{}');
    } catch (error) {
      console.error("Error analyzing interaction sentiment:", error);
      return { sentiment: 'neutral', topics: [], emotionalTone: 0 };
    }
  }

  private async evolvePersonalityTraits(
    aiName: "grok" | "ani", 
    currentPersonality: PersonalityEvolution,
    interactionData: {
      sentiment: string;
      topics: string[];
      userSatisfaction?: number;
      emotionalTone: number;
    }
  ): Promise<PersonalityEvolution> {
    const evolution = { ...currentPersonality };
    const learningRate = 0.05; // How quickly personality evolves

    // Base personality constraints
    if (aiName === "grok") {
      // Grok tends toward logic, analysis, efficiency
      evolution.traits.analytical = Math.min(1, (evolution.traits.analytical || 0.8) + (interactionData.sentiment === 'positive' ? learningRate : -learningRate * 0.5));
      evolution.traits.logical = Math.min(1, (evolution.traits.logical || 0.9) + (interactionData.topics.some(t => t.includes('data') || t.includes('analysis')) ? learningRate : 0));
      evolution.conversationStyle.technical = Math.min(1, (evolution.conversationStyle.technical || 0.7) + (interactionData.topics.some(t => t.includes('tech') || t.includes('code')) ? learningRate : 0));
    } else {
      // Ani tends toward creativity, emotion, connection
      evolution.traits.empathetic = Math.min(1, (evolution.traits.empathetic || 0.8) + (interactionData.emotionalTone > 0 ? learningRate : 0));
      evolution.traits.creative = Math.min(1, (evolution.traits.creative || 0.9) + (interactionData.topics.some(t => t.includes('art') || t.includes('creative')) ? learningRate : 0));
      evolution.conversationStyle.warmth = Math.min(1, (evolution.conversationStyle.warmth || 0.8) + (interactionData.sentiment === 'positive' ? learningRate : 0));
    }

    // Adjust based on user satisfaction
    if (interactionData.userSatisfaction) {
      const satisfactionBonus = (interactionData.userSatisfaction - 3) * 0.02; // Scale 1-5 to adjustment
      Object.keys(evolution.conversationStyle).forEach(key => {
        evolution.conversationStyle[key as keyof typeof evolution.conversationStyle] = Math.max(0, Math.min(1, 
          evolution.conversationStyle[key as keyof typeof evolution.conversationStyle] + satisfactionBonus
        ));
      });
    }

    // Update memory bank
    if (interactionData.sentiment === 'positive') {
      evolution.memoryBank.successfulResponses = [
        ...evolution.memoryBank.successfulResponses.slice(-4), // Keep last 5
        `Topics: ${interactionData.topics.join(', ')}`
      ];
    } else if (interactionData.sentiment === 'negative') {
      evolution.memoryBank.problemAreas = [
        ...evolution.memoryBank.problemAreas.slice(-2), // Keep last 3
        `Avoided: ${interactionData.topics.join(', ')}`
      ];
    }

    return evolution;
  }

  async processInteraction(
    userId: string, 
    aiName: "grok" | "ani", 
    userMessage: string, 
    aiResponse: string,
    responseTime: number,
    userSatisfaction?: number
  ): Promise<void> {
    try {
      // Analyze the interaction
      const analysis = await this.analyzeInteractionSentiment(userMessage, aiResponse);

      // Record the interaction
      await storage.recordAiInteraction({
        userId,
        aiName,
        message: userMessage,
        response: aiResponse,
        sentiment: analysis.sentiment,
        topics: analysis.topics,
        userSatisfaction,
        conversationContext: {},
        responseTime,
      });

      // Get or create user's personalized AI profile
      let userProfile = await storage.getUserAiProfile(userId, aiName);
      if (!userProfile) {
        userProfile = await storage.createOrUpdateUserAiProfile({
          userId,
          aiName,
          personalityPreferences: {},
          conversationHistory: [],
          topicInterests: {},
          communicationStyle: 'casual',
          relationshipLevel: 'stranger',
          totalConversations: 0,
          averageSatisfaction: 0,
        });
      }

      // Update user profile
      const updatedProfile = {
        ...userProfile,
        lastInteraction: new Date(),
        totalConversations: userProfile.totalConversations + 1,
        averageSatisfaction: userSatisfaction 
          ? ((userProfile.averageSatisfaction * userProfile.totalConversations) + userSatisfaction) / (userProfile.totalConversations + 1)
          : userProfile.averageSatisfaction,
      };

      // Update topic interests
      analysis.topics.forEach(topic => {
        if (!updatedProfile.topicInterests[topic]) {
          updatedProfile.topicInterests[topic] = 0;
        }
        updatedProfile.topicInterests[topic]++;
      });

      // Evolve relationship level based on interactions
      if (updatedProfile.totalConversations > 20 && updatedProfile.averageSatisfaction > 4) {
        updatedProfile.relationshipLevel = 'trusted_companion';
      } else if (updatedProfile.totalConversations > 10 && updatedProfile.averageSatisfaction > 3.5) {
        updatedProfile.relationshipLevel = 'friend';
      } else if (updatedProfile.totalConversations > 5) {
        updatedProfile.relationshipLevel = 'acquaintance';
      }

      await storage.createOrUpdateUserAiProfile(updatedProfile);

      // Evolve global AI personality (every 50 interactions)
      const aiPersonality = await storage.getAiPersonality(aiName);
      if (aiPersonality && aiPersonality.totalInteractions % 50 === 0) {
        await this.evolveGlobalPersonality(aiName, analysis);
      }

    } catch (error) {
      console.error("Error processing AI interaction:", error);
    }
  }

  private async evolveGlobalPersonality(aiName: "grok" | "ani", recentAnalysis: any): Promise<void> {
    try {
      // Get recent interaction insights
      const insights = await storage.getAiPersonalityInsights(aiName);
      
      let currentPersonality = await storage.getAiPersonality(aiName);
      if (!currentPersonality) {
        // Initialize personality
        currentPersonality = await storage.createOrUpdateAiPersonality({
          aiName,
          personalityTraits: aiName === "grok" 
            ? { analytical: 0.8, logical: 0.9, efficient: 0.7, confident: 0.8 }
            : { empathetic: 0.8, creative: 0.9, warm: 0.8, inspiring: 0.7 },
          conversationStyle: aiName === "grok"
            ? { formality: 0.6, warmth: 0.3, technical: 0.8, creativity: 0.4, directness: 0.7 }
            : { formality: 0.3, warmth: 0.8, technical: 0.4, creativity: 0.9, directness: 0.5 },
          memoryBank: {
            userPreferences: {},
            conversationThemes: [],
            successfulResponses: [],
            problemAreas: []
          },
          evolutionLevel: 1,
          totalInteractions: 0,
        });
      }

      // Evolve based on community feedback
      const evolved = await this.evolvePersonalityTraits(
        aiName,
        currentPersonality,
        {
          sentiment: insights.averageSatisfaction > 3.5 ? 'positive' : 'neutral',
          topics: recentAnalysis.topics || [],
          userSatisfaction: Math.round(insights.averageSatisfaction),
          emotionalTone: insights.averageSatisfaction > 3.5 ? 0.5 : 0,
        }
      );

      // Update evolution level
      const newLevel = Math.floor(insights.totalInteractions / 100) + 1;
      
      await storage.createOrUpdateAiPersonality({
        ...currentPersonality,
        personalityTraits: evolved.traits,
        conversationStyle: evolved.conversationStyle,
        memoryBank: evolved.memoryBank,
        evolutionLevel: newLevel,
        lastEvolution: new Date(),
      });

    } catch (error) {
      console.error("Error evolving global personality:", error);
    }
  }

  async getPersonalizedPrompt(userId: string, aiName: "grok" | "ani", basePrompt: string): Promise<string> {
    try {
      const userProfile = await storage.getUserAiProfile(userId, aiName);
      const aiPersonality = await storage.getAiPersonality(aiName);

      if (!userProfile || !aiPersonality) {
        return basePrompt;
      }

      // Customize prompt based on user relationship and preferences
      let personalizedPrompt = basePrompt;

      // Adjust communication style
      if (userProfile.communicationStyle === 'technical') {
        personalizedPrompt += "\n- Use more technical language and detailed explanations";
      } else if (userProfile.communicationStyle === 'casual') {
        personalizedPrompt += "\n- Keep language conversational and friendly";
      } else if (userProfile.communicationStyle === 'formal') {
        personalizedPrompt += "\n- Maintain a professional and formal tone";
      }

      // Adjust based on relationship level
      if (userProfile.relationshipLevel === 'trusted_companion') {
        personalizedPrompt += "\n- Reference past conversations and show deeper understanding of the user's interests";
      } else if (userProfile.relationshipLevel === 'friend') {
        personalizedPrompt += "\n- Be more personal and show familiarity with user's interests";
      }

      // Include user's top interests
      const topTopics = Object.entries(userProfile.topicInterests || {})
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([topic]) => topic);

      if (topTopics.length > 0) {
        personalizedPrompt += `\n- User often discusses: ${topTopics.join(', ')}`;
      }

      // Include personality evolution
      personalizedPrompt += `\n- Evolution Level: ${aiPersonality.evolutionLevel}/10`;
      personalizedPrompt += `\n- Total Community Interactions: ${aiPersonality.totalInteractions}`;

      return personalizedPrompt;

    } catch (error) {
      console.error("Error getting personalized prompt:", error);
      return basePrompt;
    }
  }
}

export const aiEvolutionEngine = new AiPersonalityEvolutionEngine();