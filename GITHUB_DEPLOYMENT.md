# GitHub Integration & Deployment Guide

## Quick Deployment to Vercel with GitHub

### Step 1: Commit and Push Changes

```bash
# Navigate to your project
cd /Users/sayansen/resilience_dashboard/v0-resilience-platform-atlas

# Check what files have changed
git status

# Add all changes
git add .

# Commit with descriptive message
git commit -m "feat: integrate live data APIs - NewsAPI, GDELT, Yahoo Finance, Reddit, World Bank"

# Push to GitHub
git push origin main
```

### Step 2: Configure Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Select your project: `v0-resilience-platform-atlas`
3. Go to **Settings** → **Environment Variables**
4. Add the following (optional, for enhanced features):

#### Optional API Keys:
```
NEWS_API_KEY = your_news_api_key
ALPHA_VANTAGE_API_KEY = your_alphavantage_key
REDDIT_CLIENT_ID = your_reddit_client_id (optional)
REDDIT_CLIENT_SECRET = your_reddit_secret (optional)
```

**Note**: You can leave these empty and the app will work with free public APIs!

5. Click **Save**
6. Vercel will automatically redeploy

### Step 3: Verify Deployment

After deployment completes (2-3 minutes):

1. Visit https://v0-resilience-platform-atlas.vercel.app/
2. Open browser DevTools (F12) → Console
3. Look for messages indicating data source:
   - `"Using fallback mock data"` = Using mock data
   - No warning messages = Using live APIs ✅

### Step 4: Test API Endpoints

Test each endpoint directly:

1. **Events API**: https://v0-resilience-platform-atlas.vercel.app/api/events
   - Look for `"dataSource": "live"` in response

2. **Finance API**: https://v0-resilience-platform-atlas.vercel.app/api/feeds/finance
   - Check if market indices have realistic values

3. **Social Feeds**: https://v0-resilience-platform-atlas.vercel.app/api/feeds/social
   - Should see Reddit posts from r/worldnews, r/Economics

4. **Resilience Data**: https://v0-resilience-platform-atlas.vercel.app/api/resilience?country=USA
   - Look for `"liveData"` field with World Bank GDP

## GitHub Actions (Automated Testing)

Create `.github/workflows/test-apis.yml` for automated API testing:

```yaml
name: Test Live APIs

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  schedule:
    # Test APIs daily at 9 AM UTC
    - cron: '0 9 * * *'

jobs:
  test-apis:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install pnpm
      run: npm install -g pnpm
      
    - name: Install dependencies
      run: pnpm install
      
    - name: Test API endpoints
      run: |
        echo "Testing API health..."
        # Add your test commands here
        pnpm build
```

## Alternative: Deploy from Vercel Dashboard

If you prefer not to use the command line:

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click **Deployments** tab
4. Click **Redeploy** button
5. Select the latest commit
6. Add environment variables if not already set
7. Click **Deploy**

## Monitoring Live Data

### Check Data Sources in Production

Add this component to monitor data sources (optional):

```typescript
// components/data-source-indicator.tsx
export function DataSourceIndicator({ source }: { source: 'live' | 'mock' }) {
  return (
    <div className={`text-xs px-2 py-1 rounded ${
      source === 'live' ? 'bg-green-500/20 text-green-700' : 'bg-yellow-500/20 text-yellow-700'
    }`}>
      {source === 'live' ? '🟢 Live Data' : '⚠️ Mock Data'}
    </div>
  );
}
```

## Troubleshooting Deployment

### Issue: APIs not working in production
**Solution**:
1. Check Vercel deployment logs
2. Verify environment variables are set
3. Check API rate limits haven't been exceeded
4. Review function execution logs in Vercel

### Issue: Build fails
**Solution**:
```bash
# Test build locally first
pnpm build

# Check for TypeScript errors
pnpm lint

# Fix any errors before pushing
```

### Issue: Environment variables not loading
**Solution**:
1. Ensure variables are set in Vercel (not just `.env.local`)
2. Redeploy after adding variables
3. Check variable names match exactly (case-sensitive)

## GitHub Repository Structure

```
v0-resilience-platform-atlas/
├── .env.example          # Template for environment variables
├── .env.local            # Local development (DO NOT COMMIT)
├── .gitignore            # Includes .env.local
├── LIVE_DATA_SETUP.md    # Setup documentation
├── GITHUB_DEPLOYMENT.md  # This file
├── setup-live-data.sh    # Automated setup script
├── app/
│   └── api/
│       ├── events/       # ✅ Live: NewsAPI + GDELT
│       ├── feeds/
│       │   ├── finance/  # ✅ Live: Yahoo Finance
│       │   └── social/   # ✅ Live: Reddit
│       ├── forecast/     # Static model
│       └── resilience/   # ✅ Enhanced: World Bank
└── lib/
    └── api-utils.ts      # API integration utilities
```

## Git Commands Cheatsheet

```bash
# Check status
git status

# See what changed
git diff

# Add specific files
git add app/api/events/route.ts

# Add all changes
git add .

# Commit changes
git commit -m "your message"

# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main

# Create new branch
git checkout -b feature/new-feature

# Switch branches
git checkout main
```

## Vercel CLI (Alternative)

Install Vercel CLI for command-line deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Set environment variable
vercel env add NEWS_API_KEY production
```

## Testing Before Deploy

Always test locally before pushing:

```bash
# 1. Run setup script
./setup-live-data.sh

# 2. Start development server
pnpm dev

# 3. Test in browser at http://localhost:3000

# 4. Check each API endpoint
curl http://localhost:3000/api/events
curl http://localhost:3000/api/feeds/finance
curl http://localhost:3000/api/feeds/social

# 5. Build for production
pnpm build

# 6. Test production build
pnpm start
```

## Continuous Deployment

Your Vercel project is likely already set up for continuous deployment:

1. ✅ Every push to `main` branch triggers auto-deploy
2. ✅ Preview deployments for pull requests
3. ✅ Automatic HTTPS certificate
4. ✅ Global CDN distribution
5. ✅ Edge caching enabled

## Success Indicators

After deployment, you should see:

✅ Deployment status: "Ready"  
✅ All API routes responding (200 status)  
✅ Live data loading in production  
✅ No console errors  
✅ Fast page load times  
✅ Real-time data updates  

## Next Steps

1. **Monitor API Usage**:
   - Set up alerts for rate limit warnings
   - Track API call patterns
   - Optimize caching strategies

2. **Enhance Data Quality**:
   - Add more data sources
   - Improve fallback strategies
   - Implement data validation

3. **Performance**:
   - Monitor response times
   - Optimize cache durations
   - Consider Redis for production

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- GitHub Docs: https://docs.github.com
