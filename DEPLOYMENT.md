# 🚀 Handwork Production Deployment Guide

This guide walks you through deploying Handwork to production.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Backend Deployment](#backend-deployment)
3. [Admin Panel Deployment](#admin-panel-deployment)
4. [Mobile App Deployment](#mobile-app-deployment)
5. [Post-Deployment Checklist](#post-deployment-checklist)

---

## Prerequisites

Before deploying, ensure you have:

- [ ] Domain name (e.g., `handwork.com`)
- [ ] SSL certificate (most platforms provide this automatically)
- [ ] Accounts on deployment platforms
- [ ] API keys for all services

### Required Accounts
| Service | Purpose | Sign Up |
|---------|---------|---------|
| Railway/Render | Backend hosting | [railway.app](https://railway.app) or [render.com](https://render.com) |
| Vercel | Admin panel hosting | [vercel.com](https://vercel.com) |
| Expo/EAS | Mobile app builds | [expo.dev](https://expo.dev) |
| Paystack | Payments | [paystack.com](https://paystack.com) |
| Sentry | Error monitoring | [sentry.io](https://sentry.io) |
| Firebase | Push notifications | [console.firebase.google.com](https://console.firebase.google.com) |

---

## Backend Deployment

### Option A: Railway (Recommended - Easiest)

1. **Create Railway Account**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   railway login
   ```

2. **Create New Project**
   ```bash
   cd backend
   railway init
   ```

3. **Add PostgreSQL Database**
   - Go to Railway dashboard
   - Click "New" → "Database" → "PostgreSQL"
   - Copy the connection variables

4. **Add Redis**
   - Click "New" → "Database" → "Redis"
   - Copy the connection variables

5. **Set Environment Variables**
   - Go to your service settings
   - Add all variables from `.env.production`
   - Railway will auto-fill database/redis URLs

6. **Deploy**
   ```bash
   railway up
   ```

7. **Get Your API URL**
   - Railway provides a URL like `https://handwork-api-production.up.railway.app`
   - Or configure your custom domain

### Option B: Render

1. **Connect GitHub Repository**
   - Go to [render.com](https://render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repo
   - It will use `render.yaml` for configuration

2. **Set Environment Variables**
   - Add variables from `.env.production` in the dashboard

3. **Deploy**
   - Render auto-deploys on push to main branch

### Option C: Docker on VPS

```bash
# On your server
cd backend

# Build the image
docker build -f Dockerfile.production -t handwork-api .

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

---

## Admin Panel Deployment

### Vercel (Recommended)

1. **Import Project**
   ```bash
   cd admin
   npx vercel
   ```

2. **Configure Environment Variables**
   In Vercel dashboard, add:
   ```
   NEXT_PUBLIC_API_URL=https://your-api-url.com/api/v1
   NEXT_PUBLIC_BACKEND_URL=https://your-api-url.com
   NEXT_PUBLIC_SOCKET_URL=https://your-api-url.com
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
   ```

3. **Configure Domain**
   - Add `admin.handwork.com` as custom domain

4. **Deploy**
   ```bash
   npx vercel --prod
   ```

---

## Mobile App Deployment

### Prerequisites
- Apple Developer Account ($99/year) for iOS
- Google Play Developer Account ($25 one-time) for Android
- EAS CLI installed: `npm install -g eas-cli`

### 1. Configure EAS

```bash
# Login to Expo
eas login

# Configure your project
eas build:configure
```

### 2. Update eas.json

Edit `eas.json` and replace:
- `your-apple-id@email.com` with your Apple ID
- `YOUR_APP_STORE_CONNECT_APP_ID` with your App Store Connect app ID
- `YOUR_APPLE_TEAM_ID` with your Apple Team ID

### 3. Build for Production

```bash
# Build iOS app
eas build --platform ios --profile production

# Build Android app
eas build --platform android --profile production
```

### 4. Submit to Stores

```bash
# Submit to App Store
eas submit --platform ios --profile production

# Submit to Google Play
eas submit --platform android --profile production
```

### 5. App Store Requirements

**iOS App Store:**
- Screenshots (6.5" and 5.5" displays)
- App description
- Privacy policy URL
- Support URL
- Age rating questionnaire

**Google Play Store:**
- Feature graphic (1024x500)
- Screenshots (phone and tablet)
- App description
- Privacy policy URL
- Content rating questionnaire

---

## Post-Deployment Checklist

### Security
- [ ] Rotate all API keys from test to production
- [ ] Enable 2FA on all service accounts
- [ ] Set up SSL/HTTPS (auto with Railway/Vercel)
- [ ] Configure CORS for production domains only
- [ ] Remove any test/debug endpoints

### Monitoring
- [ ] Set up Sentry error tracking
  ```bash
  # Get DSN from sentry.io
  SENTRY_DSN=https://xxx@sentry.io/yyy
  ```
- [ ] Configure uptime monitoring (UptimeRobot, Better Uptime)
- [ ] Set up log aggregation (optional: Papertrail, LogDNA)

### Database
- [ ] Enable automated backups
- [ ] Set up point-in-time recovery
- [ ] Run initial migrations
  ```bash
  npm run migration:run
  ```

### DNS Configuration

Add these DNS records:
```
A     api.handwork.com     → Your backend IP
A     admin.handwork.com   → Vercel IP
CNAME www.handwork.com     → vercel-dns.com
```

### Test Production

1. **Health Check**
   ```bash
   curl https://api.handwork.com/api/v1/health
   ```

2. **Test Authentication**
   - Create a new account
   - Verify email/phone
   - Login and logout

3. **Test Payments**
   - Add money to wallet
   - Make a test purchase
   - Request withdrawal

4. **Test Real-time Features**
   - Chat between users
   - Order notifications
   - Rider tracking

---

## Environment Variables Summary

### Backend (`backend/.env.production`)
| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_HOST` | PostgreSQL host | ✅ |
| `DATABASE_PASSWORD` | DB password | ✅ |
| `REDIS_HOST` | Redis host | ✅ |
| `JWT_ACCESS_SECRET` | JWT signing key | ✅ |
| `PAYSTACK_SECRET_KEY` | Live Paystack key | ✅ |
| `SMTP_PASS` | Email password | ✅ |
| `SENTRY_DSN` | Error tracking | Recommended |

### Admin (`admin/.env.production`)
| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | ✅ |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox token | ✅ |

### Mobile (`eas.json`)
| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_API_URL` | Backend API URL | ✅ |
| `EXPO_PUBLIC_WS_URL` | WebSocket URL | ✅ |

---

## Troubleshooting

### Backend won't start
- Check DATABASE_HOST and REDIS_HOST are accessible
- Verify all required env variables are set
- Check logs: `railway logs` or Render dashboard

### Mobile app can't connect
- Verify API URL is correct in eas.json
- Check CORS settings allow your app
- Test API health endpoint

### Payments failing
- Ensure using LIVE Paystack keys (not test)
- Verify webhook URL is configured in Paystack dashboard
- Check Paystack dashboard for error details

---

## Support

For issues with:
- **Railway**: [docs.railway.app](https://docs.railway.app)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **EAS/Expo**: [docs.expo.dev](https://docs.expo.dev)
- **Paystack**: [paystack.com/docs](https://paystack.com/docs)
