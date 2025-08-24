# 🚀 CRM-APP Deployment Instructions

This document provides step-by-step instructions for deploying the CRM-APP to free hosting services:

## 📋 Deployment Services

1. **Frontend (acs-web)** → Netlify
2. **Backend (acs-backend)** → Render
3. **Database (PostgreSQL)** → Supabase
4. **Redis** → Upstash

## 🛠️ Prerequisites

- Git installed on your system
- GitHub account
- Accounts on Netlify, Render, Supabase, and Upstash

## 🔧 Step-by-Step Deployment

### 1. Database Setup (Supabase)

1. Create a free Supabase account at https://supabase.com/
2. Create a new project
3. Note down the following credentials:
   - Database URL
   - Database password
4. Run the database migrations (instructions in project documentation)

### 2. Redis Setup (Upstash)

1. Create a free Upstash account at https://upstash.com/
2. Create a new Redis database
3. Note down the following credentials:
   - Redis URL
   - Redis password

### 3. Backend Deployment (Render)

1. Fork the repository to your GitHub account
2. Create a free Render account at https://render.com/
3. Connect your GitHub account to Render
4. Create a new Web Service:
   - Connect to your forked repository
   - Set the root directory to `acs-backend`
   - Build command: `npm install`
   - Start command: `npm run build && npm start`
   - Set environment variables from `.env.render` template
5. Add environment variables:
   - `DATABASE_URL` (from Supabase)
   - `REDIS_URL` (from Upstash)
   - `JWT_SECRET` (generate a strong secret)
   - `JWT_REFRESH_SECRET` (generate a strong secret)
   - `NODE_ENV=production`
   - `PORT=10000`

### 4. Frontend Deployment (Netlify)

1. Fork the repository to your GitHub account (if not already done)
2. Create a free Netlify account at https://netlify.com/
3. Connect your GitHub account to Netlify
4. Create a new site:
   - Connect to your forked repository
   - Set the root directory to `acs-web`
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Set environment variables:
   - `VITE_API_BASE_URL` (your Render backend URL)
   - `VITE_WS_URL` (your Render backend WebSocket URL)

## 🔄 Post-Deployment Configuration

### Update CORS Settings

After deploying the frontend, update the backend CORS settings to include your Netlify domain:

```
CORS_ORIGIN=https://your-frontend.netlify.app
```

### Update Mobile App Configuration

Update the mobile app environment variables to point to your deployed backend:

```
VITE_API_BASE_URL=https://your-backend.onrender.com/api
VITE_WS_URL=wss://your-backend.onrender.com
```

## 🔐 Security Considerations

1. Generate strong secrets for JWT tokens
2. Use environment variables for all sensitive information
3. Enable SSL/TLS for all services
4. Regularly rotate secrets and credentials

## 📊 Monitoring and Maintenance

1. Set up logging for all services
2. Monitor resource usage on free tiers
3. Set up alerts for service downtime
4. Regularly backup your database

## 🆘 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure CORS origins are correctly configured
2. **Database Connection**: Verify database credentials and network access
3. **Environment Variables**: Double-check all required environment variables are set
4. **Build Failures**: Check build logs for specific error messages

### Support

For issues with deployment, refer to the service documentation:
- [Netlify Documentation](https://docs.netlify.com/)
- [Render Documentation](https://render.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Upstash Documentation](https://docs.upstash.com/)

## 📞 Next Steps

1. Test all functionality after deployment
2. Set up monitoring and alerts
3. Configure custom domains (optional)
4. Set up CI/CD pipelines
5. Plan for scaling beyond free tiers

**Your CRM-APP is now ready for deployment!** 🎉