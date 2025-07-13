#!/bin/bash

echo "=== Supabase Setup Script ==="
echo ""
echo "This script will help you set up the Supabase-only authentication system."
echo ""

# Check if .env.supabase exists
if [ ! -f .env.supabase ]; then
    echo "❌ .env.supabase file not found!"
    echo "Please create it first."
    exit 1
fi

# Check if service role key is set
if grep -q "your-service-role-key-here" .env.supabase; then
    echo "⚠️  You need to add your Supabase service role key to .env.supabase"
    echo ""
    echo "1. Go to: https://app.supabase.com/project/hsfthqchyupkbmazcuis/settings/api"
    echo "2. Copy the 'service_role' key (under Project API keys)"
    echo "3. Replace 'your-service-role-key-here' in .env.supabase"
    echo ""
    read -p "Press Enter when you've added the service role key..."
fi

echo ""
echo "📋 Steps to complete the migration:"
echo ""
echo "1. Run the database migration in Supabase Dashboard:"
echo "   - Go to: https://app.supabase.com/project/hsfthqchyupkbmazcuis/sql/new"
echo "   - Copy the contents of migrations/001_supabase_schema.sql"
echo "   - Paste and run it in the SQL editor"
echo ""
read -p "Press Enter when you've run the database migration..."

echo ""
echo "2. Copy environment variables:"
echo "   cp .env.supabase .env"
echo ""
read -p "Press Enter to copy environment variables..."
cp .env.supabase .env

echo ""
echo "3. Install dependencies (if needed):"
echo "   npm install @supabase/supabase-js"
echo ""
read -p "Press Enter to install dependencies..."
npm install @supabase/supabase-js

echo ""
echo "4. Run the data migration for user 279838958@qq.com:"
echo "   npx tsx migrations/002_migrate_user_data.ts"
echo ""
read -p "Press Enter to run the data migration..."
npx tsx migrations/002_migrate_user_data.ts

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update server/index.ts to use routes-supabase.ts instead of routes.ts"
echo "2. Update client to use Supabase authentication"
echo "3. Remove old authentication files:"
echo "   - server/auth-hybrid.ts"
echo "   - server/utils/user-mapping.ts"
echo "   - client/src/lib/auth-hybrid.ts"
echo ""
echo "Your app is now ready to use Supabase-only authentication!"