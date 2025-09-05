'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, ArrowLeft, Plus, TrendingUp, Save, Zap, Calendar, BarChart3 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/lib/context/AuthContext';
import { moodApi, CreateSleepEntryData } from '@/lib/api/mood';

interface SleepEntry {
  id: number;
  sleepHours: number;
  energyLevel: number;
  sleepQuality?: number;
  notes?: string;
  createdAt: string;
}

interface SleepStats {
  avgSleep: number;
  minSleep: number;
  maxSleep: number;
  totalEntries: number;
  avgEnergy: number;
}

const SleepTrackerPage = () => {
  const { user } = useAuth();
  const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>([]);
  const [sleepStats, setSleepStats] = useState<SleepStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSleepForm, setShowSleepForm] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CreateSleepEntryData>();

  useEffect(() => {
    if (user) {
      fetchSleepData();
    }
  }, [user]);

  const fetchSleepData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Get sleep statistics
      const statsResponse = await moodApi.getSleepStats(user.id, 30);
      if (statsResponse.success && statsResponse.data) {
        setSleepStats({
          avgSleep: parseFloat(statsResponse.data.stats.avg_sleep || 0),
          minSleep: parseFloat(statsResponse.data.stats.min_sleep || 0),
          maxSleep: parseFloat(statsResponse.data.stats.max_sleep || 0),
          totalEntries: parseInt(statsResponse.data.stats.total_entries || 0),
          avgEnergy: parseFloat(statsResponse.data.stats.avg_energy || 0)
        });
        
        // Transform sleep pattern data
        const sleepPattern = statsResponse.data.sleepPattern || [];
        setSleepEntries(sleepPattern.map((entry: any) => ({
          id: Math.random(),
          sleepHours: parseFloat(entry.sleep_hours) || 0,
          energyLevel: parseFloat(entry.energy_level) || 0,
          createdAt: entry.date,
          notes: ''
        })));
      }
    } catch (error) {
      console.error('Failed to fetch sleep data:', error);
      toast.error('Failed to load sleep data');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitSleepEntry = async (data: CreateSleepEntryData) => {
    if (!user) {
      toast.error('User not logged in');
      return;
    }
    
    try {
      const sleepData = { ...data, userId: user.id };
      const response = await moodApi.createSleepEntry(sleepData);
      if (response.success && response.data) {
        toast.success(`Sleep logged! Your energy level is calculated as ${response.data.sleepEntry.energyLevel}/10`);
        reset();
        setShowSleepForm(false);
        fetchSleepData(); // Refresh data
      } else {
        toast.error(response.error || 'Failed to save sleep entry');
      }
    } catch (error) {
      toast.error('Failed to save sleep entry');
    }
  };

  const getSleepQualityColor = (hours: number) => {
    // Handle invalid or missing hours
    if (hours == null || isNaN(hours)) return '#6B7280'; // gray for invalid data
    if (hours >= 7 && hours <= 9) return '#10B981'; // green - optimal
    if (hours >= 6 && hours <= 10) return '#F59E0B'; // yellow - decent
    return '#EF4444'; // red - poor
  };

  const getSleepQualityLabel = (hours: number) => {
    // Handle invalid or missing hours
    if (hours == null || isNaN(hours)) return 'No Data';
    if (hours >= 7 && hours <= 9) return 'Optimal';
    if (hours >= 6 && hours <= 10) return 'Decent';
    if (hours >= 4) return 'Poor';
    return 'Very Poor';
  };

  const chartData = sleepEntries.slice(0, 14).reverse().map(entry => ({
    date: new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sleep: entry.sleepHours,
    energy: entry.energyLevel
  }));

  return (
    <div className="min-h-screen bg-netflix-black">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-netflix-black-light border-b border-netflix-gray-dark p-6"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-netflix-gray-light hover:text-white transition-colors duration-200"
              >
                <ArrowLeft className="w-6 h-6" />
              </motion.button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
                <Moon className="w-8 h-8 text-wellness-primary" />
                <span>Sleep Tracker</span>
              </h1>
              <p className="text-netflix-gray-light">Track your sleep and boost your energy</p>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSleepForm(true)}
            className="btn-wellness flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Log Sleep</span>
          </motion.button>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Sleep Stats Overview */}
        {sleepStats && (
          <div className="grid md:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-wellness text-center"
            >
              <Moon className="w-8 h-8 text-wellness-primary mx-auto mb-2" />
              <h3 className="text-sm font-medium text-netflix-gray-light mb-1">Average Sleep</h3>
              <p className="text-2xl font-bold text-white">{sleepStats.avgSleep.toFixed(1)}h</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card-wellness text-center"
            >
              <Zap className="w-8 h-8 text-wellness-secondary mx-auto mb-2" />
              <h3 className="text-sm font-medium text-netflix-gray-light mb-1">Average Energy</h3>
              <p className="text-2xl font-bold text-white">{sleepStats.avgEnergy.toFixed(1)}/10</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card-wellness text-center"
            >
              <BarChart3 className="w-8 h-8 text-wellness-warning mx-auto mb-2" />
              <h3 className="text-sm font-medium text-netflix-gray-light mb-1">Sleep Range</h3>
              <p className="text-2xl font-bold text-white">{sleepStats.minSleep.toFixed(1)} - {sleepStats.maxSleep.toFixed(1)}h</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card-wellness text-center"
            >
              <Calendar className="w-8 h-8 text-wellness-success mx-auto mb-2" />
              <h3 className="text-sm font-medium text-netflix-gray-light mb-1">Total Entries</h3>
              <p className="text-2xl font-bold text-white">{sleepStats.totalEntries}</p>
            </motion.div>
          </div>
        )}

        {/* Sleep & Energy Chart */}
        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="card-wellness"
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
              <Moon className="w-6 h-6 text-wellness-primary" />
              <span>Sleep Pattern</span>
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2F2F2F" />
                <XAxis dataKey="date" stroke="#B3B3B3" />
                <YAxis stroke="#B3B3B3" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F1F1F', 
                    border: '1px solid #2F2F2F',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="sleep" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                  name="Sleep Hours"
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="card-wellness"
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
              <Zap className="w-6 h-6 text-wellness-secondary" />
              <span>Energy Levels</span>
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2F2F2F" />
                <XAxis dataKey="date" stroke="#B3B3B3" />
                <YAxis stroke="#B3B3B3" domain={[0, 10]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F1F1F', 
                    border: '1px solid #2F2F2F',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }} 
                />
                <Bar dataKey="energy" fill="#10B981" name="Energy Level" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Recent Sleep Entries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card-wellness"
        >
          <h3 className="text-xl font-semibold text-white mb-4">Recent Sleep Entries</h3>
          <div className="space-y-3">
            {sleepEntries.slice(0, 7).map((entry, index) => {
              const sleepColor = getSleepQualityColor(entry.sleepHours);
              return (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-netflix-gray-dark/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: sleepColor }}
                    />
                    <span className="text-white font-medium">
                      {(entry.sleepHours || 0).toFixed(1)} hours
                    </span>
                    <span className={`text-sm px-2 py-1 rounded-full`} style={{ 
                      backgroundColor: sleepColor + '20',
                      color: sleepColor
                    }}>
                      {getSleepQualityLabel(entry.sleepHours)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4 text-wellness-secondary" />
                      <span className="text-wellness-secondary font-medium">{entry.energyLevel || 0}/10</span>
                    </div>
                    <span className="text-netflix-gray-light text-sm">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Sleep Entry Form Modal */}
        <AnimatePresence>
          {showSleepForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowSleepForm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="card-netflix p-6 w-full max-w-md"
              >
                <h3 className="text-xl font-bold text-white mb-6">Log Your Sleep</h3>
                
                <form onSubmit={handleSubmit(onSubmitSleepEntry)} className="space-y-4">
                  {/* Sleep Hours */}
                  <div>
                    <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                      How many hours did you sleep? *
                    </label>
                    <input
                      {...register('sleepHours', { 
                        required: 'Sleep hours is required',
                        min: { value: 0, message: 'Sleep hours cannot be negative' },
                        max: { value: 24, message: 'Sleep hours cannot exceed 24' },
                        valueAsNumber: true
                      })}
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      className="input-netflix w-full"
                      placeholder="e.g., 7.5"
                    />
                    {errors.sleepHours && (
                      <p className="text-netflix-red text-sm mt-1">{errors.sleepHours.message}</p>
                    )}
                  </div>

                  {/* Sleep Quality */}
                  <div>
                    <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                      Sleep Quality (1-5)
                    </label>
                    <select
                      {...register('sleepQuality', { valueAsNumber: true })}
                      className="input-netflix w-full"
                    >
                      <option value={1}>1 - Very Poor</option>
                      <option value={2}>2 - Poor</option>
                      <option value={3} selected>3 - Average</option>
                      <option value={4}>4 - Good</option>
                      <option value={5}>5 - Excellent</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      {...register('notes')}
                      className="input-netflix w-full h-20 resize-none"
                      placeholder="How was your sleep? Any disturbances?"
                    />
                  </div>

                  <div className="bg-wellness-primary/10 border border-wellness-primary/20 rounded-lg p-3 mt-4">
                    <p className="text-wellness-primary text-sm">
                      💡 Your energy level will be automatically calculated based on your sleep hours and recent goal completions!
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowSleepForm(false)}
                      className="flex-1 btn-wellness-outline py-3"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 btn-wellness py-3 flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save Sleep
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SleepTrackerPage;
