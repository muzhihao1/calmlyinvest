#!/bin/bash

# Script to delete ROLLED option holdings via API
# These options were marked as ROLLED but not properly cleaned up

# Your authentication token (get from browser localStorage)
# Replace with actual token
TOKEN="your-token-here"

# API endpoint
API_URL="https://calmlyinvest.vercel.app"

# Option IDs to delete
OPTION1="c01d8cb8-99b2-4c1b-b00a-90d6195fcf08"  # QQQ251003P600
OPTION2="70331027-593f-4a39-ac77-179ae2767ad1"  # NVDA251017P175

echo "🗑️  Deleting ROLLED option holdings..."
echo

# Delete first option
echo "Deleting QQQ PUT option..."
curl -X DELETE \
  "${API_URL}/api/options/${OPTION1}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -v

echo
echo

# Delete second option
echo "Deleting NVDA PUT option..."
curl -X DELETE \
  "${API_URL}/api/options/${OPTION2}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -v

echo
echo
echo "✅ Done! Check your portfolio to verify margin has been reset to \$0."
