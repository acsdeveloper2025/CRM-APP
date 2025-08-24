# CRM-APP - Multi-Platform CRM System

CRM-APP is a comprehensive Customer Relationship Management system designed to streamline client interactions and case management across web and mobile platforms.

## Project Structure

- [acs-backend](acs-backend/) - Node.js/Express backend API with PostgreSQL and Redis
- [acs-web](acs-web/) - React/Vite web frontend
- [caseflow-mobile](caseflow-mobile/) - React Native/Capacitor mobile application
- [documentation](documentation/) - Complete project documentation

## Key Features

### Backend API
- RESTful API with JWT-based authentication
- Real-time WebSocket connections
- PostgreSQL database with custom SQL queries
- Redis for caching and messaging
- Role-based access control

### Web Frontend
- Modern React/Vite application
- Responsive design with Tailwind CSS
- Real-time case assignment notifications
- Comprehensive case management interface
- Location-based pincode assignment system

### Mobile Application
- Offline-first architecture
- Native mobile features (camera, geolocation)
- Secure data storage
- Real-time synchronization with backend
- Case assignment and submission workflows

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- npm 9+

### Installation

1. Clone the repository
2. Install dependencies in each application directory:
   ```bash
   # Backend
   cd acs-backend
   npm install
   
   # Web frontend
   cd acs-web
   npm install
   
   # Mobile app
   cd caseflow-mobile
   npm install
   ```

3. Configure environment variables (see individual application directories for .env.example files)

4. Start all services:
   ```bash
   ./start-all-services.sh
   ```

## Documentation

Complete documentation is available in the [documentation](documentation/) directory, including:
- API documentation
- Deployment guides
- Setup instructions
- System architecture
- Troubleshooting guides

## Production Deployment

For production deployment instructions, see:
- [Production Deployment Guide](documentation/deployment/PRODUCTION_DEPLOYMENT_GUIDE.md)
- [Production Checklist](documentation/deployment/PRODUCTION_CHECKLIST.md)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please refer to the documentation or contact the development team.