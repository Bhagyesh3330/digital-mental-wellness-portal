'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import { initializeCleanDatabase, getDataSummary } from '@/lib/utils/cleanup';
import { 
  Heart, 
  Target, 
  Calendar, 
  BarChart3, 
  Users, 
  Settings,
  LogOut,
  User as UserIcon,
  Moon,
  Clock,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';
import WellnessNotifications from '@/components/WellnessNotifications';
import { demoNotificationScenarios } from '@/lib/utils/notification-demo';
import { toast } from 'react-hot-toast';

const DashboardPage = () => {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);
  
  // Initialize clean database on first load
  useEffect(() => {
    // Only run once per session
    const hasRun = sessionStorage.getItem('cleanup_completed');
    if (!hasRun) {
      console.log('Initializing clean database...');
      const beforeSummary = getDataSummary();
      console.log('Data before cleanup:', beforeSummary);
      
      initializeCleanDatabase();
      
      const afterSummary = getDataSummary();
      console.log('Data after cleanup:', afterSummary);
      
      sessionStorage.setItem('cleanup_completed', 'true');
    }
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };
  
  const handleDemoNotifications = async () => {
    if (!user) return;
    
    toast.loading('Running notification demo...', { duration: 2000 });
    await demoNotificationScenarios(user.id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-netflix-black flex items-center justify-center">
        <div className="spinner w-12 h-12" />
      </div>
    );
  }

  if (!user) return null;

  const getDashboardContent = () => {
    switch (user.role) {
      case 'student':
        return {
          title: 'Your Wellness Dashboard',
          subtitle: 'Track your mental health journey',
          cards: [
            {
              icon: Heart,
              title: 'Mood Tracker',
              description: 'Log your daily mood and emotions',
              color: 'bg-wellness-mood-good',
              href: '/dashboard/mood'
            },
            {
              icon: Target,
              title: 'Wellness Goals',
              description: 'Set and track your personal goals',
              color: 'bg-wellness-primary',
              href: '/dashboard/goals'
            },
            {
              icon: Calendar,
              title: 'Appointments',
              description: 'Schedule sessions with counselors',
              color: 'bg-wellness-secondary',
              href: '/dashboard/appointments'
            },
            {
              icon: Moon,
              title: 'Sleep Tracker',
              description: 'Track your sleep patterns and energy',
              color: 'bg-wellness-mood-neutral',
              href: '/dashboard/sleep'
            },
            {
              icon: BarChart3,
              title: 'Progress Report',
              description: 'View your wellness analytics',
              color: 'bg-wellness-warning',
              href: '/dashboard/progress'
            },
            {
              icon: BookOpen,
              title: 'Wellness Resources',
              description: 'Access helpful materials and resources',
              color: 'bg-wellness-success',
              href: '/dashboard/resources'
            }
          ]
        };
      case 'counselor':
        return {
          title: 'Counselor Dashboard',
          subtitle: 'Support your students',
          cards: [
            {
              icon: Users,
              title: 'My Students',
              description: 'View and manage student cases',
              color: 'bg-wellness-primary',
              href: '/dashboard/students'
            },
            {
              icon: Calendar,
              title: 'Appointments',
              description: 'Manage your counseling sessions',
              color: 'bg-wellness-secondary',
              href: '/dashboard/appointments'
            },
            {
              icon: BarChart3,
              title: 'Analytics',
              description: 'Student progress and insights',
              color: 'bg-wellness-success',
              href: '/dashboard/analytics'
            },
            {
              icon: Heart,
              title: 'Resources',
              description: 'Wellness resources and materials',
              color: 'bg-wellness-mood-good',
              href: '/dashboard/resources'
            }
          ]
        };
      default:
        return { title: '', subtitle: '', cards: [] };
    }
  };

  const dashboardContent = getDashboardContent();

  return (
    <div className="min-h-screen bg-netflix-black">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-netflix-black-light border-b border-netflix-gray-dark"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <h1 className="text-2xl font-bold text-gradient-wellness">
                  Digital Mental Wellness Portal
                </h1>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Wellness Notifications */}
              {user.role === 'student' && (
                <WellnessNotifications />
              )}
              
              {/* Profile Button with Name */}
              <Link href="/dashboard/profile">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-netflix-gray-dark/30 transition-colors duration-200"
                >
                  <div className="w-10 h-10 bg-wellness-primary rounded-full flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-netflix-gray-light capitalize">
                      {user.role}
                    </p>
                  </div>
                </motion.div>
              </Link>
              
              {/* Logout Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="p-2 text-netflix-gray-light hover:text-netflix-red transition-colors duration-200"
              >
                <LogOut className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>


      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Welcome Section */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-white mb-2">
            {dashboardContent.title}
          </h2>
          <p className="text-xl text-netflix-gray-light">
            {dashboardContent.subtitle}
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardContent.cards.map((card, index) => (
            <Link key={card.title} href={card.href}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.6 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="card-wellness group cursor-pointer h-48 relative overflow-hidden"
              >
                <div className={`absolute top-4 right-4 w-12 h-12 ${card.color} rounded-full flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity duration-300`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {card.title}
                  </h3>
                  <p className="text-netflix-gray-light text-sm leading-relaxed">
                    {card.description}
                  </p>
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-12"
        >
          <h3 className="text-2xl font-semibold text-white mb-6">
            Quick Actions
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Upcoming Appointments - Shows for all roles */}
            <Link href="/dashboard/appointments">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-wellness p-4 text-left flex items-center justify-between cursor-pointer w-full rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Clock className="w-6 h-6" />
                  <div>
                    <span className="block font-medium">Upcoming Appointments</span>
                    <span className="text-sm opacity-80">
                      {user.role === 'student' ? 'Your next sessions' : 'Scheduled sessions'}
                    </span>
                  </div>
                </div>
                <div className="text-sm opacity-60">→</div>
              </motion.div>
            </Link>

            {user.role === 'student' && (
              <>
                <Link href="/dashboard/mood">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-wellness-outline p-4 text-left flex items-center justify-between cursor-pointer w-full rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Heart className="w-6 h-6" />
                      <div>
                        <span className="block font-medium">Log Today's Mood</span>
                        <span className="text-sm opacity-80">Track your daily emotions</span>
                      </div>
                    </div>
                    <div className="text-sm opacity-60">→</div>
                  </motion.div>
                </Link>
                
                <Link href="/dashboard/sleep">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-wellness-outline p-4 text-left flex items-center justify-between cursor-pointer w-full rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Moon className="w-6 h-6" />
                      <div>
                        <span className="block font-medium">Log Sleep & Energy</span>
                        <span className="text-sm opacity-80">Track sleep & boost energy</span>
                      </div>
                    </div>
                    <div className="text-sm opacity-60">→</div>
                  </motion.div>
                </Link>
                
                <Link href="/dashboard/goals">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-wellness-outline p-4 text-left flex items-center justify-between cursor-pointer w-full rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Target className="w-6 h-6" />
                      <div>
                        <span className="block font-medium">Set New Goal</span>
                        <span className="text-sm opacity-80">Create wellness targets</span>
                      </div>
                    </div>
                    <div className="text-sm opacity-60">→</div>
                  </motion.div>
                </Link>
                
                <Link href="/dashboard/resources">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-wellness-outline p-4 text-left flex items-center justify-between cursor-pointer w-full rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <BookOpen className="w-6 h-6" />
                      <div>
                        <span className="block font-medium">Browse Resources</span>
                        <span className="text-sm opacity-80">Helpful wellness materials</span>
                      </div>
                    </div>
                    <div className="text-sm opacity-60">→</div>
                  </motion.div>
                </Link>
              </>
            )}

            {user.role === 'counselor' && (
              <>
                <Link href="/dashboard/students">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-wellness-outline p-4 text-left flex items-center justify-between cursor-pointer w-full rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Users className="w-6 h-6" />
                      <div>
                        <span className="block font-medium">View Students</span>
                        <span className="text-sm opacity-80">Manage your cases</span>
                      </div>
                    </div>
                    <div className="text-sm opacity-60">→</div>
                  </motion.div>
                </Link>
                
                <Link href="/dashboard/analytics">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-wellness-outline p-4 text-left flex items-center justify-between cursor-pointer w-full rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <BarChart3 className="w-6 h-6" />
                      <div>
                        <span className="block font-medium">View Analytics</span>
                        <span className="text-sm opacity-80">Track performance</span>
                      </div>
                    </div>
                    <div className="text-sm opacity-60">→</div>
                  </motion.div>
                </Link>

                <Link href="/dashboard/resources">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-wellness-outline p-4 text-left flex items-center justify-between cursor-pointer w-full rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Heart className="w-6 h-6" />
                      <div>
                        <span className="block font-medium">Access Resources</span>
                        <span className="text-sm opacity-80">Wellness materials</span>
                      </div>
                    </div>
                    <div className="text-sm opacity-60">→</div>
                  </motion.div>
                </Link>
              </>
            )}

          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default DashboardPage;
