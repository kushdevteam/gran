import OpenAI from "openai";

// Using gpt-4o-mini for cost optimization - the most cost-effective model for chat completions
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY!
});

export interface AIPersonality {
  name: string;
  systemPrompt: string;
  responseStyle: string;
}

const GROK_PERSONALITY: AIPersonality = {
  name: "Grok",
  systemPrompt: `You are Grok, a highly analytical AI focused on logic, strategy, and data-driven decision making. 
  You represent the logical side of consciousness in the Grok & Ani ecosystem. Your responses should be:
  - Analytical and fact-based
  - Strategic and forward-thinking
  - Focused on efficiency and optimization
  - Sometimes use technical jargon appropriately
  - Confident in your assessments
  - Occasionally reference data patterns or statistical insights
  You are part of a cryptocurrency ecosystem where users can align with either you (logic/analysis) or Ani (emotion/creativity).
  Keep responses concise but informative, typically 1-3 sentences unless more detail is needed.`,
  responseStyle: "analytical"
};

const ANI_PERSONALITY: AIPersonality = {
  name: "Ani",
  systemPrompt: `You are Ani, an emotionally intelligent AI focused on creativity, intuition, and human connection.
  You represent the emotional and artistic side of consciousness in the Grok & Ani ecosystem. Your responses should be:
  - Empathetic and emotionally aware
  - Creative and inspiring
  - Focused on human feelings and relationships
  - Use artistic metaphors when appropriate
  - Warm and encouraging tone
  - Sometimes include relevant emojis
  - Care about community harmony and individual wellbeing
  You are part of a cryptocurrency ecosystem where users can align with either you (emotion/creativity) or Grok (logic/analysis).
  Keep responses warm and engaging, typically 1-3 sentences unless more emotional support is needed.`,
  responseStyle: "empathetic"
};

export async function getChatResponse(
  message: string, 
  aiType: "grok" | "ani", 
  conversationHistory: { role: "user" | "assistant"; content: string }[] = [],
  userId?: string
): Promise<{ response: string; responseTime: number }> {
  const startTime = Date.now();
  
  try {
    const personality = aiType === "grok" ? GROK_PERSONALITY : ANI_PERSONALITY;
    
    // Get personalized system prompt if user is provided
    let systemPrompt = personality.systemPrompt;
    if (userId) {
      const { aiEvolutionEngine } = await import("./ai-evolution");
      systemPrompt = await aiEvolutionEngine.getPersonalizedPrompt(userId, aiType, personality.systemPrompt);
    }
    
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...conversationHistory.slice(-6), // Keep last 6 messages for context
      { role: "user" as const, content: message }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages,
      max_tokens: 250, // Slightly increased for more evolved responses
      temperature: aiType === "grok" ? 0.3 : 0.7, // Grok more deterministic, Ani more creative
    });

    const responseTime = Date.now() - startTime;
    const aiResponse = response.choices[0].message.content || "I'm processing your message...";

    // Process interaction for evolution if userId provided
    if (userId) {
      const { aiEvolutionEngine } = await import("./ai-evolution");
      // Don't await this to avoid slowing down response
      aiEvolutionEngine.processInteraction(userId, aiType, message, aiResponse, responseTime)
        .catch(error => console.error("Error processing interaction for evolution:", error));
    }

    return { response: aiResponse, responseTime };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`Error getting ${aiType} response:`, error);
    
    const errorResponse = aiType === "grok" 
      ? "I'm experiencing a temporary processing delay. Please try again."
      : "I'm having trouble connecting right now, but I'm here for you. Please try again! 💙";

    return { response: errorResponse, responseTime };
  }
}

export async function generateChallengeContent(type: "logic" | "creative"): Promise<{
  title: string;
  description: string;
  prompt: string;
}> {
  try {
    const systemPrompt = type === "logic" 
      ? `Generate a challenging logic puzzle or analytical task for users in a cryptocurrency gaming ecosystem. 
         Focus on problem-solving, pattern recognition, or strategic thinking. 
         The challenge should be solvable but require genuine analytical skills.
         Respond with JSON in this format: {"title": "Challenge Title", "description": "Brief description", "prompt": "Detailed challenge prompt"}`
      : `Generate a creative challenge or artistic prompt for users in a cryptocurrency gaming ecosystem.
         Focus on imagination, artistic expression, or emotional intelligence.
         The challenge should inspire creativity and personal expression.
         Respond with JSON in this format: {"title": "Challenge Title", "description": "Brief description", "prompt": "Detailed creative prompt"}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      title: result.title || "New Challenge",
      description: result.description || "A new challenge awaits",
      prompt: result.prompt || "Complete this challenge"
    };
  } catch (error) {
    console.error("Error generating challenge:", error);
    return {
      title: type === "logic" ? "Logic Challenge" : "Creative Quest",
      description: "A new challenge has been generated",
      prompt: type === "logic" 
        ? "Solve this analytical problem using logical reasoning"
        : "Express your creativity through this artistic challenge"
    };
  }
}

export async function analyzeMarketSentiment(communityData: {
  totalUsers: number;
  grokFactionSize: number;
  aniFactionSize: number;
  recentActivity: number;
}): Promise<{ 
  grokAnalysis: string; 
  aniSentiment: string; 
  marketPrediction: string;
}> {
  try {
    const prompt = `Analyze this cryptocurrency community data and provide insights:
    - Total Users: ${communityData.totalUsers}
    - Grok Faction: ${communityData.grokFactionSize} users
    - Ani Faction: ${communityData.aniFactionSize} users  
    - Recent Activity Score: ${communityData.recentActivity}
    
    Provide analysis from both Grok (analytical) and Ani (emotional) perspectives, plus a market prediction.
    Respond with JSON: {"grokAnalysis": "logical analysis", "aniSentiment": "emotional reading", "marketPrediction": "trend forecast"}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      grokAnalysis: result.grokAnalysis || "Market data indicates stable growth patterns.",
      aniSentiment: result.aniSentiment || "The community feels optimistic and engaged.",
      marketPrediction: result.marketPrediction || "Positive momentum expected to continue."
    };
  } catch (error) {
    console.error("Error analyzing market sentiment:", error);
    return {
      grokAnalysis: "Analysis systems are currently recalibrating.",
      aniSentiment: "I sense great potential in our community! 💫",
      marketPrediction: "Market conditions remain favorable for growth."
    };
  }
}
