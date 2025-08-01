# CalmlyInvest Development Commands

## Setup Commands
```bash
# Navigate to project directory
cd calmlyinvest

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials
```

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

# Start production server
npm run start
```

## Database Commands
```bash
# Push database schema changes (when using Drizzle)
npm run db:push

# Update user holdings script
npm run update:holdings

# Run migrations
npx tsx migrations/002_migrate_user_data.ts

# Setup Supabase
./setup-supabase.sh
```

## System Commands (Darwin/macOS)
```bash
# List files
ls -la

# Change directory
cd <directory>

# View file content
cat <file>

# Search for text
grep -r "search term" .

# Find files
find . -name "*.ts"

# Git commands
git status
git add .
git commit -m "message"
git push
```

## Debugging Commands
```bash
# View server logs
tail -f server.log

# Check Vercel deployment logs
vercel logs

# Test Supabase connection
npx tsx test-supabase-rls.ts
```

## Vercel Deployment
```bash
# Deploy to Vercel
vercel

# Deploy to production
vercel --prod
```