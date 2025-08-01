# Stock Portfolio Risk Manager

## Overview

This application is a comprehensive stock and options portfolio risk management system designed for retail investors. It provides scientific leverage ratio calculations, real-time risk monitoring, and intelligent suggestions to help users manage their investment portfolios effectively.

The system features a modern React frontend with TypeScript, an Express.js backend, and PostgreSQL database integration through Drizzle ORM. The application focuses on providing clear risk visualization through a three-color warning system and educational content to help users understand risk management principles.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Radix UI components with Tailwind CSS for styling
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: Express sessions with PostgreSQL store
- **API Design**: RESTful API endpoints

### Database Design
- **ORM**: Drizzle ORM for type-safe database operations
- **Migration**: Drizzle Kit for schema migrations
- **Connection**: Neon serverless PostgreSQL

## Key Components

### Core Entities
1. **Users**: Basic user authentication and profile management
2. **Portfolios**: Multiple portfolio support per user
3. **Stock Holdings**: Individual stock positions with pricing data
4. **Option Holdings**: Options positions with Greeks and expiration tracking
5. **Risk Metrics**: Calculated risk indicators and leverage ratios
6. **Risk Settings**: User-configurable risk thresholds and preferences

### Risk Calculation Engine
- **Leverage Ratio Formula**: (Stock Value + Option Max Loss) / Total Equity
- **Portfolio Beta**: Weighted average of individual stock betas
- **Concentration Risk**: Maximum single position percentage
- **Option Risk Assessment**: Greeks-based risk calculations with expiration tracking

### Three-Color Risk System
- **Green (Safe)**: Leverage ratio < 1.0, risk controlled
- **Yellow (Warning)**: 1.0 ≤ leverage ratio < 1.5, requires attention
- **Red (Danger)**: Leverage ratio ≥ 1.5, immediate action recommended

## Data Flow

### Real-time Updates
1. User inputs holdings data manually or via CSV import
2. System fetches current market prices via API
3. Risk calculator processes all positions to generate metrics
4. Dashboard displays updated risk status with visual indicators
5. Smart suggestion engine analyzes portfolio and generates recommendations

### Risk Monitoring Workflow
1. Portfolio data collection and validation
2. Market data integration for current pricing
3. Risk metric calculations using scientific formulas
4. Threshold comparison and alert generation
5. Intelligent recommendation generation based on risk profile

## External Dependencies

### Core Libraries
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/react-***: Comprehensive UI component library
- **drizzle-orm**: Type-safe database ORM
- **@neondatabase/serverless**: PostgreSQL serverless connection
- **react-hook-form**: Form state management and validation
- **zod**: Schema validation and type inference

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Static type checking
- **Tailwind CSS**: Utility-first CSS framework
- **ESLint/Prettier**: Code quality and formatting

### Database and Infrastructure
- **PostgreSQL**: Primary database for data persistence
- **Neon**: Serverless PostgreSQL hosting
- **connect-pg-simple**: PostgreSQL session store

## Deployment Strategy

### Development Environment
- Vite development server with hot module replacement
- Concurrent frontend and backend development with proxy setup
- Replit-specific error overlay and debugging tools

### Production Build
- Vite builds optimized frontend bundle to `dist/public`
- ESBuild bundles backend TypeScript to `dist/index.js`
- Static file serving from Express for SPA deployment

### Database Management
- Drizzle migrations for schema versioning
- Environment-based database configuration
- Connection pooling for production scalability

### Environment Configuration
- `NODE_ENV` for environment detection
- `DATABASE_URL` for PostgreSQL connection
- Separate build and runtime configurations

## Changelog

Changelog:
- July 05, 2025. Initial setup
- July 05, 2025. Enhanced features:
  - Added CSV import/export functionality for bulk data management
  - Implemented real-time market data service with automatic price updates (5-minute intervals)
  - Added comprehensive data visualization with charts (portfolio composition, risk trends, holdings analysis)
  - Improved mobile responsiveness throughout the dashboard
  - Added risk history table to track historical risk metrics
  - Enhanced tab navigation for mobile devices with condensed labels

## User Preferences

Preferred communication style: Simple, everyday language.