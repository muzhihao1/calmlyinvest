# CalmlyInvest Tech Stack

## Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Radix UI components
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Routing**: Wouter
- **Icons**: Lucide React + React Icons

## Backend
- **Server**: Express.js + TypeScript
- **Serverless**: Vercel Functions (in /api directory)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth + JWT tokens
- **Market Data**: Yahoo Finance API (yahoo-finance2)
- **Password Hashing**: bcryptjs

## Database Schema
- PostgreSQL with UUID-based user IDs
- Row Level Security (RLS) for data isolation
- Main tables: users, portfolios, stock_holdings, option_holdings, risk_metrics, risk_settings, risk_history

## Deployment
- **Platform**: Vercel
- **Build Command**: vite build
- **Output Directory**: dist/public
- **API Routes**: /api/* handled by Vercel functions

## Development Tools
- **Type Checking**: TypeScript strict mode
- **Code Quality**: No automated tests currently
- **Package Manager**: npm
- **Node Version**: Compatible with Node 18+