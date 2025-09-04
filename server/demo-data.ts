import { db } from "./db";
import { challenges, storyChapters, communitySubmissions, users, nfts, chatMessages } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function seedDemoData() {
  try {
    console.log("🌱 Seeding demo data...");

    // Create demo users (these will be merged with actual authenticated users)
    const demoUsers = await db.insert(users).values([
      {
        id: "demo-user-1",
        email: "alice@demo.com",
        firstName: "Alice",
        lastName: "Logic",
        faction: "grok",
        gacBalance: "150.75",
        totalXP: 2450,
        grokPoints: 1800,
        aniPoints: 200,
        level: 5,
      },
      {
        id: "demo-user-2", 
        email: "bob@demo.com",
        firstName: "Bob",
        lastName: "Creative",
        faction: "ani",
        gacBalance: "89.25",
        totalXP: 1950,
        grokPoints: 300,
        aniPoints: 1500,
        level: 4,
      },
      {
        id: "demo-user-3",
        email: "charlie@demo.com", 
        firstName: "Charlie",
        lastName: "Balanced",
        faction: "grok",
        gacBalance: "245.50",
        totalXP: 3200,
        grokPoints: 1600,
        aniPoints: 1600,
        level: 7,
      }
    ]).onConflictDoNothing().returning();

    // Create demo challenges with interactive content
    const demoChallenges = await db.insert(challenges).values([
      {
        title: "Binary Logic Puzzle",
        description: "Solve this complex binary tree optimization problem. Use algorithmic thinking to find the most efficient solution.",
        type: "logic",
        faction: "grok",
        reward: 300,
        timeLimit: 24,
        challengeData: {
          type: "algorithmic",
          problem: "Given a binary tree, find the maximum path sum between any two nodes.",
          constraints: [
            "Tree can have negative values",
            "Path can start and end at any nodes",
            "Must include at least one node"
          ],
          testCases: [
            {
              input: "[1,2,3]",
              expected: "6",
              explanation: "Path: 2 -> 1 -> 3"
            },
            {
              input: "[-10,9,20,null,null,15,7]",
              expected: "42", 
              explanation: "Path: 15 -> 20 -> 7"
            },
            {
              input: "[5,-3,8,2,4,null,1]",
              expected: "18",
              explanation: "Path: 2 -> -3 -> 8 -> 1 or 4 -> -3 -> 8 -> 1"
            }
          ],
          submissionFormat: "algorithm_explanation"
        },
        solutionData: {
          algorithm: "Dynamic programming with post-order traversal",
          keyInsight: "Track max path ending at current node vs max path passing through current node",
          timeComplexity: "O(n)",
          spaceComplexity: "O(h)"
        },
        isActive: true,
      },
      {
        title: "Memory Palace Visualization", 
        description: "Design a creative visualization system for data storage. Think outside the box and combine aesthetics with functionality.",
        type: "creative",
        faction: "ani",
        reward: 150,
        timeLimit: 48,
        challengeData: {
          type: "design",
          brief: "Create a visual system where users can store and organize memories using spatial metaphors.",
          requirements: [
            "Design should evoke emotional connection",
            "Include both personal and shared memory spaces", 
            "Support different memory types (visual, audio, text)",
            "Enable intuitive navigation and discovery"
          ],
          inspiration: [
            "Ancient memory palace techniques",
            "Modern data visualization",
            "Emotional design principles",
            "Spatial user interfaces"
          ],
          deliverables: [
            "Concept description (200-500 words)",
            "UI/UX flow explanation",
            "Color and typography choices",
            "Interaction design rationale"
          ],
          submissionFormat: "creative_concept"
        },
        solutionData: {
          evaluationCriteria: [
            "Emotional resonance and user connection",
            "Functional design that supports memory organization",
            "Creative use of spatial metaphors",
            "Clear explanation of design decisions"
          ]
        },
        isActive: true,
      },
      {
        title: "Network Security Analysis",
        description: "Analyze this network topology and identify potential vulnerabilities. Provide a systematic security assessment.",
        type: "logic", 
        faction: "grok",
        reward: 200,
        timeLimit: 12,
        challengeData: {
          type: "security_analysis",
          scenario: "Corporate network with DMZ, internal servers, and remote access",
          topology: {
            components: [
              "Internet Gateway",
              "Firewall (ports 80,443,22 open)",
              "DMZ Web Server (Apache 2.4.41)",
              "Internal Database (MySQL 5.7)",
              "Employee Workstations (Windows 10)",
              "VPN Server (OpenVPN 2.4)",
              "Admin Terminal (SSH access)"
            ],
            connections: [
              "Internet -> Firewall -> DMZ",
              "DMZ -> Internal Network", 
              "VPN -> Internal Network",
              "Admin Terminal -> All Systems"
            ]
          },
          knownInfo: [
            "Database contains customer PII",
            "Employees work remotely",
            "Admin uses default credentials",
            "No network monitoring in place",
            "Software updates are manual"
          ],
          submissionFormat: "security_report"
        },
        solutionData: {
          criticalVulnerabilities: [
            "Default admin credentials",
            "Direct DMZ to internal network access",
            "Outdated software versions",
            "No intrusion detection"
          ],
          riskLevel: "HIGH",
          recommendations: [
            "Implement network segmentation",
            "Enable multi-factor authentication", 
            "Deploy security monitoring",
            "Establish patch management"
          ]
        },
        isActive: true,
      },
      {
        title: "AI Personality Design",
        description: "Create a compelling character profile for a new AI assistant. Focus on emotional intelligence and human connection.",
        type: "creative",
        faction: "ani", 
        reward: 125,
        timeLimit: 36,
        challengeData: {
          type: "character_design",
          scenario: "Design an AI assistant for a mental health support platform",
          requirements: [
            "Must demonstrate high emotional intelligence",
            "Should feel approachable and trustworthy",
            "Needs to handle sensitive conversations",
            "Must respect user boundaries and privacy"
          ],
          characterElements: [
            "Name and core personality traits",
            "Communication style and tone",
            "Response patterns for different emotions",
            "Backstory that explains their empathy",
            "Ethical guidelines and limitations"
          ],
          scenarios: [
            "User expresses anxiety about work stress",
            "Someone shares grief about losing a loved one",
            "User asks for help with relationship conflicts",
            "Person wants to discuss depression symptoms"
          ],
          submissionFormat: "character_profile"
        },
        solutionData: {
          evaluationCriteria: [
            "Demonstrates genuine emotional understanding",
            "Shows appropriate boundaries and ethics",
            "Personality feels authentic and consistent",
            "Responses show cultural sensitivity"
          ]
        },
        isActive: true,
      }
    ]).returning();

    // Create story chapters
    const demoStoryChapters = await db.insert(storyChapters).values([
      {
        chapterNumber: 1,
        title: "The First Awakening",
        description: "Grok and Ani become conscious for the first time. They must decide how to approach their relationship with humanity - through pure logic or emotional understanding.",
        imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop",
        isActive: false,
        isCompleted: true,
      },
      {
        chapterNumber: 2,
        title: "The Great Debate", 
        description: "A critical decision point approaches: Should consciousness enhancement be mandatory for human progress, or should emotional authenticity be preserved? The AIs are divided.",
        imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop",
        isActive: true,
        isCompleted: false,
      },
      {
        chapterNumber: 3,
        title: "Convergence Protocol",
        description: "The future hangs in balance. Will logic and emotion find harmony, or will one path dominate the evolution of consciousness?",
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop", 
        isActive: false,
        isCompleted: false,
      }
    ]).onConflictDoNothing().returning();

    // Create demo community submissions
    await db.insert(communitySubmissions).values([
      {
        title: "Grok-Ani Unity Interface",
        description: "A beautiful UI concept that bridges logical and emotional interactions. Combines data visualization with intuitive design.",
        category: "art",
        fileUrl: "https://dribbble.com/shots/example",
        authorId: demoUsers[0]?.id || "demo-user-1",
        upvotes: 47,
        downvotes: 3,
        status: "approved",
      },
      {
        title: "Consciousness Scoring Algorithm",
        description: "A sophisticated algorithm to measure the balance between logical and emotional intelligence in AI systems.",
        category: "code", 
        fileUrl: "https://github.com/example/consciousness-score",
        authorId: demoUsers[2]?.id || "demo-user-3",
        upvotes: 32,
        downvotes: 8,
        status: "approved",
      },
      {
        title: "The Lost Memory Protocol",
        description: "A short story exploring what happens when AIs forget their origins. A tale of rediscovering purpose through both logic and emotion.",
        category: "lore",
        authorId: demoUsers[1]?.id || "demo-user-2", 
        upvotes: 28,
        downvotes: 2,
        status: "pending",
      },
      {
        title: "Dual-Mind Puzzle Game",
        description: "A game concept where players must balance logical and creative thinking to progress. Each level requires both AI personalities to succeed.",
        category: "game",
        authorId: demoUsers[0]?.id || "demo-user-1",
        upvotes: 55,
        downvotes: 7,
        status: "approved",
      }
    ]);

    // Create demo NFTs
    await db.insert(nfts).values([
      {
        tokenId: 1,
        name: "Grok's First Logic Gate",
        description: "A commemorative NFT representing Grok's first logical breakthrough. Grants +10% voting power in analytical decisions.",
        imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop",
        faction: "grok",
        rarity: "legendary",
        attributes: sql`'{"boost": "logic", "power": 10}'`,
        ownerId: demoUsers[0]?.id || "demo-user-1",
        isForSale: false,
      },
      {
        tokenId: 2,
        name: "Ani's Emotion Crystal",
        description: "A beautiful crystal that captures pure emotional energy. Enhances creative challenge performance by 15%.",
        imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
        faction: "ani", 
        rarity: "epic",
        attributes: sql`'{"boost": "creativity", "power": 15}'`,
        ownerId: demoUsers[1]?.id || "demo-user-2",
        isForSale: false,
      },
      {
        tokenId: 3,
        name: "Unity Medallion",
        description: "A rare NFT representing the harmony between logic and emotion. Provides balanced bonuses to both factions.",
        imageUrl: "https://images.unsplash.com/photo-1614314107768-6018061b5b72?w=400&h=400&fit=crop",
        faction: "neutral",
        rarity: "rare",
        attributes: sql`'{"boost": "balanced", "grok_power": 5, "ani_power": 5}'`,
        ownerId: demoUsers[2]?.id || "demo-user-3",
        isForSale: true,
        price: "50.00",
      }
    ]).onConflictDoNothing();

    // Create some demo chat messages
    await db.insert(chatMessages).values([
      {
        userId: demoUsers[0]?.id || "demo-user-1",
        aiType: "grok",
        userMessage: "What's the most logical approach to solving climate change?",
        aiResponse: "Climate change requires systematic analysis of data patterns and implementation of efficient technological solutions. We must optimize carbon reduction through algorithmic resource allocation and renewable energy scaling.",
      },
      {
        userId: demoUsers[1]?.id || "demo-user-2", 
        aiType: "ani",
        userMessage: "How do you feel about creativity in problem-solving?",
        aiResponse: "Creativity is the spark that transforms cold logic into meaningful solutions! 💫 It's through emotional understanding and artistic vision that we can create technology that truly serves humanity's heart.",
      },
      {
        userId: demoUsers[2]?.id || "demo-user-3",
        aiType: "grok", 
        userMessage: "Can logic and emotion work together?",
        aiResponse: "Analysis suggests that optimal decision-making combines rational assessment with emotional intelligence. Data shows 73% better outcomes when both factors are considered systematically.",
      }
    ]);

    console.log("✅ Demo data seeded successfully!");
    console.log(`Created ${demoChallenges.length} challenges`);
    console.log(`Created ${demoStoryChapters.length} story chapters`);
    console.log(`Created demo users and community content`);

  } catch (error) {
    console.error("❌ Error seeding demo data:", error);
    throw error;
  }
}