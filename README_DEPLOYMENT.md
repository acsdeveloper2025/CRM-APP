# 🚀 Quick Deployment Guide

Deploy your CRM-APP using free services:

## 📋 Services Used

- **Frontend**: [Netlify](https://netlify.com) - Static site hosting
- **Backend**: [Render](https://render.com) - Web service hosting
- **Database**: [Supabase](https://supabase.com) - PostgreSQL database
- **Redis**: [Upstash](https://upstash.com) - Serverless Redis

## 🚀 Quick Start

1. **Fork this repository** to your GitHub account

2. **Deploy Database (Supabase)**
   - Create free Supabase account
   - Create new project
   - Get database credentials

3. **Deploy Redis (Upstash)**
   - Create free Upstash account
   - Create Redis database
   - Get connection details

4. **Deploy Backend (Render)**
   - Connect GitHub to Render
   - Create Web Service from your fork
   - Set environment variables:
     ```
     DATABASE_URL=your-supabase-url
     REDIS_URL=your-upstash-url
     JWT_SECRET=generate-strong-secret
     JWT_REFRESH_SECRET=generate-strong-secret
     ```

5. **Deploy Frontend (Netlify)**
   - Connect GitHub to Netlify
   - Create site from your fork
   - Set root directory to `acs-web`
   - Set environment variables:
     ```
     VITE_API_BASE_URL=https://your-render-app.onrender.com/api
     ```

## 📖 Detailed Instructions

See [DEPLOYMENT_INSTRUCTIONS.md](DEPLOYMENT_INSTRUCTIONS.md) for complete deployment guide.

## 🆘 Need Help?

Check the documentation for each service:
- [Netlify Docs](https://docs.netlify.com/)
- [Render Docs](https://render.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Upstash Docs](https://docs.upstash.com/)

**Happy Deploying!** 🎉