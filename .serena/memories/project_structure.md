# CalmlyInvest Project Structure

## Root Directory
```
CamlyInvest/
└── calmlyinvest/      # Main project directory
```

## Main Project Structure
```
calmlyinvest/
├── client/            # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   │   └── ui/       # Radix UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Page components
│   │   ├── contexts/     # React contexts
│   │   └── lib/          # Utilities and helpers
│   └── public/           # Static assets
├── server/            # Express backend
│   ├── routes.ts         # API endpoint definitions
│   ├── storage-*.ts      # Database access layers
│   ├── market-data.ts    # Yahoo Finance integration
│   ├── auth-supabase.ts  # Authentication middleware
│   └── utils/            # Server utilities
├── api/               # Vercel serverless functions
│   ├── auth/            # Authentication endpoints
│   │   ├── login.ts
│   │   └── register.ts
│   └── index.ts         # Main API handler
├── shared/            # Shared types and schemas
│   ├── schema.ts        # Main schema definitions
│   ├── schema-types.ts  # TypeScript types
│   └── schema-*.ts      # Schema variations
├── migrations/        # Database migrations
├── scripts/           # Utility scripts
├── supabase/         # Supabase-specific files
└── attached_assets/  # Documentation assets
```

## Storage Architecture
- `storage-guest.ts` - In-memory storage for guest users
- `storage-uuid.ts` - UUID-based storage for authenticated users
- `storage-wrapper.ts` - Storage adapter with logging
- `supabase-storage.ts` - Direct Supabase access
- `storage-init.ts` - Storage initialization logic

## Configuration Files
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite build configuration
- `vercel.json` - Vercel deployment settings
- `tailwind.config.ts` - Tailwind CSS configuration
- `.env` - Environment variables (not in git)