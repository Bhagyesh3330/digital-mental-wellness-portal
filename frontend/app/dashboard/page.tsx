'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Heart, 
  Target, 
  Calendar, 
  BarChart3, 
  Users, 
  Settings,
  Bell,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import Link from 'next/link';

const DashboardPage = () => {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
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
              icon: BarChart3,
              title: 'Progress Report',
              description: 'View your wellness analytics',
              color: 'bg-wellness-warning',
              href: '/dashboard/progress'
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
      case 'admin':
        return {
          title: 'Admin Dashboard',
          subtitle: 'Manage the wellness platform',
          cards: [
            {
              icon: Users,
              title: 'User Management',
              description: 'Manage students, counselors, and accounts',
              color: 'bg-wellness-primary',
              href: '/dashboard/users'
            },
            {
              icon: BarChart3,
              title: 'System Analytics',
              description: 'Platform usage and statistics',
              color: 'bg-wellness-secondary',
              href: '/dashboard/analytics'
            },
            {
              icon: Settings,
              title: 'System Settings',
              description: 'Configure platform settings',
              color: 'bg-wellness-warning',
              href: '/dashboard/settings'
            },
            {
              icon: Heart,
              title: 'Content Management',
              description: 'Manage resources and content',
              color: 'bg-wellness-success',
              href: '/dashboard/content'
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
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-netflix-gray-light hover:text-white transition-colors duration-200"
              >
                <Bell className="w-5 h-5" />
              </motion.button>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-netflix-gray-light capitalize">
                    {user.role}
                  </p>
                </div>
                <div className="w-8 h-8 bg-wellness-primary rounded-full flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
              </div>
              
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
          
          <div className="grid md:grid-cols-3 gap-4">
            {user.role === 'student' && (
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-wellness p-4 text-left flex items-center space-x-3"
                >
                  <Heart className="w-6 h-6" />
                  <span>Log Today's Mood</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-wellness-outline p-4 text-left flex items-center space-x-3"
                >
                  <Calendar className="w-6 h-6" />
                  <span>Book Appointment</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-wellness-outline p-4 text-left flex items-center space-x-3"
                >
                  <Target className="w-6 h-6" />
                  <span>Set New Goal</span>
                </motion.button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default DashboardPage;
