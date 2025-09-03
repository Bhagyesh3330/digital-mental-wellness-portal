# Digital Mental Wellness Portal

A comprehensive mental wellness platform for hostel communities, featuring role-based access for students, counselors, and administrators with a Netflix-inspired design and smooth animations.

## Features

- **Multi-role Authentication**: Separate login/register for students, counselors, and admins
- **Interactive Dashboard**: Personalized interfaces for each user type
- **Wellness Tracking**: Mood tracking, goal setting, and progress monitoring
- **Netflix-inspired Design**: Dark theme with professional typography and smooth animations
- **Page Transitions**: Sliding page animations and interactive button effects
- **PostgreSQL Database**: Robust data storage and management

## Tech Stack

- **Frontend**: React/Next.js with Framer Motion for animations
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Styling**: Tailwind CSS with Netflix-inspired theme
- **Authentication**: JWT with role-based access control

## Getting Started

1. Install dependencies:
   ```bash
   npm run install:all
   ```

2. Set up PostgreSQL database (see database/README.md)

3. Configure environment variables:
   - Copy `.env.example` to `.env` in backend folder
   - Update database credentials and JWT secret

4. Run the development server:
   ```bash
   npm run dev
   ```

## Project Structure

- `/frontend` - React/Next.js application
- `/backend` - Express.js API server
- `/database` - PostgreSQL schema and migrations

## License

MIT
