# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Digital Mental Wellness Portal is a comprehensive mental wellness platform for hostel communities with role-based access for students, counselors, and administrators. The application features a Netflix-inspired dark theme with smooth animations and robust authentication.

**Tech Stack:**
- **Frontend:** Next.js 14 with TypeScript, React 18, Framer Motion, Tailwind CSS
- **Backend:** Node.js with Express, JWT authentication, bcrypt
- **Database:** PostgreSQL with connection pooling
- **Authentication:** Role-based JWT with refresh tokens
- **Styling:** Netflix-inspired theme with custom animations

## Development Commands

### Initial Setup
```bash
# Install all dependencies (root, backend, and frontend)
npm run install:all

# Set up PostgreSQL database
psql -U postgres -f database/schema.sql
psql -U postgres -d digital_mental_wellness_portal -f database/seed.sql
```

### Development
```bash
# Run both frontend and backend concurrently
npm run dev

# Run backend only (port 5000)
npm run dev:backend
cd backend && npm run dev

# Run frontend only (port 3000)
npm run dev:frontend
cd frontend && npm run dev
```

### Production
```bash
# Build frontend for production
npm run build
cd frontend && npm run build

# Start backend in production mode
npm start
cd backend && npm start

# Start frontend in production mode
cd frontend && npm start
```

### Testing
```bash
# Run backend tests
cd backend && npm test

# Lint frontend code
cd frontend && npm run lint
```

### Database Operations
```bash
# Connect to database
psql -U wellness_app -d digital_mental_wellness_portal

# Run schema updates
psql -U postgres -d digital_mental_wellness_portal -f database/schema.sql

# Load sample data
psql -U postgres -d digital_mental_wellness_portal -f database/seed.sql
```

## Architecture Overview

### Monorepo Structure
```
/
├── frontend/          # Next.js React application
├── backend/           # Express.js API server  
├── database/          # PostgreSQL schema and migrations
└── package.json       # Root package with workspace scripts
```

### Frontend Architecture (Next.js App Router)
- **App Router:** Uses Next.js 13+ app directory structure
- **Authentication:** Context-based auth with JWT tokens stored in secure cookies
- **State Management:** React Context for auth, local state for components
- **Styling:** Tailwind CSS with Netflix-inspired color palette and animations
- **API Layer:** Axios-based API clients with error handling
- **Type Safety:** Full TypeScript with comprehensive type definitions

**Key Frontend Directories:**
- `app/` - Next.js app router pages and layouts
- `lib/context/` - React contexts (AuthContext)
- `lib/api/` - API client modules
- `types/` - TypeScript type definitions
- `styles/` - Global CSS and Tailwind config

### Backend Architecture (Express.js)
- **MVC Pattern:** Routes → Controllers → Database layer
- **Authentication:** JWT with role-based access control (student, counselor, admin)
- **Database:** PostgreSQL with connection pooling and transactions
- **Security:** Helmet, CORS, rate limiting, input validation
- **Validation:** express-validator for request validation

**Key Backend Directories:**
- `routes/` - API route handlers (auth, users, mood, goals, appointments, resources, notifications)
- `middleware/` - Authentication and authorization middleware
- `config/` - Database configuration and connection pooling

### Database Schema (PostgreSQL)
**User Management:**
- `users` - Main user table with role-based access
- `student_profiles`, `counselor_profiles`, `admin_profiles` - Role-specific extended profiles

**Mental Wellness Features:**
- `mood_entries` - Daily mood tracking with energy, sleep, stress metrics
- `wellness_goals` - Personal goals with progress tracking
- `goal_progress` - Historical progress updates

**Scheduling & Support:**
- `appointments` - Counseling appointments between students and counselors
- `counseling_sessions` - Session notes and recommendations
- `resources` - Educational content and wellness resources
- `notifications` - System notifications and reminders
- `emergency_contacts` - Crisis support contacts

### Authentication Flow
1. User registers/logs in through frontend forms
2. Backend validates credentials and creates JWT token
3. Token stored in secure HTTP-only cookie
4. All API requests include token in Authorization header
5. Middleware validates token and user permissions
6. Role-based access control for different user types

### API Structure
All API routes are prefixed with `/api/`:
- `/api/auth` - Authentication (login, register, refresh, logout)
- `/api/users` - User management and profiles
- `/api/mood` - Mood tracking entries
- `/api/goals` - Wellness goals and progress
- `/api/appointments` - Counseling appointments
- `/api/resources` - Educational resources
- `/api/notifications` - User notifications

## Environment Configuration

### Backend Environment (.env)
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=digital_mental_wellness_portal
DB_USER=wellness_app
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_very_secure_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Environment (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Key Development Patterns

### Role-Based Access Control
The system implements three user roles with different permissions:
- **Students:** Can track mood, set goals, book appointments
- **Counselors:** Can view student data, manage appointments, create resources
- **Admins:** Full system access and user management

### Authentication Middleware
All protected routes use authentication middleware that:
- Validates JWT tokens
- Checks user active status
- Provides role-based access control
- Handles token expiration and refresh

### Database Transaction Pattern
Critical operations use database transactions for data consistency:
```javascript
const result = await transaction(async (client) => {
  // Multiple related database operations
  // Automatically rolled back on error
});
```

### Frontend API Pattern
API calls follow consistent error handling:
```typescript
const response = await authApi.login(credentials);
if (response.success) {
  // Handle success
} else {
  // Handle error with response.error
}
```

### Netflix-Inspired UI Theme
Custom Tailwind theme with:
- Dark color palette (netflix-black, netflix-red)
- Professional typography (Inter font)
- Smooth animations (Framer Motion)
- Custom keyframes for slide/fade effects

## Development Notes

### Database Connection
- Uses connection pooling with automatic cleanup
- Includes connection health monitoring
- Supports SSL for production environments

### Security Features
- Password hashing with bcrypt (12 rounds)
- JWT token expiration and refresh
- Input validation and sanitization
- Rate limiting to prevent abuse
- CORS configuration for frontend access

### Error Handling
- Comprehensive error middleware in backend
- Consistent error response format
- Development vs production error details
- Frontend toast notifications for user feedback

### Testing Considerations
- Backend includes Jest setup for unit testing
- Use supertest for API endpoint testing
- Frontend testing can use Jest + React Testing Library
- Consider testing authentication flows and role permissions
