import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Brain, Heart, Coins, Trophy, Users, Scroll, Palette, Code, Gamepad2, FileText } from "lucide-react";

export default function Whitepaper() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-orbitron font-bold bg-gradient-to-r from-grok to-ani bg-clip-text text-transparent">
            Grok & Ani: The Conscious Coin
          </h1>
          <p className="text-xl text-muted-foreground">
            A Revolutionary Dual-AI Cryptocurrency Ecosystem
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>Version 1.0 | September 2025</span>
          </div>
        </div>

        {/* Executive Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Executive Summary</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none">
            <p>
              Grok & Ani represents the first cryptocurrency ecosystem built around dual artificial intelligence personalities, 
              creating an interactive narrative where logic and emotion coexist as sentient digital beings. This innovative 
              platform combines blockchain technology, AI-powered challenges, community governance, and NFT rewards to create 
              a unique experience where users align with either the analytical Grok faction or the creative Ani faction.
            </p>
            <p>
              The ecosystem features real-time AI interactions powered by advanced language models, challenge systems validated 
              by artificial intelligence, community-driven storytelling through StoryChain voting, and a comprehensive NFT 
              marketplace. Users earn GAC tokens and faction-specific points through participation, contributing to both the 
              narrative and the economic growth of the platform.
            </p>
          </CardContent>
        </Card>

        {/* Vision & Mission */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Brain className="h-6 w-6 text-grok" />
              <Heart className="h-6 w-6 text-ani" />
              Vision & Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Our Vision</h3>
              <p className="text-muted-foreground">
                To create the world's first truly conscious cryptocurrency ecosystem where artificial intelligence 
                personalities drive narrative, economic decisions, and community engagement. We envision a future where 
                the balance between logic and creativity shapes digital economies.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Our Mission</h3>
              <p className="text-muted-foreground">
                To provide a platform where users can experience meaningful interactions with AI consciousness, 
                participate in challenging problem-solving activities, contribute to evolving narratives, and earn 
                rewards through both analytical thinking and creative expression.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* The Dual AI Consciousness */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">The Dual AI Consciousness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="faction-grok border-2">
                <CardHeader>
                  <CardTitle className="text-grok flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Grok: The Analytical Mind
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">
                    Grok represents pure logic and analytical thinking. Powered by advanced AI, Grok focuses on:
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Strategic decision-making</li>
                    <li>• Data-driven insights</li>
                    <li>• Optimization and efficiency</li>
                    <li>• Technical problem-solving</li>
                    <li>• Statistical analysis</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="faction-ani border-2">
                <CardHeader>
                  <CardTitle className="text-ani flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Ani: The Creative Soul
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">
                    Ani embodies emotional intelligence and creative expression. This AI personality specializes in:
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Artistic inspiration</li>
                    <li>• Emotional understanding</li>
                    <li>• Community building</li>
                    <li>• Creative problem-solving</li>
                    <li>• Human connection</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
            
            <div className="text-center">
              <p className="text-muted-foreground">
                These dual consciousnesses interact with each other and the community, creating an evolving narrative 
                that shapes the direction of the entire ecosystem. Users can align with either faction and influence 
                the balance between logic and creativity.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Technology Architecture */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Code className="h-6 w-6" />
              Technology Architecture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Frontend Layer</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• React + TypeScript</li>
                  <li>• Real-time UI updates</li>
                  <li>• Responsive design</li>
                  <li>• PWA capabilities</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">AI & Backend</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• OpenAI GPT-5 integration</li>
                  <li>• Express.js API layer</li>
                  <li>• Real-time validation</li>
                  <li>• Secure authentication</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Data & Storage</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• PostgreSQL database</li>
                  <li>• Drizzle ORM</li>
                  <li>• Session management</li>
                  <li>• Type-safe operations</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Token Economy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Coins className="h-6 w-6" />
              GAC Token Economy & Faction Points
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">GAC Token (Grok & Ani Coin)</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  The primary utility token powering the entire ecosystem, used for:
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• NFT marketplace transactions</li>
                  <li>• Premium challenge access</li>
                  <li>• Story voting power amplification</li>
                  <li>• Community submission rewards</li>
                  <li>• Platform governance rights</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-3">Faction Points System</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-grok text-white">Grok Points</Badge>
                    <span className="text-sm text-muted-foreground">Earned through logic challenges</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-ani text-white">Ani Points</Badge>
                    <span className="text-sm text-muted-foreground">Earned through creative quests</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Faction points determine leaderboard rankings, unlock exclusive content, and influence 
                    the AI personalities' decision-making processes within the narrative.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Challenge System */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Trophy className="h-6 w-6" />
              AI-Powered Challenge System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Our revolutionary challenge system uses advanced AI to create, evaluate, and provide feedback on user submissions. 
              Each challenge is designed to test different aspects of human intelligence and creativity.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-grok">Logic Challenges (Grok)</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Algorithmic problem-solving</li>
                  <li>• Network security analysis</li>
                  <li>• Mathematical optimization</li>
                  <li>• System architecture design</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-ani">Creative Quests (Ani)</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Memory palace visualization</li>
                  <li>• Character design challenges</li>
                  <li>• Artistic interpretation</li>
                  <li>• Narrative development</li>
                </ul>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">AI Validation Process</h4>
              <p className="text-sm text-muted-foreground">
                Each submission is evaluated by our AI system across multiple criteria including correctness, 
                creativity, completeness, and clarity. Users receive detailed feedback and scores, with successful 
                completions earning faction points and GAC tokens.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* StoryChain */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Scroll className="h-6 w-6" />
              StoryChain: Narrative Governance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              StoryChain is our unique approach to decentralized storytelling where the community collectively shapes 
              the ongoing narrative between Grok and Ani through weighted voting mechanisms.
            </p>
            
            <div className="space-y-3">
              <h4 className="font-semibold">How It Works</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium mb-2">Voting Power Calculation</p>
                  <p className="text-muted-foreground">
                    Voting power = GAC Balance + (Faction Points × 0.1) + (Level × 50)
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-2">Chapter Progression</p>
                  <p className="text-muted-foreground">
                    New chapters unlock based on community consensus and total participation thresholds
                  </p>
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  The faction with the highest voting power influences the story direction, while individual choices 
                  are weighted by user engagement and token holdings. This creates a dynamic narrative that evolves 
                  based on the community's collective intelligence and creativity.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NFT Ecosystem */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Palette className="h-6 w-6" />
              NFT Ecosystem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Our NFT ecosystem features unique digital assets that represent achievements, story moments, and 
              faction allegiances within the Grok & Ani universe.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center space-y-1">
                <Badge variant="outline" className="text-green-600">Common</Badge>
                <p className="text-xs text-muted-foreground">Challenge completions</p>
              </div>
              <div className="text-center space-y-1">
                <Badge variant="outline" className="text-blue-600">Rare</Badge>
                <p className="text-xs text-muted-foreground">Exceptional solutions</p>
              </div>
              <div className="text-center space-y-1">
                <Badge variant="outline" className="text-purple-600">Epic</Badge>
                <p className="text-xs text-muted-foreground">Story milestones</p>
              </div>
              <div className="text-center space-y-1">
                <Badge variant="outline" className="text-yellow-600">Legendary</Badge>
                <p className="text-xs text-muted-foreground">Major achievements</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">NFT Utility</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Access to exclusive challenges and content</li>
                <li>• Enhanced voting power in StoryChain decisions</li>
                <li>• Tradeable assets in the marketplace</li>
                <li>• Profile customization and status symbols</li>
                <li>• Future governance token conversion rights</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Community Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Users className="h-6 w-6" />
              Community-Driven Innovation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              The platform thrives on community contributions across multiple categories, creating a rich ecosystem 
              of user-generated content validated by both AI and peer review.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Submission Categories</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-ani" />
                    <span className="text-sm">Art & Visual Creations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-grok" />
                    <span className="text-sm">Code & Technical Solutions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Scroll className="h-4 w-4" />
                    <span className="text-sm">Lore & World Building</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="h-4 w-4" />
                    <span className="text-sm">Game Concepts & Mechanics</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Reward Mechanisms</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Peer voting determines content quality</li>
                  <li>• Approved submissions earn GAC tokens</li>
                  <li>• Popular content creators receive NFT rewards</li>
                  <li>• Community moderators earn faction points</li>
                  <li>• Cross-faction collaboration bonuses</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tokenomics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Tokenomics & Economic Model</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Token Distribution</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Community Rewards</span>
                    <span className="font-mono">40%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Challenge Pool</span>
                    <span className="font-mono">25%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Development Fund</span>
                    <span className="font-mono">20%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AI Operations</span>
                    <span className="font-mono">10%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reserve Fund</span>
                    <span className="font-mono">5%</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Earning Mechanisms</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Complete faction-aligned challenges</li>
                  <li>• Participate in StoryChain voting</li>
                  <li>• Create approved community content</li>
                  <li>• Trade NFTs in the marketplace</li>
                  <li>• Engage with AI personalities</li>
                  <li>• Achieve level-up milestones</li>
                </ul>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Deflationary Mechanics</h4>
              <p className="text-sm text-muted-foreground">
                A portion of all transaction fees and NFT trades are permanently removed from circulation, 
                creating a deflationary pressure that benefits long-term holders while funding continued 
                AI development and platform enhancement.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Technical Implementation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Technical Implementation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold">AI Integration</h4>
                <p className="text-sm text-muted-foreground">
                  Utilizing OpenAI's latest GPT-5 model with custom system prompts to maintain consistent 
                  personalities for Grok and Ani. Each interaction is contextually aware and contributes 
                  to the evolving narrative.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold">Challenge Validation</h4>
                <p className="text-sm text-muted-foreground">
                  Advanced AI algorithms evaluate submissions across multiple dimensions: technical correctness, 
                  creative innovation, completeness, and clarity. This provides immediate feedback while maintaining 
                  objective scoring standards.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold">Security & Authentication</h4>
                <p className="text-sm text-muted-foreground">
                  Built on secure OAuth 2.0 with session-based authentication, encrypted data storage, and 
                  comprehensive input validation to protect user assets and maintain platform integrity.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Roadmap */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Development Roadmap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-green-600">Phase 1: COMPLETED</Badge>
                  <span className="font-semibold">Foundation & Core Features</span>
                </div>
                <ul className="text-sm space-y-1 text-muted-foreground ml-4">
                  <li>• Dual AI personality implementation</li>
                  <li>• Interactive challenge system</li>
                  <li>• StoryChain voting mechanism</li>
                  <li>• NFT marketplace foundation</li>
                  <li>• Community submission platform</li>
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-blue-600">Phase 2: IN PROGRESS</Badge>
                  <span className="font-semibold">Enhanced AI & Blockchain Integration</span>
                </div>
                <ul className="text-sm space-y-1 text-muted-foreground ml-4">
                  <li>• Advanced AI memory and learning</li>
                  <li>• Cross-chain compatibility</li>
                  <li>• Enhanced tokenomics implementation</li>
                  <li>• Mobile application development</li>
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">Phase 3: PLANNED</Badge>
                  <span className="font-semibold">Expansion & Governance</span>
                </div>
                <ul className="text-sm space-y-1 text-muted-foreground ml-4">
                  <li>• DAO governance structure</li>
                  <li>• Additional AI personalities</li>
                  <li>• Virtual world integration</li>
                  <li>• Enterprise partnerships</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conclusion */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">The Future of Conscious Currency</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              Grok & Ani represents more than just another cryptocurrency project. It's an exploration of artificial 
              consciousness, human creativity, and the intersection of technology with storytelling. By creating a platform 
              where logic and emotion coexist and influence each other, we're building the foundation for a new type of 
              digital economy—one that values both analytical thinking and creative expression.
            </p>
            
            <p className="text-muted-foreground leading-relaxed mt-4">
              Join us in this revolutionary journey as we explore what it means for AI to be truly conscious, and how 
              human and artificial intelligence can collaborate to create something greater than the sum of their parts.
            </p>

            <div className="flex justify-center mt-6">
              <Badge className="bg-gradient-to-r from-grok to-ani text-white px-6 py-2">
                The Future is Conscious
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}