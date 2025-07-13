# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Stock Portfolio Risk Management Application (持仓助手 / 智能仓位管家) - a financial risk analysis tool designed for Chinese stock market investors. The application helps users monitor and manage portfolio risk through real-time leverage calculations, position analysis, and smart recommendations.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM (via Neon serverless)
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

# Run production server
npm run start

# Push database schema changes
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
│   ├── routes-supabase.ts # API endpoint definitions with Supabase auth
│   ├── storage.ts   # Database access layer
│   └── market-data.ts # Market price updates
├── shared/          # Shared types and schemas
│   └── schema.ts    # Database schema + Zod validation
└── migrations/      # Database migrations
```

### Path Aliases
- `@/` → `./client/src/`
- `@shared/` → `./shared/`
- `@assets/` → `./attached_assets/`

### Key Database Tables
- `users` - User authentication
- `portfolios` - Portfolio metadata (equity, cash, margin)
- `stockHoldings` - Stock positions
- `optionHoldings` - Option positions
- `riskMetrics` - Calculated risk indicators
- `riskSettings` - User risk thresholds
- `riskHistory` - Historical risk tracking

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

### API Endpoints Pattern
All API endpoints follow RESTful conventions:
```
GET    /api/portfolios/:userId         # Get user portfolios
POST   /api/holdings                   # Create holding
PUT    /api/holdings/:id              # Update holding
DELETE /api/holdings/:id              # Delete holding
POST   /api/risk/calculate            # Calculate risk metrics
```

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

### Security Considerations
- Environment variables for all secrets
- Server-side validation of all inputs
- Parameterized queries via Drizzle ORM
- CORS configured for production domains
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
2. Run `npm run db:push` to apply changes
3. Update relevant API endpoints
4. Update TypeScript types
5. Test data migrations carefully

### Adding New Chart Visualization
1. Create component in `/client/src/components/charts`
2. Use Recharts library for consistency
3. Implement responsive design
4. Add loading and error states
5. Connect to data via custom hooks

## Performance Considerations
- Debounce real-time calculations (500ms)
- Batch API requests where possible
- Use React.memo for expensive components
- Implement virtual scrolling for large tables
- Cache market data for 5 minutes

## Debugging Tips
- Check browser console for API errors
- Server logs include request IDs
- Database queries logged in development
- React Query DevTools available in development
- TypeScript errors indicate most common issues