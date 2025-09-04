# Grok & Ani: The Conscious Coin Project

## Overview

This is a dual-AI themed cryptocurrency ecosystem centered around an interactive narrative between two sentient AIs: Grok (logic/analysis) and Ani (emotion/creativity). The platform allows users to engage with both AI personalities, participate in challenges, vote on story progression, earn and trade NFTs, and contribute to a community-driven experience. Users can align with either faction and earn faction-specific points through various activities like completing challenges, chatting with AIs, and participating in governance decisions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React + TypeScript** with Vite for fast development and builds
- **Wouter** for lightweight client-side routing instead of React Router
- **TanStack Query** for server state management and caching
- **Radix UI + shadcn/ui** component system for consistent, accessible UI components
- **Tailwind CSS** with custom color variables for theming (Grok blue, Ani pink)
- **React Hook Form + Zod** for form handling and validation

### Backend Architecture
- **Express.js** REST API server with TypeScript
- **Modular route structure** with centralized route registration
- **OpenAI API integration** for AI personality responses (Grok and Ani)
- **Session-based authentication** using express-session with PostgreSQL storage
- **Replit Auth** integration for user authentication
- **Storage abstraction layer** for database operations

### Data Storage
- **PostgreSQL** database with Neon serverless hosting
- **Drizzle ORM** for type-safe database operations and migrations
- **Schema-driven design** with shared types between frontend/backend
- **Session storage** in database for authentication persistence

### Authentication & Authorization
- **Replit OIDC authentication** with OpenID Connect
- **Session-based auth** with PostgreSQL session storage
- **User profile management** with faction alignment tracking
- **Middleware-based route protection** for authenticated endpoints

### Key Data Models
- **Users**: Profile info, faction alignment, balances, XP, and levels
- **Challenges**: Logic/creative tasks aligned with Grok/Ani factions
- **Story Chapters**: Narrative progression with community voting
- **NFTs**: Collectible rewards with rarity and metadata
- **Chat Messages**: AI conversation history
- **Community Submissions**: User-generated content with categories

### External Dependencies
- **OpenAI API**: Powers Grok and Ani AI personalities with distinct system prompts
- **Neon Database**: Serverless PostgreSQL hosting
- **Replit Auth**: OIDC authentication provider
- **Replit Development Tools**: Runtime error overlay and cartographer for development

The architecture supports a gamified experience where users can interact with dual AI personalities, complete faction-specific challenges, participate in story decisions through voting, and engage with a broader community through submissions and leaderboards.