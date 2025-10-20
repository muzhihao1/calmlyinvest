# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is CalmlyInvest (持仓助手 / 智能仓位管家) - a Stock Portfolio Risk Management Application designed for Chinese stock market investors. The application helps users monitor and manage portfolio risk through real-time leverage calculations, position analysis, and smart recommendations.

**Important**: The project code is at the repository root level (not in a subdirectory).

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + TypeScript (development) + Vercel Serverless Functions (production)
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication**: Supabase Auth with JWT tokens
- **Market Data**: Yahoo Finance API (`yahoo-finance2`)
- **Styling**: Tailwind CSS + Radix UI components
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Routing**: Wouter

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs both frontend and backend)
npm run dev

# Type checking
npm run check

# Build for production (frontend only)
npm run build

# Build server only (for standalone Express deployment)
npm run build:server

# Run production server (standalone Express mode)
npm run start

# Database operations
npm run db:push              # Push schema changes (Drizzle)
npm run update:holdings      # Update user holdings script
```

## Architecture Overview

### Directory Structure
```
root/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Page components
│   │   ├── contexts/     # React contexts
│   │   └── lib/          # Utilities and helpers
│   ├── index.html        # Entry HTML
│   └── public/          # Static assets
├── server/          # Express backend (dev mode)
│   ├── routes.ts           # API route definitions
│   ├── storage-*.ts        # Database access layers
│   ├── market-data.ts      # Yahoo Finance integration
│   └── auth-supabase.ts    # Authentication middleware
├── api/             # Vercel serverless functions (production)
│   ├── auth/               # Authentication endpoints
│   ├── portfolio/          # Portfolio management
│   ├── options/            # Options management
│   ├── *-simple.ts         # Individual API handlers
│   └── index.ts            # Legacy catch-all (deprecated)
├── shared/          # Shared types and schemas
│   ├── schema.ts           # Core data models
│   └── schema*.ts          # Additional schemas
├── supabase/        # Supabase configuration
├── migrations/      # Database migrations and scripts
├── scripts/         # Utility scripts
└── config/          # Configuration files
```

### Path Aliases
- `@/` → `./client/src/`
- `@shared/` → `./shared/`
- `@assets/` → `./attached_assets/`

### Key Database Tables
- `users` - User authentication (managed by Supabase Auth)
- `portfolios` - Portfolio metadata (equity, cash, margin)
- `stock_holdings` - Stock positions
- `option_holdings` - Option positions
- `risk_metrics` - Calculated risk indicators
- `risk_settings` - User risk thresholds
- `risk_history` - Historical risk tracking

**Important**: All tables use UUID-based user IDs and have Row Level Security (RLS) policies enabled.

## Deployment Architecture

The application uses a dual-mode architecture:

### Development Mode
- Express.js server (`server/index.ts`) handles all API routes
- Vite dev server for frontend with HMR
- Single process for both frontend and backend
- Run with: `npm run dev`

### Production Mode (Vercel)
- Frontend: Static build served from `dist/public`
- Backend: Individual serverless functions in `/api` directory
- Each API endpoint is a separate Vercel function
- Build command: `npm run build` (runs `vite build`)
- Output directory: `dist/public`

### Vercel Configuration (`vercel.json`)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist/public",
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/((?!api).*)", "destination": "/index.html" }
  ]
}
```

## Environment Variables

### Required for All Environments
Create `.env` file:
```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Required for Server-Side Operations
Create `.env.supabase` file:
```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Security Note**: Never commit actual `.env` files. Use `.env.example` as template.

### Vercel Deployment
Set environment variables in Vercel dashboard:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Domain Knowledge

### Risk Calculations
The application calculates several key risk metrics:
- **Leverage Ratio (杠杆率)**: Total Market Value / Net Assets
- **Portfolio Beta**: Weighted average of individual stock betas
- **Concentration Risk**: Position size relative to portfolio
- **Margin Usage**: Used margin / Available margin
- **Delta Exposure**: For option positions

### Chinese Market Considerations
- All monetary values are in CNY (人民币)
- Stock codes follow Chinese format (e.g., `000001.SZ`, `600000.SH`)
- Option contracts follow Chinese derivatives standards
- Business hours align with Chinese markets (9:30-11:30, 13:00-15:00 CST)

## Development Guidelines

### Authentication Modes
- **Guest Mode**: Uses in-memory storage (`storage-guest.ts`), no persistence
- **Authenticated Mode**: Uses Supabase with RLS (`storage-uuid.ts`, `supabase-storage.ts`)
- **Demo Account**: Username: `demo`, Password: `demo123`

### API Endpoints Pattern

In development (Express):
```
GET    /api/portfolios/:userId
POST   /api/holdings
PUT    /api/holdings/:id
DELETE /api/holdings/:id
POST   /api/risk/calculate
```

In production (Vercel):
- Each endpoint is a separate file in `/api`
- Example: `/api/portfolio-details-simple.ts` handles portfolio details
- Use `-simple.ts` suffix for simplified serverless implementations

### Storage Layer Architecture

The application uses a flexible storage adapter pattern:
- `storage-guest.ts` - In-memory storage for guest users
- `storage-uuid.ts` - UUID-based storage interface
- `supabase-storage.ts` - Direct Supabase database access
- `storage-wrapper.ts` - Wrapper with logging and monitoring
- `storage-init.ts` - Storage initialization and selection logic

Storage is selected based on authentication state and environment.

