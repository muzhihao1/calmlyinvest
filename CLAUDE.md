# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Stock Portfolio Risk Management Application (持仓助手 / 智能仓位管家) - a financial risk analysis tool designed for Chinese stock market investors. The application helps users monitor and manage portfolio risk through real-time leverage calculations, position analysis, and smart recommendations.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + TypeScript (with Vercel serverless functions in `/api`)
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication**: Supabase Auth
- **Market Data**: Yahoo Finance API (`yahoo-finance2`)
- **Styling**: Tailwind CSS + Radix UI components
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Routing**: Wouter

## Development Commands

```bash
# Start development server (frontend + backend with hot reload)
npm run dev

# Type checking
npm run check

# Build for production
npm run build

# Build server only
npm run build:server

# Run production server
npm run start

# Push database schema changes (when using Drizzle)
npm run db:push
```

## Architecture Overview

### Directory Structure
```
/
├── client/          # React frontend
│   └── src/
│       ├── components/    # UI components
│       ├── hooks/        # Custom React hooks
│       └── lib/          # Utilities and helpers
├── server/          # Express backend
│   ├── routes.ts    # API endpoint definitions
│   ├── storage.ts   # Database access layer
│   └── market-data.ts # Yahoo Finance integration
├── api/            # Vercel serverless functions
│   ├── auth/       # Authentication endpoints
│   └── index.ts    # Main API handler
├── shared/          # Shared types and schemas
│   └── schema.ts    # Database schema + Zod validation
├── supabase/       # Supabase-specific files
└── migrations/      # Database migrations and data scripts
```

### Path Aliases
- `@/` → `./client/src/`
- `@shared/` → `./shared/`
- `@assets/` → `./attached_assets/`

### Key Database Tables
- `users` - User authentication (Supabase Auth integrated)
- `portfolios` - Portfolio metadata (equity, cash, margin)
- `stockHoldings` - Stock positions
- `optionHoldings` - Option positions
- `riskMetrics` - Calculated risk indicators
- `riskSettings` - User risk thresholds
- `riskHistory` - Historical risk tracking

Note: All tables use UUID-based user IDs and have Row Level Security (RLS) policies enabled.

## Environment Variables

Create `.env` file with:
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

For server-side operations, create `.env.supabase`:
```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Domain Knowledge

### Risk Calculations
The application calculates several key risk metrics:
- **Leverage Ratio (杠杆率)**: Total Market Value / Net Assets
- **Portfolio Beta**: Weighted average of individual stock betas
- **Concentration Risk**: Position size relative to portfolio
- **Margin Usage**: Used margin / Available margin

### Chinese Market Considerations
- All monetary values are in CNY (人民币)
- Stock codes follow Chinese format (e.g., 000001.SZ, 600000.SH)
- Option contracts follow Chinese derivatives standards
- Business hours align with Chinese markets (9:30-11:30, 13:00-15:00)

## Development Guidelines

### Authentication Modes
- **Guest Mode**: Uses memory storage (no persistence)
- **Authenticated Mode**: Uses Supabase database with RLS
- **Demo Account**: Username: `demo`, Password: `demo123`

### API Endpoints Pattern
All API endpoints follow RESTful conventions:
```
GET    /api/portfolios/:userId         # Get user portfolios
POST   /api/holdings                   # Create holding
PUT    /api/holdings/:id              # Update holding
DELETE /api/holdings/:id              # Delete holding
POST   /api/risk/calculate            # Calculate risk metrics
```

Vercel serverless functions in `/api` directory handle authentication separately.

### State Management
- Use TanStack Query for all API calls
- Cache invalidation on mutations
- Optimistic updates for better UX
- Error boundaries for graceful failures

### Type Safety
- Shared types between client/server in `/shared`
- Zod schemas for runtime validation
- TypeScript strict mode enabled
- Validate all API inputs/outputs

### UI/UX Patterns
- Mobile-first responsive design
- Loading states for all async operations
- Error messages in both English and Chinese
- Toast notifications for user feedback
- Form validation with helpful error messages
- CSV import functionality for batch operations

### Security Considerations
- Supabase Row Level Security (RLS) for data isolation
- Environment variables for all secrets
- Server-side validation of all inputs
- Service role key only on server side
- Authentication required for all portfolio operations

## Common Tasks

### Adding a New Risk Metric
1. Update schema in `/shared/schema.ts`
2. Add calculation logic in server routes
3. Update `RiskMetrics` type and API
4. Add UI component in `/client/src/components`
5. Update risk history tracking

### Modifying Database Schema
1. Update `/shared/schema.ts`
2. Create migration SQL in `/migrations/`
3. Apply via Supabase dashboard or CLI
4. Update RLS policies if needed
5. Test data migrations carefully

### Adding New Chart Visualization
1. Create component in `/client/src/components/charts`
2. Use Recharts library for consistency
3. Implement responsive design
4. Add loading and error states
5. Connect to data via custom hooks

### Database Migration
- Use migration scripts in `/migrations/` directory
- Run user data migration: `npx tsx migrations/002_migrate_user_data.ts`
- Setup script available: `./setup-supabase.sh`

## Deployment

### Vercel Deployment
- Frontend builds to `dist/public`
- API functions in `/api` directory
- Environment variables set in Vercel dashboard

### Build Output
- Client: `dist/public`
- Server: `dist` (when using Express)

## Performance Considerations
- Debounce real-time calculations (500ms)
- Batch API requests where possible
- Use React.memo for expensive components
- Implement virtual scrolling for large tables
- Cache market data for 5 minutes
- Yahoo Finance API rate limiting

## Debugging Tips
- Check browser console for API errors
- Server logs include request IDs
- Supabase dashboard for database queries
- React Query DevTools available in development
- TypeScript errors indicate most common issues
- Test auth flows with `test-auth.html`