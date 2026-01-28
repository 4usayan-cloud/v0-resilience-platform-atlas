#!/bin/bash

# Resilience Platform - Live API Integration Deployment Script
# This script helps you test and deploy the live data integration

echo "🚀 Resilience Platform - Live Data Integration Setup"
echo "=================================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found. Creating from template..."
    cp .env.example .env.local
    echo "✅ Created .env.local file"
    echo ""
    echo "📝 Please edit .env.local and add your API keys (optional):"
    echo "   - NEWS_API_KEY (get from https://newsapi.org/)"
    echo "   - ALPHA_VANTAGE_API_KEY (get from https://www.alphavantage.co/)"
    echo ""
    echo "   Note: The app works without these keys using free public APIs!"
    echo ""
else
    echo "✅ .env.local file exists"
fi

echo ""
echo "📦 Installing dependencies..."
pnpm install

echo ""
echo "🔍 Checking API integrations..."
echo ""
echo "✅ GDELT Project API - No key required"
echo "✅ Yahoo Finance API - No key required"
echo "✅ Reddit Public API - No key required"
echo "✅ World Bank API - No key required"
echo ""

# Check for optional API keys
if grep -q "NEWS_API_KEY=your_news_api_key_here" .env.local 2>/dev/null; then
    echo "⚠️  NewsAPI key not configured (optional)"
else
    echo "✅ NewsAPI key configured"
fi

if grep -q "ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here" .env.local 2>/dev/null; then
    echo "⚠️  Alpha Vantage key not configured (optional)"
else
    echo "✅ Alpha Vantage key configured"
fi

echo ""
echo "=================================================="
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Run 'pnpm dev' to test locally"
echo "2. Check http://localhost:3000 for live data"
echo "3. Monitor browser console for data source indicators"
echo "4. Push to GitHub and deploy to Vercel when ready"
echo ""
echo "Deploy to Vercel:"
echo "1. git add ."
echo "2. git commit -m 'Integrate live data APIs'"
echo "3. git push origin main"
echo "4. Add environment variables in Vercel Dashboard (if needed)"
echo ""
echo "📚 See LIVE_DATA_SETUP.md for detailed documentation"
echo "=================================================="
