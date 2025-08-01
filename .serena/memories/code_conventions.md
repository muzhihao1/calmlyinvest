# CalmlyInvest Code Conventions

## Project Structure
- Project code is in `calmlyinvest/` subdirectory (not repository root)
- Frontend code in `client/src/`
- Backend code in `server/`
- Shared types in `shared/`
- Vercel functions in `api/`

## Path Aliases
- `@/` → `./client/src/`
- `@shared/` → `./shared/`
- `@assets/` → `./attached_assets/`

## TypeScript Conventions
- Strict mode enabled
- Use Zod schemas for runtime validation
- Share types between client/server via `/shared` directory
- Validate all API inputs/outputs

## React Patterns
- Functional components with hooks
- Custom hooks in `hooks/` directory
- Context providers for global state
- Protected routes for authentication
- Error boundaries for graceful failures

## API Design
- RESTful conventions
- Authentication via Bearer tokens
- Error responses with appropriate HTTP status codes
- Request/response validation with Zod

## Database Conventions
- UUID-based primary keys
- Row Level Security (RLS) policies
- Timestamps on all tables (created_at, updated_at)
- Soft deletes where appropriate

## Security Practices
- Environment variables for all secrets
- Server-side validation of all inputs
- Service role key only on server side
- Authentication required for portfolio operations
- No hardcoded user credentials

## UI/UX Patterns
- Mobile-first responsive design
- Loading states for async operations
- Error messages in English and Chinese
- Toast notifications for feedback
- Form validation with helpful messages