# Production Deployment Guide

This guide provides instructions for deploying the CRM-APP to production environments.

## Architecture Overview

The CRM-APP consists of three main components:
1. **Backend API** - Node.js/Express server with PostgreSQL and Redis
2. **Web Frontend** - React/Vite application
3. **Mobile App** - React Native/Capacitor application

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- npm 9+

## Backend Deployment

### 1. Environment Configuration

Create a `.env` file in the `acs-backend` directory with production values:

```env
# Server Configuration
NODE_ENV=production
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database

# JWT Configuration
JWT_SECRET=your-production-jwt-secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-production-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d

# Redis Configuration
REDIS_URL=redis://default:password@host:port
REDIS_PASSWORD=your-redis-password

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.com,https://your-mobile-domain.com
```

### 2. Database Setup

1. Create a PostgreSQL database
2. Run the database initialization scripts
3. Set up the required tables and initial data

### 3. Build and Deploy

```bash
cd acs-backend
npm install
npm run build
npm start
```

## Web Frontend Deployment

### 1. Environment Configuration

Create a `.env.production` file in the `acs-web` directory:

```env
# API Configuration
VITE_API_BASE_URL=https://your-backend-domain.com/api
VITE_WS_URL=wss://your-backend-domain.com

# App Configuration
VITE_APP_ENVIRONMENT=production
VITE_ENABLE_MOCK_DATA=false

# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=your-production-google-maps-api-key
```

### 2. Build for Production

```bash
cd acs-web
npm install
npm run build
```

The built files will be in the `dist` directory, ready for deployment to any static hosting service.

## Mobile App Deployment

### 1. Environment Configuration

Create a `.env.production` file in the `caseflow-mobile` directory:

```env
# Backend API Configuration
VITE_API_BASE_URL=https://your-backend-domain.com/api
VITE_WS_URL=wss://your-backend-domain.com

# App Configuration
VITE_APP_NAME=CaseFlow Mobile
VITE_APP_VERSION=4.0.0
VITE_APP_ENVIRONMENT=production
VITE_ENABLE_MOCK_DATA=false
VITE_DEBUG_MODE=false
```

### 2. Build for Production

```bash
cd caseflow-mobile
npm install
npm run build
```

### 3. Native Platform Builds

For iOS:
```bash
npx cap sync ios
npx cap open ios
# Build in Xcode
```

For Android:
```bash
npx cap sync android
npx cap open android
# Build in Android Studio
```

## Monitoring and Maintenance

### Health Checks

- Monitor backend API health endpoints
- Check database connection status
- Verify Redis connectivity
- Monitor WebSocket connections

### Logging

- Configure centralized logging for all services
- Set up error tracking and alerting
- Monitor performance metrics

### Security

- Regular security audits
- Keep dependencies up to date
- Monitor for vulnerabilities
- Implement proper backup strategies

## Scaling Considerations

- Load balancing for backend services
- Database connection pooling
- Redis cluster setup for high availability
- CDN for static assets