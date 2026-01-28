# Resilience Platform Atlas v1.0.0 🌍

*Global Resilience Monitoring Platform with Live Data Integration*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://v0-resilience-platform-atlas.vercel.app)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/4usayan-cloud-v0-resilience-platform-atlas-3CfUP6aa9Ou)
[![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)](https://github.com/sayan-sen/v0-resilience-platform-atlas)
[![Status](https://img.shields.io/badge/status-production-green?style=for-the-badge)](https://v0-resilience-platform-atlas.vercel.app)

## 🚀 What's New in v1.0

**Live Data Integration is Here!** This version transforms the platform from mock data to real-time global intelligence:

- ✅ **Real-time Global Events**: NewsAPI + GDELT Project integration
- ✅ **Live Financial Markets**: Yahoo Finance market indices
- ✅ **Social Media Intelligence**: Reddit API for global sentiment
- ✅ **Economic Indicators**: World Bank & IMF data
- ✅ **Smart Caching**: Optimized API calls with automatic fallback
- ✅ **Production Ready**: Full error handling and rate limiting

## 🌐 Live Demo

**Production:** [https://v0-resilience-platform-atlas.vercel.app](https://v0-resilience-platform-atlas.vercel.app)

## 📦 Quick Start

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

Open [http://localhost:3000](http://localhost:3000) to see your dashboard.

## 🔑 API Configuration (Optional)

The platform works out-of-the-box with free public APIs. For enhanced features, add API keys:

1. Copy `.env.example` to `.env.local`
2. Add your API keys (all optional):
   - **NewsAPI**: [Get Key](https://newsapi.org/register) - Enhanced global news
   - **Alpha Vantage**: [Get Key](https://www.alphavantage.co/support/#api-key) - Alternative financial data
   - **Reddit**: [Get Credentials](https://www.reddit.com/prefs/apps) - Authenticated access

**Without keys, the platform still works using:**
- GDELT Project (free, no key)
- Yahoo Finance public API (free, no key)
- Reddit public JSON (free, no key)
- World Bank API (free, no key)

## 🏗️ Architecture

### API Endpoints

| Endpoint | Purpose | Data Source | Cache TTL |
|----------|---------|-------------|-----------|
| `/api/events` | Global events | NewsAPI, GDELT | 5 min |
| `/api/feeds/finance` | Market data | Yahoo Finance | 2 min |
| `/api/feeds/social` | Social sentiment | Reddit | 5 min |
| `/api/resilience` | Country scores | Static + World Bank | N/A |
| `/api/forecast` | Predictions | BSTS+DFM Model | N/A |
| `/api/health` | System health check | All APIs status | Real-time |

### Tech Stack

- **Framework**: Next.js 16 + React 19
- **Styling**: Tailwind CSS 4 + Radix UI
- **Data Viz**: Recharts + React Simple Maps
- **APIs**: Axios with caching & rate limiting
- **Deployment**: Vercel with edge functions

## 📊 Features

### Pages & Navigation
- 🏠 **Home Dashboard** (`/`): Main overview with interactive world map and live feeds
- 📊 **Analytics** (`/analytics`): Detailed charts, trends, and comparative analysis
- 📖 **Methodology** (`/methodology`): Detailed explanation of resilience scoring methodology
  - Data sources and collection methods
  - Scoring algorithms and weightings
  - Validation and accuracy metrics

### Interactive Dashboard
- 🗺️ **World Map**: Click countries for detailed resilience analysis
- 📈 **Real-time Charts**: Live market indices and trends
- 🎯 **Event Monitoring**: Track global conflicts, disasters, economic shifts
- 📱 **Responsive Design**: Works on all devices

### Four Pillars Analysis
1. **Economic Resilience**: GDP, inflation, market stability
2. **Social Resilience**: Healthcare, education, inequality
3. **Institutional Resilience**: Governance, corruption, rule of law
4. **Infrastructure Resilience**: Energy, transport, digital infrastructure

### Advanced Features
- Time-series forecasting with confidence intervals
- Multi-source data aggregation
- Automatic fallback for API failures
- Smart caching to minimize API calls

## 🔧 Development

```bash
# Start dev server with hot reload
pnpm dev

# Type checking
pnpm run lint

# Build for production
pnpm build

# Start production server
pnpm start
```

## 🚢 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import in Vercel
3. Add environment variables (optional)
4. Deploy automatically

### Environment Variables for Vercel
```env
NEWS_API_KEY=your_key_here
ALPHA_VANTAGE_API_KEY=your_key_here
REDDIT_CLIENT_ID=your_id_here
REDDIT_CLIENT_SECRET=your_secret_here
```

## 📈 API Usage & Limits

- **Cache Strategy**: 2-5 minute TTL based on data volatility
- **Rate Limiting**: Built-in request throttling
- **Fallback**: Automatic mock data on API failures
- **Public APIs**: Most endpoints require no authentication

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md) for details on:
- How to report issues
- Submitting pull requests
- Code style guidelines
- Development setup

Built with [v0.app](https://v0.app/chat/4usayan-cloud-v0-resilience-platform-atlas-3CfUP6aa9Ou)

## 📚 Documentation

- **[README.md](./README.md)**: This file - project overview and quick start
- **[CHANGELOG.md](./CHANGELOG.md)**: Complete version history and release notes
- **[CONTRIBUTING.md](./CONTRIBUTING.md)**: Guidelines for contributors
- **[LIVE_DATA_SETUP.md](./LIVE_DATA_SETUP.md)**: Detailed API integration guide
- **[GITHUB_DEPLOYMENT.md](./GITHUB_DEPLOYMENT.md)**: Deployment and CI/CD instructions
- **[V1.0.0_RELEASE.md](./V1.0.0_RELEASE.md)**: v1.0.0 release summary and checklist

Continue building: **[v0.app Chat](https://v0.app/chat/4usayan-cloud-v0-resilience-platform-atlas-3CfUP6aa9Ou)**

## 📄 License

MIT License - See [LICENSE](./LICENSE) file for details

---

**Version**: 1.0.0 | **Status**: ✅ Production Ready | **Last Updated**: January 28, 2026