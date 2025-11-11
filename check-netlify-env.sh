#!/bin/bash
# Script to check if all required environment variables are set
# Run this locally to verify before deploying to Netlify

echo "=== Netlify Environment Variables Checklist ==="
echo ""

REQUIRED_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "AUTH0_SECRET"
  "AUTH0_BASE_URL"
  "AUTH0_ISSUER_BASE_URL"
  "AUTH0_CLIENT_ID"
  "AUTH0_CLIENT_SECRET"
  "GEMINI_API_KEY"
)

MISSING=0

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ $var is NOT set"
    MISSING=$((MISSING + 1))
  else
    echo "✅ $var is set"
  fi
done

echo ""
if [ $MISSING -eq 0 ]; then
  echo "✅ All required environment variables are set!"
  echo ""
  echo "To set these in Netlify:"
  echo "1. Go to Netlify Dashboard → Site settings → Environment variables"
  echo "2. Add each variable above with its value"
else
  echo "❌ $MISSING environment variable(s) are missing!"
  echo ""
  echo "Please set these in Netlify Dashboard → Environment variables"
fi

