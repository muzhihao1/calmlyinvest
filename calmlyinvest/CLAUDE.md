# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Important**: When working with this codebase, always start by running: `/mcp__serena__initial_instructions`

## Project Overview

This is a Stock Portfolio Risk Management Application (持仓助手 / 智能仓位管家) - a financial risk analysis tool designed for Chinese stock market investors. The application helps users monitor and manage portfolio risk through real-time leverage calculations, position analysis, and smart recommendations.

**Important**: The actual project code is located in the `calmlyinvest` subdirectory, not at the repository root.

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
# Navigate to project directory first
cd calmlyinvest

# Install dependencies
npm install

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

# Update user holdings script
npm run update:holdings
```

## Architecture Overview

### Directory Structure
```
calmlyinvest/
├── client/          # React frontend
│   └── src/
│       ├── components/    # UI components
│       ├── hooks/        # Custom React hooks
│       ├── pages/        # Page components
│       ├── contexts/     # React contexts
│       └── lib/          # Utilities and helpers
├── server/          # Express backend
│   ├── routes.ts    # API endpoint definitions
│   ├── storage-*.ts # Database access layers
│   ├── market-data.ts # Yahoo Finance integration
│   └── auth-supabase.ts # Authentication middleware
├── api/            # Vercel serverless functions
│   ├── auth/       # Authentication endpoints
│   └── index.ts    # Main API handler
├── shared/          # Shared types and schemas
│   └── schema*.ts   # Database schemas + Zod validation
├── supabase/       # Supabase-specific files
├── migrations/      # Database migrations and data scripts
└── scripts/         # Utility scripts
```

### Path Aliases
- `@/` → `./client/src/`
- `@shared/` → `./shared/`
- `@assets/` → `./attached_assets/`

### Key Database Tables
- `users` - User authentication (Supabase Auth integrated)
- `portfolios` - Portfolio metadata (equity, cash, margin)
- `stock_holdings` - Stock positions
- `option_holdings` - Option positions
- `risk_metrics` - Calculated risk indicators
- `risk_settings` - User risk thresholds
- `risk_history` - Historical risk tracking

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

## Testing

Currently, the project relies on:
- TypeScript type checking (`npm run check`)
- Manual testing in development mode
- Vercel preview deployments for staging tests

No automated test suite is currently implemented.

## Deployment

### Vercel Deployment
- Build command: `vite build` (from `vercel.json`)
- Output directory: `dist/public`
- API rewrites configured for `/api/*` routes
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

## Additional Resources

### Documentation Files

All technical documentation is now organized in the `/docs` directory:

**Deployment**:
- `docs/deployment/deployment-guide.md` - Complete deployment guide
- `docs/deployment/vercel-setup.md` - Vercel configuration

**Security**:
- `docs/security/security-checklist.md` - Security checklist
- `docs/security/incident-response.md` - Security incident response
- `URGENT_SECURITY_RESPONSE.md` (root) - Current security response

**Development**:
- `docs/development/supabase-migration.md` - Database migration guide
- `docs/development/supabase-setup.md` - Supabase setup
- `docs/development/mcp-setup.md` - MCP server configuration
- `docs/development/auth-troubleshooting.md` - Authentication troubleshooting
- `TROUBLESHOOTING.md` (root) - Common issues and solutions

**Archive**:
- `docs/archive/` - Historical documents and reports

See `docs/README.md` for complete documentation structure

### Live Demo
- URL: https://calmlyinvest.vercel.app
- Demo Account: Username `demo`, Password `demo123`
- Guest Mode: Available without login (data stored in memory)

## Storage Layer Architecture

The application uses a flexible storage architecture with multiple adapters:
- `storage-guest.ts` - In-memory storage for guest users
- `storage-uuid.ts` - UUID-based storage for authenticated users
- `storage-wrapper.ts` - Storage adapter wrapper with logging
- `supabase-storage.ts` - Direct Supabase database access
- `storage-init.ts` - Storage initialization and selection logic

## Authentication Flow

1. **Registration**: `/api/auth/register.ts` - Creates new user account
2. **Login**: `/api/auth/login.ts` - Authenticates and returns JWT token
3. **Session Management**: JWT tokens stored in localStorage
4. **Protected Routes**: `<ProtectedRoute>` component handles route protection
5. **Auth Context**: `AuthContext` provides authentication state globally

## Supabase Setup Requirements

1. Enable authentication with email/password provider
2. Disable email confirmation for development (see `migrations/004_disable_email_confirmation_dev.sql`)
3. Configure Row Level Security (RLS) policies for all tables
4. Set up proper indexes for performance
5. Configure rate limiting to prevent abuse

## Yahoo Finance Integration

The `market-data.ts` module handles:
- Real-time stock price fetching
- Beta value calculations
- Market data caching (5-minute TTL)
- Error handling for API failures
- Rate limiting compliance

## CSV Import Format

For bulk stock imports, CSV should contain:
```csv
code,name,quantity,cost,current_price
000001.SZ,平安银行,1000,12.50,13.20
600000.SH,浦发银行,500,8.30,8.50
```

## MCP (Model Context Protocol) Integration

The repository includes MCP server configuration:
- `cursor-mcp-config.json` - Cursor IDE MCP configuration
- `graphiti_mcp_server.py` - Graphiti MCP server implementation
- MCP servers provide enhanced IDE capabilities and knowledge graph integration