### State Management
- Use TanStack Query for all API calls
- Implement cache invalidation on mutations
- Use optimistic updates for better UX
- Wrap async operations in error boundaries

### Type Safety
- All shared types live in `/shared` directory
- Runtime validation with Zod schemas
- TypeScript strict mode enabled
- Validate all API inputs and outputs

### UI/UX Patterns
- Mobile-first responsive design
- Loading states for all async operations
- Bilingual error messages (English and Chinese)
- Toast notifications for user feedback
- Form validation with helpful error messages
- CSV import functionality for batch operations

### Security Considerations
- Supabase Row Level Security (RLS) enforces data isolation
- All secrets in environment variables
- Server-side validation of all inputs
- Service role key only accessible server-side
- Authentication required for all portfolio operations
- JWT tokens stored in localStorage (client-side)

## Common Tasks

### Adding a New API Endpoint

**For Development (Express)**:
1. Add route handler in `server/routes.ts`
2. Implement business logic
3. Add type definitions in `shared/schema.ts`

**For Production (Vercel)**:
1. Create new file in `/api` directory (e.g., `api/new-feature-simple.ts`)
2. Export default handler function with type `VercelRequest, VercelResponse`
3. Import shared utilities from `/api/_helpers` or `/api/_utils`
4. Test locally with `vercel dev`

### Modifying Database Schema
1. Update schema definitions in `/shared/schema.ts`
2. Create migration SQL in `/migrations/` directory
3. Apply migration via Supabase dashboard or CLI
4. Update RLS policies if table structure changed
5. Test migrations with sample data before production

### Adding New Risk Metric
1. Update `RiskMetrics` type in `/shared/schema.ts`
2. Add calculation logic in risk calculation functions
3. Update UI components in `/client/src/components`
4. Add historical tracking if needed
5. Update dashboard displays

### Working with Market Data
- Yahoo Finance integration in `server/market-data.ts`
- Data cached for 5 minutes to respect rate limits
- Beta values fetched from Yahoo Finance
- Stock prices updated in real-time
- Handle API failures gracefully with fallback values

### CSV Import Format
For bulk stock imports:
```csv
code,name,quantity,cost,current_price
000001.SZ,平安银行,1000,12.50,13.20
600000.SH,浦发银行,500,8.30,8.50
```

## Testing

Current testing approach:
- TypeScript type checking: `npm run check`
- Manual testing in development mode
- Vercel preview deployments for staging tests
- No automated test suite currently implemented

## Debugging Tips

- **Frontend Errors**: Check browser console for React/API errors
- **Backend Errors**: Check Vercel function logs or Express console
- **Database Issues**: Use Supabase dashboard SQL editor and logs
- **API Issues**: Server logs include request IDs for tracing
- **Auth Issues**: Test auth flows with `test-auth.html` (if available)
- **Type Errors**: Run `npm run check` to catch TypeScript issues
- **React Query**: DevTools available in development mode

## Performance Considerations

- Debounce real-time calculations (500ms delay)
- Batch API requests where possible
- Use `React.memo` for expensive components
- Implement virtual scrolling for large tables (if needed)
- Market data cached for 5 minutes
- Yahoo Finance API has rate limits - handle gracefully
- Optimize Recharts renders with `isAnimationActive={false}` for large datasets

## Supabase Setup Requirements

1. Enable email/password authentication provider
2. Disable email confirmation for development (see migrations)
3. Configure Row Level Security (RLS) policies for all tables
4. Set up indexes for performance on frequently queried columns
5. Configure rate limiting to prevent abuse
6. Enable realtime subscriptions if needed

## Authentication Flow

1. **Registration**: `POST /api/auth/register` - Creates new user
2. **Login**: `POST /api/auth/login` - Returns JWT token
3. **Session**: JWT stored in localStorage, sent in Authorization header
4. **Protected Routes**: `<ProtectedRoute>` component enforces auth
5. **Context**: `AuthContext` provides global auth state

## Additional Resources

### Documentation Files
- `README_CALMLY.md` - Chinese language user guide
- `CURRENT_STATUS.md` - System status and recent updates (if exists)
- `DEPLOYMENT.md` - Detailed deployment guide (if exists)
- `TROUBLESHOOTING.md` - Common issues and solutions (if exists)

### Live Demo
- URL: https://calmlyinvest.vercel.app
- Demo Account: Username `demo`, Password `demo123`
- Guest Mode: Available without login (non-persistent)

## Known Issues and Troubleshooting

### Vercel Deployment Issues
- Ensure all environment variables are set in Vercel dashboard
- Check that API functions are in `/api` directory at root level
- Verify `vercel.json` configuration is correct
- Build output must go to `dist/public` as configured

### Common Development Issues
- **Module resolution errors**: Check `tsconfig.json` path aliases
- **API 404 errors**: Verify API functions exist and are exported correctly
- **Auth failures**: Check Supabase connection and RLS policies
- **Price fetch failures**: Yahoo Finance API may have rate limits
- **TypeScript errors**: Run `npm run check` and fix type issues

## MCP (Model Context Protocol) Integration

The repository includes MCP server configuration in `.cursor/mcp.json`:
- **Supabase MCP**: Direct database operations and queries
- **Notion MCP**: Documentation and note-taking
- **Context7 MCP**: Enhanced code context and documentation
- **Sequential Thinking MCP**: Problem-solving workflows
- **Playwright MCP**: Browser automation and testing
- **Ultra MCP**: Advanced AI capabilities and code analysis

These provide enhanced IDE capabilities and database integration.
