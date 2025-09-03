# Quick Setup Guide

## Prerequisites
- Node.js (v18 or later)
- PostgreSQL (v14 or later)
- npm or yarn

## Database Setup
1. Install PostgreSQL and create a database user
2. Run the database schema:
   ```bash
   psql -U postgres -f database/schema.sql
   ```
3. (Optional) Load sample data:
   ```bash
   psql -U postgres -d digital_mental_wellness_portal -f database/seed.sql
   ```

## Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
4. Update `.env` with your database credentials
5. Start the backend server:
   ```bash
   npm run dev
   ```

## Frontend Setup
1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```
4. Start the frontend server:
   ```bash
   npm run dev
   ```

## Running the Full Application
1. Install all dependencies:
   ```bash
   npm run install:all
   ```
2. Start both servers:
   ```bash
   npm run dev
   ```

## Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/health

## Default Test Accounts
After running the seed data, you can login with:
- **Student**: john.student@university.edu (password: TestPass123)
- **Counselor**: dr.counselor@university.edu (password: TestPass123)
- **Admin**: admin.user@university.edu (password: TestPass123)

## Features Implemented
✅ User authentication with role-based access
✅ Netflix-inspired UI/UX design
✅ Role-specific dashboards
✅ Mood tracking with charts
✅ Animated page transitions
✅ Responsive design
✅ PostgreSQL database integration
✅ RESTful API endpoints
✅ Professional typography and styling

## Next Steps for Development
- Connect frontend to backend APIs
- Implement full CRUD operations for mood entries
- Add real-time notifications
- Implement appointment booking system
- Add wellness goal tracking
- Create counselor-student communication features
- Add data visualization dashboards
- Implement file uploads for resources
