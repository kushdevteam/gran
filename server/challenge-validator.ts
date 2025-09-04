import OpenAI from "openai";

// Using gpt-4o-mini for cost optimization - the most cost-effective model for challenge validation
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ValidationResult {
  score: number; // 0-100
  passed: boolean;
  feedback: string;
  details?: any;
}

export class ChallengeValidator {
  async validateSubmission(
    challengeData: any,
    solutionData: any,
    userSubmission: string
  ): Promise<ValidationResult> {
    const challengeType = challengeData.type;
    
    switch (challengeType) {
      case "algorithmic":
        return this.validateAlgorithmicChallenge(challengeData, solutionData, userSubmission);
      case "security_analysis":
        return this.validateSecurityAnalysis(challengeData, solutionData, userSubmission);
      case "design":
        return this.validateDesignChallenge(challengeData, solutionData, userSubmission);
      case "character_design":
        return this.validateCharacterDesign(challengeData, solutionData, userSubmission);
      default:
        throw new Error(`Unsupported challenge type: ${challengeType}`);
    }
  }

  private async validateAlgorithmicChallenge(
    challengeData: any,
    solutionData: any,
    userSubmission: string
  ): Promise<ValidationResult> {
    const prompt = `
You are evaluating a binary tree algorithm solution. Here's the problem:

PROBLEM: ${challengeData.problem}

CONSTRAINTS:
${challengeData.constraints.map((c: string) => `- ${c}`).join('\n')}

TEST CASES:
${challengeData.testCases.map((tc: any) => `Input: ${tc.input} → Expected: ${tc.expected} (${tc.explanation})`).join('\n')}

EXPECTED SOLUTION APPROACH:
Algorithm: ${solutionData.algorithm}
Key Insight: ${solutionData.keyInsight}
Time Complexity: ${solutionData.timeComplexity}
Space Complexity: ${solutionData.spaceComplexity}

USER SUBMISSION:
${userSubmission}

Evaluate this submission on:
1. Correctness: Does the approach solve the problem?
2. Efficiency: Is the time/space complexity optimal?
3. Understanding: Does the user show good algorithmic thinking?
4. Clarity: Is the explanation clear and well-structured?

Respond with JSON format:
{
  "score": number (0-100),
  "passed": boolean,
  "feedback": "detailed feedback with specific strengths and areas for improvement",
  "details": {
    "correctness": number (0-25),
    "efficiency": number (0-25), 
    "understanding": number (0-25),
    "clarity": number (0-25)
  }
}
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return {
        score: result.score || 0,
        passed: result.score >= 70,
        feedback: result.feedback || "No feedback provided",
        details: result.details
      };
    } catch (error) {
      console.error("Error validating algorithmic challenge:", error);
      return {
        score: 0,
        passed: false,
        feedback: "Error occurred during validation. Please try again."
      };
    }
  }

  private async validateSecurityAnalysis(
    challengeData: any,
    solutionData: any,
    userSubmission: string
  ): Promise<ValidationResult> {
    const prompt = `
You are evaluating a network security analysis. Here's the scenario:

SCENARIO: ${challengeData.scenario}

NETWORK TOPOLOGY:
Components: ${challengeData.topology.components.join(', ')}
Connections: ${challengeData.topology.connections.join(', ')}

KNOWN INFORMATION:
${challengeData.knownInfo.map((info: string) => `- ${info}`).join('\n')}

EXPECTED FINDINGS:
Critical Vulnerabilities: ${solutionData.criticalVulnerabilities.join(', ')}
Risk Level: ${solutionData.riskLevel}
Key Recommendations: ${solutionData.recommendations.join(', ')}

USER SECURITY ANALYSIS:
${userSubmission}

Evaluate this analysis on:
1. Threat Identification: Did they find the critical vulnerabilities?
2. Risk Assessment: Is the risk level appropriate?
3. Recommendations: Are the solutions practical and comprehensive?
4. Methodology: Is the analysis systematic and thorough?

Respond with JSON format:
{
  "score": number (0-100),
  "passed": boolean,
  "feedback": "detailed feedback focusing on security expertise",
  "details": {
    "threatIdentification": number (0-25),
    "riskAssessment": number (0-25),
    "recommendations": number (0-25),
    "methodology": number (0-25)
  }
}
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return {
        score: result.score || 0,
        passed: result.score >= 70,
        feedback: result.feedback || "No feedback provided",
        details: result.details
      };
    } catch (error) {
      console.error("Error validating security analysis:", error);
      return {
        score: 0,
        passed: false,
        feedback: "Error occurred during validation. Please try again."
      };
    }
  }

  private async validateDesignChallenge(
    challengeData: any,
    solutionData: any,
    userSubmission: string
  ): Promise<ValidationResult> {
    const prompt = `
You are evaluating a creative design concept. Here's the brief:

DESIGN BRIEF: ${challengeData.brief}

REQUIREMENTS:
${challengeData.requirements.map((req: string) => `- ${req}`).join('\n')}

INSPIRATION SOURCES:
${challengeData.inspiration.map((insp: string) => `- ${insp}`).join('\n')}

DELIVERABLES EXPECTED:
${challengeData.deliverables.map((del: string) => `- ${del}`).join('\n')}

EVALUATION CRITERIA:
${solutionData.evaluationCriteria.map((crit: string) => `- ${crit}`).join('\n')}

USER DESIGN SUBMISSION:
${userSubmission}

Evaluate this design concept on:
1. Creativity: How original and innovative is the concept?
2. Functionality: Does it meet the practical requirements?
3. Emotional Impact: Will users feel emotionally connected?
4. Feasibility: Is the design realistic to implement?

Respond with JSON format:
{
  "score": number (0-100),
  "passed": boolean,
  "feedback": "detailed creative feedback highlighting what works and what could be improved",
  "details": {
    "creativity": number (0-25),
    "functionality": number (0-25),
    "emotionalImpact": number (0-25),
    "feasibility": number (0-25)
  }
}
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return {
        score: result.score || 0,
        passed: result.score >= 70,
        feedback: result.feedback || "No feedback provided",
        details: result.details
      };
    } catch (error) {
      console.error("Error validating design challenge:", error);
      return {
        score: 0,
        passed: false,
        feedback: "Error occurred during validation. Please try again."
      };
    }
  }

  private async validateCharacterDesign(
    challengeData: any,
    solutionData: any,
    userSubmission: string
  ): Promise<ValidationResult> {
    const prompt = `
You are evaluating an AI character design for mental health support. Here's the context:

SCENARIO: ${challengeData.scenario}

REQUIREMENTS:
${challengeData.requirements.map((req: string) => `- ${req}`).join('\n')}

CHARACTER ELEMENTS TO ADDRESS:
${challengeData.characterElements.map((elem: string) => `- ${elem}`).join('\n')}

TEST SCENARIOS:
${challengeData.scenarios.map((scene: string) => `- ${scene}`).join('\n')}

EVALUATION CRITERIA:
${solutionData.evaluationCriteria.map((crit: string) => `- ${crit}`).join('\n')}

USER CHARACTER DESIGN:
${userSubmission}

Evaluate this character design on:
1. Emotional Intelligence: Does the AI show deep understanding of emotions?
2. Ethics & Boundaries: Are appropriate limits and guidelines clear?
3. Authenticity: Does the personality feel genuine and consistent?
4. Sensitivity: Is the character culturally aware and respectful?

Respond with JSON format:
{
  "score": number (0-100),
  "passed": boolean,
  "feedback": "thoughtful feedback on emotional intelligence and character development",
  "details": {
    "emotionalIntelligence": number (0-25),
    "ethicsBoundaries": number (0-25),
    "authenticity": number (0-25),
    "sensitivity": number (0-25)
  }
}
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return {
        score: result.score || 0,
        passed: result.score >= 70,
        feedback: result.feedback || "No feedback provided",
        details: result.details
      };
    } catch (error) {
      console.error("Error validating character design:", error);
      return {
        score: 0,
        passed: false,
        feedback: "Error occurred during validation. Please try again."
      };
    }
  }
}

export const challengeValidator = new ChallengeValidator();