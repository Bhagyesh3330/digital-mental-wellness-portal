'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Users,
  Target,
  CheckCircle,
  Activity,
  AlertTriangle,
  BookOpen,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
// Analytics interface to match API response
interface AnalyticsStats {
  totalStudents: number;
  activeStudents: number;
  studentsAtRisk: number;
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  scheduledSessions: number;
  completionRate: number;
  averageWellnessScore: number;
  averageMoodRating: number;
  totalMoodEntries: number;
  totalResources: number;
  resourcesByType: {
    article: number;
    video: number;
    book: number;
    worksheet: number;
    reference: number;
  };
  lastUpdated: string;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
}

const AnalyticsPage = () => {
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching analytics from database API...');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/analytics', { headers });
      const data = await response.json();
      
      if (data.success && data.analytics) {
        setAnalytics(data.analytics);
        console.log('Analytics loaded from database:', data.analytics);
      } else {
        console.error('Failed to load analytics:', data.error);
        // Set empty analytics to avoid showing stale data
        setAnalytics(null);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      console.log('Refreshing analytics from database API...');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/analytics', { headers });
      const data = await response.json();
      
      if (data.success && data.analytics) {
        setAnalytics(data.analytics);
        console.log('Analytics refreshed from database:', data.analytics);
      } else {
        console.error('Failed to refresh analytics:', data.error);
      }
    } catch (error) {
      console.error('Failed to refresh analytics:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'counselor') {
      router.push('/dashboard');
      return;
    }
    
    loadAnalytics();
  }, [user, router, loadAnalytics]);

  if (loading) {
    return (
      <div className="min-h-screen bg-netflix-black p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="spinner w-8 h-8" />
          </div>
        </div>
      </div>
    );
  }

  const getWellnessScoreStatus = (score: number) => {
    if (score >= 70) return { text: 'Good', color: 'bg-wellness-success/20 text-wellness-success' };
    if (score >= 50) return { text: 'Fair', color: 'bg-wellness-warning/20 text-wellness-warning' };
    return { text: 'Needs Attention', color: 'bg-netflix-red/20 text-netflix-red' };
  };

  return (
    <div className="min-h-screen bg-netflix-black p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-wellness-primary" />
              {user?.role === 'counselor' ? 'My Analytics' : 'System Analytics'}
            </h1>
            <p className="text-netflix-gray-light mt-2">
              {user?.role === 'counselor' 
                ? 'Track your counseling performance and student progress'
                : 'Monitor platform usage and system-wide statistics'
              }
            </p>
            {analytics && (
              <p className="text-xs text-netflix-gray-light mt-1">
                Last updated: {new Date(analytics.lastUpdated).toLocaleString()}
              </p>
            )}
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-netflix-primary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-netflix p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-netflix-gray-light text-sm mb-1">Total Students</p>
                <p className="text-3xl font-bold text-white">{analytics?.totalStudents || 0}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-wellness-info text-sm">{analytics?.activeStudents || 0} active</p>
                  <p className="text-netflix-gray-light text-sm">•</p>
                  <p className="text-wellness-warning text-sm">{analytics?.studentsAtRisk || 0} at risk</p>
                </div>
              </div>
              <Users className="w-12 h-12 text-wellness-primary" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-netflix p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-netflix-gray-light text-sm mb-1">Total Sessions</p>
                <p className="text-3xl font-bold text-white">{analytics?.totalSessions || 0}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-wellness-success text-sm">{analytics?.completedSessions || 0} completed</p>
                  <p className="text-netflix-gray-light text-sm">•</p>
                  <p className="text-wellness-secondary text-sm">{analytics?.scheduledSessions || 0} scheduled</p>
                </div>
              </div>
              <Calendar className="w-12 h-12 text-wellness-secondary" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-netflix p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-netflix-gray-light text-sm mb-1">Completion Rate</p>
                <p className="text-3xl font-bold text-white">{analytics?.completionRate || 0}%</p>
                <p className="text-netflix-gray-light text-sm mt-1">
                  {analytics?.cancelledSessions || 0} cancelled sessions
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-wellness-success" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card-netflix p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-netflix-gray-light text-sm mb-1">Wellness Score</p>
                <p className="text-3xl font-bold text-white">{analytics?.averageWellnessScore || 50}</p>
                <p className="text-wellness-info text-sm mt-1">
                  Avg mood: {analytics?.averageMoodRating || 3.0}/5.0
                </p>
              </div>
              <Target className="w-12 h-12 text-wellness-warning" />
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card-netflix p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-wellness-primary" />
              User Activity
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-netflix-black-light rounded-lg">
                <div>
                  <p className="text-wellness-primary font-medium">Weekly Active Users</p>
                  <p className="text-2xl font-bold text-white">{analytics?.weeklyActiveUsers || 0}</p>
                </div>
                <Users className="w-8 h-8 text-wellness-primary" />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-netflix-black-light rounded-lg">
                <div>
                  <p className="text-wellness-secondary font-medium">Monthly Active Users</p>
                  <p className="text-2xl font-bold text-white">{analytics?.monthlyActiveUsers || 0}</p>
                </div>
                <Activity className="w-8 h-8 text-wellness-secondary" />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-netflix-black-light rounded-lg">
                <div>
                  <p className="text-wellness-warning font-medium">Students at Risk</p>
                  <p className="text-2xl font-bold text-white">{analytics?.studentsAtRisk || 0}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-wellness-warning" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="card-netflix p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-wellness-secondary" />
              Resources Available
            </h3>
            
            <div className="space-y-4">
              {analytics?.resourcesByType && Object.entries(analytics.resourcesByType).map(([type, count]) => {
                const total = analytics.totalResources || 1;
                const percentage = Math.round((count / total) * 100);
                
                return (
                  <div key={type} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white font-medium capitalize">{type}</span>
                      <span className="text-sm text-netflix-gray-light">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-netflix-gray-dark rounded-full h-2">
                      <div 
                        className="bg-wellness-secondary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              
              <div className="pt-4 border-t border-netflix-gray-dark">
                <div className="flex justify-between items-center">
                  <span className="text-white font-semibold">Total Resources</span>
                  <span className="text-2xl font-bold text-wellness-secondary">{analytics?.totalResources || 0}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card-netflix p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Target className="w-6 h-6 text-wellness-warning" />
            Mood & Wellness Overview
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-netflix-black-light rounded-lg p-4 border border-netflix-gray-dark text-center"
            >
              <div className="text-3xl font-bold text-wellness-primary mb-2">
                {analytics?.averageWellnessScore || 50}
              </div>
              <div className="text-sm text-netflix-gray-light mb-1">Average Wellness Score</div>
              <div className={`text-xs px-2 py-1 rounded-full ${getWellnessScoreStatus(analytics?.averageWellnessScore || 50).color}`}>
                {getWellnessScoreStatus(analytics?.averageWellnessScore || 50).text}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-netflix-black-light rounded-lg p-4 border border-netflix-gray-dark text-center"
            >
              <div className="text-3xl font-bold text-wellness-secondary mb-2">
                {analytics?.averageMoodRating || 3.0}
              </div>
              <div className="text-sm text-netflix-gray-light mb-1">Average Mood Rating</div>
              <div className="text-xs text-wellness-info">Out of 5.0</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-netflix-black-light rounded-lg p-4 border border-netflix-gray-dark text-center"
            >
              <div className="text-3xl font-bold text-wellness-info mb-2">
                {analytics?.totalMoodEntries || 0}
              </div>
              <div className="text-sm text-netflix-gray-light mb-1">Total Mood Entries</div>
              <div className="text-xs text-netflix-gray-light">All time</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-netflix-black-light rounded-lg p-4 border border-netflix-gray-dark text-center"
            >
              <div className="text-3xl font-bold text-wellness-warning mb-2">
                {analytics?.studentsAtRisk || 0}
              </div>
              <div className="text-sm text-netflix-gray-light mb-1">Students at Risk</div>
              <div className="text-xs text-wellness-warning">Wellness score less than 50</div>
            </motion.div>
          </div>
          
          {analytics && analytics.totalStudents > 0 && (
            <div className="mt-6 p-4 bg-wellness-primary/10 rounded-lg border border-wellness-primary/20">
              <div className="text-sm text-wellness-primary mb-2 font-medium">Platform Health Summary</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-netflix-gray-light">
                <div>Active Students: {Math.round((analytics.activeStudents / analytics.totalStudents) * 100)}%</div>
                <div>Session Completion: {analytics.completionRate}%</div>
                <div>Weekly Engagement: {analytics.weeklyActiveUsers} users</div>
                <div>Risk Assessment: {Math.round((analytics.studentsAtRisk / analytics.totalStudents) * 100)}% at risk</div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
