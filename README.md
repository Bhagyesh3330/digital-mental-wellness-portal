# 🧠 Digital Mental Wellness Portal

A comprehensive mental health and wellness platform designed specifically for hostel and campus communities. This full-stack application provides students, counselors, and administrators with powerful tools to track, manage, and improve mental wellness through data-driven insights and professional support.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-18+-green.svg)
![React](https://img.shields.io/badge/react-18.2+-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.3+-blue.svg)
![PostgreSQL](https://img.shields.io/badge/postgresql-15+-blue.svg)

## 🎯 Features

### 👩‍🎓 For Students
- **🧠 Mood Tracking**: Daily emotional wellness monitoring with visual trends and analytics
- **😴 Sleep Tracker**: Monitor sleep patterns, hours, and energy levels with correlation insights
- **🎯 Wellness Goals**: Set, track, and achieve personalized mental health objectives
- **📊 Progress Analytics**: Comprehensive dashboards with mood/sleep/goal correlations
- **📅 Counselor Appointments**: Easy scheduling and management of therapy sessions
- **👤 Profile Management**: Complete academic and personal information management
- **🔔 Smart Notifications**: Reminders for mood logging, goals, and appointments

### 👩‍⚕️ For Counselors
- **👥 Student Dashboard**: Overview of all assigned students with key metrics
- **📈 Student Analytics**: Detailed insights into student mental health trends
- **📅 Appointment Management**: Calendar integration and session scheduling
- **📚 Resource Library**: Create and share wellness resources and exercises
- **💼 Professional Profile**: Manage credentials, specializations, and availability

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **UI Library**: React 18 with Tailwind CSS
- **Animations**: Framer Motion
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form with validation
- **HTTP Client**: Axios with interceptors
- **State Management**: React Context API
- **Styling**: Netflix-inspired dark theme

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: JavaScript (ES6+)
- **Database**: PostgreSQL with connection pooling
- **Authentication**: JWT with bcrypt password hashing
- **Security**: Helmet, CORS, Rate limiting
- **Validation**: Server-side data validation
- **Logging**: Morgan for request logging

### Database
- **Primary DB**: PostgreSQL 15+
- **Schema**: Normalized relational design
- **Features**: JSONB support, indexes, triggers
- **Migrations**: SQL-based schema management
- **Seed Data**: Development and testing data

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- npm or yarn package manager

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Bhagyesh3330/digital-mental-wellness-portal.git
cd digital-mental-wellness-portal
```

2. **Install dependencies**
```bash
# Install all dependencies (frontend + backend)
npm run install:all

# Or install individually
cd frontend && npm install
cd ../backend && npm install
```

3. **Database Setup**
```bash
# Create PostgreSQL database
createdb digital_mental_wellness_portal

# Run schema and seed data
psql digital_mental_wellness_portal -f database/schema.sql
psql digital_mental_wellness_portal -f database/seed.sql
```

4. **Environment Configuration**
```bash
# Backend environment (.env)
cd backend
cp .env.example .env
# Edit .env with your database credentials and JWT secret

# Frontend environment (.env.local)
cd ../frontend
cp .env.example .env.local
# Edit .env.local with API URL
```

5. **Start Development Servers**
```bash
# Start both frontend and backend
npm run dev

# Or start individually
cd backend && npm run dev    # Backend on :5000
cd frontend && npm run dev   # Frontend on :3000
```

## 📁 Project Structure

```
digital-mental-wellness-portal/
├── frontend/                 # Next.js React application
│   ├── app/                 # App router pages
│   │   ├── auth/           # Authentication pages
│   │   ├── dashboard/      # Main application pages
│   │   └── layout.tsx      # Root layout
│   ├── components/         # Reusable UI components
│   ├── lib/               # Utilities and configurations
│   │   ├── api/           # API client functions
│   │   └── context/       # React context providers
│   ├── styles/            # Global styles and Tailwind config
│   └── types/             # TypeScript type definitions
├── backend/                # Express.js API server
│   ├── routes/            # API route handlers
│   ├── middleware/        # Authentication and validation
│   ├── config/            # Database and app configuration
│   └── server.js          # Main server file
├── database/              # Database schema and seeds
│   ├── schema.sql         # Database structure
│   ├── seed.sql           # Sample data
│   └── README.md          # Database documentation
└── docs/                  # Additional documentation
```

## 🎨 Design System

### Color Palette
- **Primary**: Wellness Blue (#3B82F6)
- **Secondary**: Wellness Green (#10B981)
- **Success**: Green (#22C55E)
- **Warning**: Amber (#F59E0B)
- **Error**: Red (#EF4444)
- **Background**: Netflix-inspired dark theme

### Typography
- **Headers**: Inter font family
- **Body**: System fonts with fallbacks
- **Responsive**: Mobile-first approach

### Components
- **Cards**: Glassmorphism-inspired design
- **Buttons**: Smooth hover animations
- **Forms**: Consistent validation styling
- **Charts**: Clean, accessible data visualization

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable salt rounds
- **Role-Based Access**: Granular permissions for different user types
- **Rate Limiting**: API endpoint protection
- **CORS Configuration**: Secure cross-origin requests
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Input sanitization and validation

## 📊 Data Privacy & Compliance

- **Data Encryption**: Sensitive data encrypted at rest and in transit
- **User Consent**: Clear privacy policies and consent management
- **Data Retention**: Configurable data retention policies
- **Anonymization**: Option to anonymize user data for analytics
- **Access Controls**: Strict data access based on user roles

## 🧪 Testing

```bash
# Run frontend tests
cd frontend && npm test

# Run backend tests
cd backend && npm test

# Run all tests
npm run test:all
```

## 📈 Analytics & Insights

- **Mood Trends**: Track emotional patterns over time
- **Sleep Correlation**: Analyze sleep impact on mental health
- **Goal Achievement**: Monitor wellness objective completion
- **Usage Statistics**: Platform engagement metrics
- **Intervention Points**: Early warning systems for mental health concerns

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and submission process.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/refresh` - Refresh JWT token

### Profile Management
- `GET /api/profile/student` - Get student profile
- `GET /api/profile/counselor` - Get counselor profile
- `PUT /api/profile/` - Update profile
- `POST /api/profile/change-password` - Change password

### Mood Tracking
- `GET /api/mood/entries` - Get mood entries
- `POST /api/mood/entry` - Create mood entry
- `GET /api/mood/stats` - Get mood statistics

### Goals & Progress
- `GET /api/goals` - Get wellness goals
- `POST /api/goals` - Create new goal
- `PUT /api/goals/:id` - Update goal
- `POST /api/goals/:id/progress` - Add progress update

## 🌟 Roadmap

### Phase 1 (Current)
- [x] User authentication and profiles
- [x] Mood tracking with analytics
- [x] Sleep monitoring
- [x] Wellness goals
- [x] Appointment scheduling
- [x] Basic admin panel

### Phase 2 (Upcoming)
- [ ] Mobile app (React Native)
- [ ] Real-time chat with counselors
- [ ] AI-powered mood insights
- [ ] Integration with wearable devices
- [ ] Group therapy sessions
- [ ] Crisis intervention system

### Phase 3 (Future)
- [ ] Machine learning recommendations
- [ ] Peer support networks
- [ ] Gamification elements
- [ ] Third-party integrations
- [ ] Advanced analytics dashboard
- [ ] Multi-language support

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Design Inspiration**: Netflix UI/UX principles
- **Mental Health Resources**: WHO Mental Health Guidelines
- **Accessibility**: WCAG 2.1 compliance standards
- **Community**: Open-source contributors and mental health advocates

## 📞 Support

- **Documentation**: [Wiki](https://github.com/yourusername/digital-mental-wellness-portal/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/digital-mental-wellness-portal/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/digital-mental-wellness-portal/discussions)
- **Email**: support@mentalwellnessportal.com

## 🏥 Crisis Resources

If you or someone you know is in crisis, please reach out for help:

- **National Suicide Prevention Lifeline**: 988 (US)
- **Crisis Text Line**: Text HOME to 741741
- **International Association for Suicide Prevention**: https://www.iasp.info/resources/Crisis_Centres/

---

**⚠️ Disclaimer**: This application is designed to support mental wellness and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of qualified health providers with any questions regarding mental health conditions.

---

<div align="center">
  <strong>Built with ❤️ for mental health awareness and campus wellness</strong>
</div>
