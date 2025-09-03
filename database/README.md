# Database Setup

## Prerequisites

1. Install PostgreSQL on your system
2. Create a PostgreSQL user for the application

## Setup Instructions

1. **Create the database and schema:**
   ```bash
   psql -U postgres -f schema.sql
   ```

2. **Load sample data (optional):**
   ```bash
   psql -U postgres -d digital_mental_wellness_portal -f seed.sql
   ```

3. **Create application user:**
   ```sql
   CREATE USER wellness_app WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE digital_mental_wellness_portal TO wellness_app;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO wellness_app;
   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO wellness_app;
   ```

## Environment Variables

Add these to your backend `.env` file:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=digital_mental_wellness_portal
DB_USER=wellness_app
DB_PASSWORD=your_secure_password
```

## Database Schema Overview

### Core Tables

- **users**: Main user table with role-based access (student, counselor, admin)
- **student_profiles**: Extended profile information for students
- **counselor_profiles**: Professional information for counselors
- **admin_profiles**: Administrative permissions and department info

### Mental Wellness Features

- **mood_entries**: Daily mood tracking with energy, sleep, and stress levels
- **wellness_goals**: Personal goals with progress tracking
- **goal_progress**: Historical progress updates for goals

### Scheduling & Support

- **appointments**: Counseling appointments between students and counselors
- **counseling_sessions**: Session notes and recommendations
- **resources**: Educational content and wellness resources
- **notifications**: System notifications and reminders
- **emergency_contacts**: Crisis support and emergency contact information

## Backup and Maintenance

- Set up regular database backups
- Monitor query performance using PostgreSQL query statistics
- Implement proper index maintenance for optimal performance
