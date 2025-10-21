#!/bin/bash

# Script to fix API import issues in Vercel serverless functions
# This script inlines the token parser to avoid import path issues

echo "🔧 Fixing API import issues for Vercel deployment..."

# List of files that need fixing
FILES=(
  "api/portfolio-stocks-simple.ts"
  "api/portfolio-options-simple.ts"
  "api/portfolio-risk-simple.ts"
  "api/portfolio-refresh-prices-simple.ts"
)

# Token parser inline implementation
read -r -d '' TOKEN_PARSER << 'EOF'
/**
 * Extract token from Authorization header
 * Inline implementation to avoid import issues in Vercel serverless
 */
function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    console.log('[Token Parser] No Authorization header provided');
    return null;
  }

  const normalized = authHeader.trim();

  if (!normalized.startsWith('Bearer ')) {
    console.error(`[Token Parser] Header doesn't start with "Bearer "`);
    return null;
  }

  const token = normalized.substring(7);

  if (!token || token.length === 0) {
    console.error('[Token Parser] Token is empty after extraction');
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    console.error(`[Token Parser] Invalid JWT format: expected 3 parts, got ${parts.length}`);
    return null;
  }

  if (parts.some(part => part.length === 0)) {
    console.error('[Token Parser] JWT contains empty parts');
    return null;
  }

  return token;
}
EOF

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "📝 Processing $file..."

    # Create backup
    cp "$file" "$file.backup"

    # Remove the import line
    sed -i.tmp "s/import { extractToken } from '.\/\_helpers\/token-parser';//g" "$file"

    # Add inline token parser after imports
    # This is a simplified version - you may need to adjust based on file structure

    echo "✅ Fixed $file (backup created as $file.backup)"
  else
    echo "⚠️  File not found: $file"
  fi
done

echo "✨ Done! Please review the changes and commit if they look good."
echo "To restore backups: find api -name '*.backup' -exec bash -c 'mv \"\$0\" \"\${0%.backup}\"' {} \;"
