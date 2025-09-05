'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Heart,
  Calendar,
  Award,
  Activity,
  Brain,
  Moon,
  Zap
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { progressApi, ProgressStats, MoodTrendData } from '@/lib/api/progress';
import { toast } from 'react-hot-toast';

const ProgressPage = () => {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState<ProgressStats | null>(null);
  const [moodTrendData, setMoodTrendData] = useState<MoodTrendData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProgressData();
    }
  }, [user, selectedPeriod]);

  const fetchProgressData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
      
      // Fetch progress stats
      const statsResponse = await progressApi.getProgressStats(user.id, days);
      if (statsResponse.success && statsResponse.data) {
        setProgressData(statsResponse.data);
      } else {
        toast.error(statsResponse.error || 'Failed to fetch progress statistics');
      }
      
      // Fetch mood trend data
      const trendResponse = await progressApi.getMoodTrendData(user.id, days);
      if (trendResponse.success && trendResponse.data) {
        setMoodTrendData(trendResponse.data);
      } else {
        console.error('Failed to fetch mood trend data:', trendResponse.error);
        setMoodTrendData([]);
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
      toast.error('Failed to load progress data');
    } finally {
      setIsLoading(false);
    }
  };

  const getMoodColor = (level: number) => {
    switch (level) {
      case 5: return '#10B981'; // excellent - green
      case 4: return '#84CC16'; // good - lime
      case 3: return '#F59E0B'; // neutral - amber
      case 2: return '#F97316'; // low - orange
      case 1: return '#EF4444'; // very low - red
      default: return '#6B7280'; // gray
    }
  };

  const getMoodLabel = (level: number) => {
    switch (level) {
      case 5: return 'Excellent';
      case 4: return 'Good';
      case 3: return 'Neutral';
      case 2: return 'Low';
      case 1: return 'Very Low';
      default: return 'Unknown';
    }
  };

  const getMoodNumericValue = (moodLevel: string): number => {
    switch (moodLevel) {
      case 'excellent': return 5;
      case 'good': return 4;
      case 'neutral': return 3;
      case 'low': return 2;
      case 'very_low': return 1;
      default: return 3;
    }
  };

  const getWellnessScoreColor = (score: number) => {
    if (score >= 80) return 'text-wellness-success';
    if (score >= 60) return 'text-wellness-warning';
    return 'text-netflix-red';
  };

  const getWellnessScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  if (isLoading || !progressData) {
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

  return (
    <div className="min-h-screen bg-netflix-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-wellness-primary" />
              Progress Report
            </h1>
            <p className="text-netflix-gray-light mt-2">
              Track your wellness journey and insights
            </p>
          </div>
          
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                disabled={isLoading}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-50 ${
                  selectedPeriod === period
                    ? 'bg-wellness-primary text-white'
                    : 'bg-netflix-gray-dark text-netflix-gray-light hover:text-white'
                }`}
              >
                {period === '7d' ? 'Last 7 Days' : period === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Wellness Score & Overview */}
        <div className="grid lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1"
          >
            <div className="card-netflix p-6 text-center">
              <h3 className="text-lg font-semibold text-white mb-4">Overall Wellness Score</h3>
              <div className={`text-6xl font-bold mb-2 ${getWellnessScoreColor(progressData.wellnessScore)}`}>
                {progressData.wellnessScore}
              </div>
              <p className={`text-sm font-medium ${getWellnessScoreColor(progressData.wellnessScore)}`}>
                {getWellnessScoreLabel(progressData.wellnessScore)}
              </p>
              <div className="mt-4 w-full bg-netflix-gray-dark rounded-full h-2">
                <div 
                  className="bg-wellness-primary h-2 rounded-full transition-all duration-700"
                  style={{ width: `${progressData.wellnessScore}%` }}
                />
              </div>
            </div>
          </motion.div>

          <div className="lg:col-span-3 grid md:grid-cols-3 gap-4">
            <StatsCard
              icon={<Heart className="w-8 h-8" />}
              title="Most Common Mood"
              value={getMoodLabel(getMoodNumericValue(progressData.moodStats.mostCommonMood))}
              color="text-wellness-mood-good"
              label={`${progressData.moodStats.totalEntries} entries`}
            />
            
            <StatsCard
              icon={<Zap className="w-8 h-8" />}
              title="Energy Level"
              value={`${progressData.moodStats.avgEnergy.toFixed(1)}/10`}
              color="text-wellness-secondary"
            />

            <StatsCard
              icon={<Moon className="w-8 h-8" />}
              title="Sleep Average"
              value={`${progressData.moodStats.avgSleep.toFixed(1)}h`}
              color="text-wellness-primary"
            />
          </div>
        </div>

        {/* Charts and Analytics */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Mood Trend Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="card-netflix p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Heart className="w-5 h-5 text-wellness-primary" />
              Mood Trend (Last 30 Days)
            </h3>
            <div className="space-y-4">
              {moodTrendData.slice(-10).map((day, index) => (
                <div key={day.date} className="flex items-center gap-4">
                  <span className="text-sm text-netflix-gray-light w-16">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getMoodColor(day.moodLevel) }}
                      />
                      <span className="text-sm font-medium text-white">
                        {getMoodLabel(day.moodLevel)}
                      </span>
                    </div>
                    <div className="w-full bg-netflix-gray-dark rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ 
                          backgroundColor: getMoodColor(day.moodLevel),
                          width: `${(day.moodLevel / 5) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Goals Progress */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="card-netflix p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-wellness-primary" />
              Goals Progress
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-netflix-gray-light">Total Goals</span>
                <span className="text-2xl font-bold text-white">{progressData.goalsStats.totalGoals}</span>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-netflix-gray-light">Completed</span>
                  <span className="text-wellness-success font-medium">
                    {progressData.goalsStats.completedGoals}
                  </span>
                </div>
                <div className="w-full bg-netflix-gray-dark rounded-full h-2">
                  <div 
                    className="bg-wellness-success h-2 rounded-full transition-all duration-700"
                    style={{ 
                      width: `${progressData.goalsStats.totalGoals > 0 ? (progressData.goalsStats.completedGoals / progressData.goalsStats.totalGoals) * 100 : 0}%` 
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-netflix-gray-light">In Progress</span>
                  <span className="text-wellness-warning font-medium">
                    {progressData.goalsStats.inProgress}
                  </span>
                </div>
                <div className="w-full bg-netflix-gray-dark rounded-full h-2">
                  <div 
                    className="bg-wellness-warning h-2 rounded-full transition-all duration-700"
                    style={{ 
                      width: `${progressData.goalsStats.totalGoals > 0 ? (progressData.goalsStats.inProgress / progressData.goalsStats.totalGoals) * 100 : 0}%` 
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-netflix-gray-light">Overdue</span>
                  <span className="text-netflix-red font-medium">
                    {progressData.goalsStats.overdue}
                  </span>
                </div>
                <div className="w-full bg-netflix-gray-dark rounded-full h-2">
                  <div 
                    className="bg-netflix-red h-2 rounded-full transition-all duration-700"
                    style={{ 
                      width: `${progressData.goalsStats.totalGoals > 0 ? (progressData.goalsStats.overdue / progressData.goalsStats.totalGoals) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Streaks and Achievements */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card-netflix p-6 text-center"
          >
            <Award className="w-12 h-12 text-wellness-warning mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Current Streak</h3>
            <p className="text-3xl font-bold text-wellness-warning mb-1">
              {progressData.streaks.currentMoodStreak}
            </p>
            <p className="text-sm text-netflix-gray-light">days logging mood</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card-netflix p-6 text-center"
          >
            <Activity className="w-12 h-12 text-wellness-success mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Longest Streak</h3>
            <p className="text-3xl font-bold text-wellness-success mb-1">
              {progressData.streaks.longestMoodStreak}
            </p>
            <p className="text-sm text-netflix-gray-light">days record</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="card-netflix p-6 text-center"
          >
            <Brain className="w-12 h-12 text-wellness-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Insights</h3>
            <p className="text-sm text-netflix-gray-light mb-2">
              Your mood improves most on weekends
            </p>
            <p className="text-sm text-wellness-primary font-medium">
              Try maintaining weekend habits
            </p>
          </motion.div>
        </div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card-netflix p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Brain className="w-5 h-5 text-wellness-primary" />
            Personalized Recommendations
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-white">Based on your progress:</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-wellness-success rounded-full mt-2" />
                  <p className="text-sm text-netflix-gray-light">
                    Your mood tracking consistency is excellent! Keep up the daily logging.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-wellness-warning rounded-full mt-2" />
                  <p className="text-sm text-netflix-gray-light">
                    Consider setting more achievable goal deadlines to reduce stress.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-wellness-primary rounded-full mt-2" />
                  <p className="text-sm text-netflix-gray-light">
                    Your sleep patterns show improvement - try to maintain this routine.
                  </p>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium text-white">Suggested Actions:</h4>
              <div className="space-y-3">
                <button className="w-full text-left p-3 bg-netflix-gray-dark hover:bg-netflix-gray-medium rounded-lg transition-colors duration-200">
                  <p className="text-sm font-medium text-white">Book a counseling session</p>
                  <p className="text-xs text-netflix-gray-light">to discuss stress management</p>
                </button>
                <button className="w-full text-left p-3 bg-netflix-gray-dark hover:bg-netflix-gray-medium rounded-lg transition-colors duration-200">
                  <p className="text-sm font-medium text-white">Set a new wellness goal</p>
                  <p className="text-xs text-netflix-gray-light">to maintain momentum</p>
                </button>
                <button className="w-full text-left p-3 bg-netflix-gray-dark hover:bg-netflix-gray-medium rounded-lg transition-colors duration-200">
                  <p className="text-sm font-medium text-white">Explore mindfulness resources</p>
                  <p className="text-xs text-netflix-gray-light">for better mood regulation</p>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Stats Card Component
const StatsCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string;
  change?: number;
  color: string;
  label?: string;
}> = ({ icon, title, value, change, color, label }) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-netflix p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={color}>{icon}</div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 ${
            isPositive ? 'text-wellness-success' : isNegative ? 'text-netflix-red' : 'text-netflix-gray-light'
          }`}>
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : isNegative ? (
              <TrendingDown className="w-4 h-4" />
            ) : null}
            <span className="text-sm font-medium">
              {change > 0 ? '+' : ''}{change.toFixed(1)}
            </span>
          </div>
        )}
      </div>
      <h3 className="text-sm text-netflix-gray-light mb-1">{title}</h3>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      {label && (
        <p className="text-xs text-netflix-gray-light">{label}</p>
      )}
    </motion.div>
  );
};

export default ProgressPage;
