'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowLeft, Plus, TrendingUp, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/lib/context/AuthContext';
import { moodApi, CreateMoodEntryData } from '@/lib/api/mood';
import { MoodEntry } from '@/types';
import { 
  getMoodEntriesForUser, 
  createMoodEntry as createStoredMoodEntry, 
  initializeSampleMoodData,
  StoredMoodEntry,
  calculateWellnessScore 
} from '@/lib/storage/mood';
import {
  getNotificationsForUser,
  getUnreadNotificationCount,
  markNotificationAsRead
} from '@/lib/api/wellness-notifications';
import {
  triggerMoodTrackingNotification,
  triggerSleepNotification,
  checkAndDisplayRecentNotifications
} from '@/lib/utils/student-notifications';
import {
  triggerMoodTrackingAppreciation
} from '@/lib/utils/appreciation-notifications';
import { calculateMoodStreak } from '@/lib/storage/mood';
import { analyzeDailyWellnessAndAnimate } from '@/lib/utils/daily-wellness-analyzer';

// Helper function to get notification icon based on type
const getNotificationIcon = (type: string): string => {
  switch (type) {
    case 'improvement':
      return '📈';
    case 'milestone':
      return '🎉';
    case 'alert':
      return '⚠️';
    case 'decline':
      return '💙';
    default:
      return '📊';
  }
};

const MoodTrackerPage = () => {
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMoodForm, setShowMoodForm] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<CreateMoodEntryData>();

  useEffect(() => {
    if (user) {
      fetchMoodEntries();
    }
  }, [user]);

  const fetchMoodEntries = async () => {
    setIsLoading(true);
    try {
      if (!user) {
        setMoodEntries([]);
        return;
      }

      // Try API first
      const response = await moodApi.getMyMoodEntries(30);
      if (response.success && response.data) {
        setMoodEntries(response.data.moodEntries);
      } else {
        // Use storage instead
        console.log('Loading mood entries from storage...');
        await initializeSampleMoodData(user.id);
        const storedEntries = await getMoodEntriesForUser(user.id, 30);
        
        // Convert StoredMoodEntry to MoodEntry format
        const moodEntries: MoodEntry[] = storedEntries.map(entry => ({
          id: entry.id,
          userId: entry.userId,
          moodLevel: entry.moodLevel,
          notes: entry.notes,
          energyLevel: entry.energyLevel,
          sleepHours: entry.sleepHours,
          stressLevel: entry.stressLevel,
          createdAt: entry.createdAt
        }));
        
        setMoodEntries(moodEntries);
        console.log('Loaded mood entries from storage:', moodEntries.length);
      }
    } catch (error) {
      console.error('Failed to fetch mood entries:', error);
      // Fallback to storage
      if (user) {
        await initializeSampleMoodData(user.id);
        const storedEntries = await getMoodEntriesForUser(user.id, 30);
        const moodEntries: MoodEntry[] = storedEntries.map(entry => ({
          id: entry.id,
          userId: entry.userId,
          moodLevel: entry.moodLevel,
          notes: entry.notes,
          energyLevel: entry.energyLevel,
          sleepHours: entry.sleepHours,
          stressLevel: entry.stressLevel,
          createdAt: entry.createdAt
        }));
        setMoodEntries(moodEntries);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitMoodEntry = async (data: CreateMoodEntryData) => {
    try {
      if (!user) {
        toast.error('User not logged in');
        return;
      }

      // Try API first, fallback to storage
      const response = await moodApi.createMoodEntry(data);
      if (response.success && response.data) {
        toast.success('Mood entry saved successfully!');
        setMoodEntries(prev => [response.data!.moodEntry, ...prev]);
        reset();
        setSelectedMood('');
        setShowMoodForm(false);
      } else {
        // Use storage instead
        console.log('Saving mood entry to storage:', data);
        
        // Get previous score for notifications
        const previousScore = await calculateWellnessScore(user.id);
        
        const newStoredEntry = await createStoredMoodEntry({
          userId: user.id,
          moodLevel: data.moodLevel,
          notes: data.notes,
          energyLevel: data.energyLevel,
          sleepHours: data.sleepHours,
          stressLevel: data.stressLevel
        });
        
        // Convert to MoodEntry format and add to state
        const newMoodEntry: MoodEntry = {
          id: newStoredEntry.id,
          userId: newStoredEntry.userId,
          moodLevel: newStoredEntry.moodLevel,
          notes: newStoredEntry.notes,
          energyLevel: newStoredEntry.energyLevel,
          sleepHours: newStoredEntry.sleepHours,
          stressLevel: newStoredEntry.stressLevel,
          createdAt: newStoredEntry.createdAt
        };
        
        setMoodEntries(prev => [newMoodEntry, ...prev]);
        
        // Trigger enhanced student notifications and appreciation
        const currentStreak = await calculateMoodStreak(user.id);
        await triggerMoodTrackingNotification(
          user.id,
          data.moodLevel,
          previousScore
        );
        
        // Trigger appreciation notification for mood tracking
        await triggerMoodTrackingAppreciation(
          user.id,
          data.moodLevel,
          currentStreak,
          true // Show toast notifications
        );
        
        // Also trigger comprehensive wellness analysis with enhanced animations
        await analyzeDailyWellnessAndAnimate(
          user.id,
          {
            moodLogged: {
              level: data.moodLevel,
              sleepHours: data.sleepHours
            }
          }
        );
        
        // Trigger sleep-specific notification if sleep hours provided
        if (data.sleepHours) {
          await triggerSleepNotification(user.id, data.sleepHours);
        }
        
        console.log('Mood entry saved:', newStoredEntry);
        reset();
        setSelectedMood('');
        setShowMoodForm(false);
      }
    } catch (error) {
      // Fallback to storage on error
      if (user) {
        console.log('API failed, using storage fallback');
        
        // Get previous score for notifications
        const previousScore = await calculateWellnessScore(user.id);
        
        const newStoredEntry = await createStoredMoodEntry({
          userId: user.id,
          moodLevel: data.moodLevel,
          notes: data.notes,
          energyLevel: data.energyLevel,
          sleepHours: data.sleepHours,
          stressLevel: data.stressLevel
        });
        
        const newMoodEntry: MoodEntry = {
          id: newStoredEntry.id,
          userId: newStoredEntry.userId,
          moodLevel: newStoredEntry.moodLevel,
          notes: newStoredEntry.notes,
          energyLevel: newStoredEntry.energyLevel,
          sleepHours: newStoredEntry.sleepHours,
          stressLevel: newStoredEntry.stressLevel,
          createdAt: newStoredEntry.createdAt
        };
        
        setMoodEntries(prev => [newMoodEntry, ...prev]);
        
        // Trigger enhanced student notifications and appreciation
        const currentStreak = await calculateMoodStreak(user.id);
        await triggerMoodTrackingNotification(
          user.id,
          data.moodLevel,
          previousScore
        );
        
        // Trigger appreciation notification for mood tracking
        await triggerMoodTrackingAppreciation(
          user.id,
          data.moodLevel,
          currentStreak,
          true // Show toast notifications
        );
        
        // Also trigger comprehensive wellness analysis with enhanced animations
        await analyzeDailyWellnessAndAnimate(
          user.id,
          {
            moodLogged: {
              level: data.moodLevel,
              sleepHours: data.sleepHours
            }
          }
        );
        
        // Trigger sleep-specific notification if sleep hours provided
        if (data.sleepHours) {
          await triggerSleepNotification(user.id, data.sleepHours);
        }
      } else {
        toast.error('Failed to save mood entry');
      }
    }
  };

  const getMoodNumericValue = (moodLevel: string): number => {
    // Handle invalid or missing mood level
    if (!moodLevel) return 3;
    switch (moodLevel) {
      case 'excellent': return 5;
      case 'good': return 4;
      case 'neutral': return 3;
      case 'low': return 2;
      case 'very_low': return 1;
      default: return 3;
    }
  };

  // Transform mood entries to chart data
  const moodData = moodEntries.slice(0, 7).reverse().map(entry => ({
    date: new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    mood: getMoodNumericValue(entry.moodLevel),
    energy: entry.energyLevel || 0,
    sleep: entry.sleepHours || 0,
    stress: entry.stressLevel || 0
  }));

  const moodLevels = [
    { value: 'excellent', label: 'Excellent', emoji: '😊', color: 'wellness-mood-excellent' },
    { value: 'good', label: 'Good', emoji: '🙂', color: 'wellness-mood-good' },
    { value: 'neutral', label: 'Neutral', emoji: '😐', color: 'wellness-mood-neutral' },
    { value: 'low', label: 'Low', emoji: '🙁', color: 'wellness-mood-low' },
    { value: 'very_low', label: 'Very Low', emoji: '😢', color: 'wellness-mood-very-low' }
  ];

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
                <Heart className="w-8 h-8 text-wellness-mood-good" />
                <span>Mood Tracker</span>
              </h1>
              <p className="text-netflix-gray-light">Track your daily emotional wellness</p>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMoodForm(true)}
            className="btn-wellness flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Log Mood</span>
          </motion.button>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Quick Mood Entry */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-wellness"
        >
          <h3 className="text-xl font-semibold text-white mb-4">How are you feeling today?</h3>
          <div className="grid grid-cols-5 gap-3">
            {moodLevels.map((mood, index) => {
              const isSelected = selectedMood === mood.value;
              return (
                <motion.button
                  key={mood.value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ 
                    scale: 1.05,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ 
                    scale: 0.95,
                    transition: { duration: 0.1 }
                  }}
                  onClick={() => {
                    setSelectedMood(mood.value);
                    // Auto-submit after selection with default values
                    setTimeout(async () => {
                      if (user) {
                        const previousScore = await calculateWellnessScore(user.id);
                        const quickEntry = {
                          moodLevel: mood.value as any,
                          sleepHours: 7, // Default
                          stressLevel: 5, // Default
                          notes: `Quick mood entry: ${mood.label}`,
                          energyLevel: 7 // Default
                        };
                        
                        // Trigger immediate mood notification and appreciation
                        const currentStreak = await calculateMoodStreak(user.id);
                        await triggerMoodTrackingNotification(
                          user.id,
                          mood.value,
                          previousScore
                        );
                        
                        // Trigger appreciation notification for quick mood tracking
                        await triggerMoodTrackingAppreciation(
                          user.id,
                          mood.value,
                          currentStreak + 1, // +1 because this entry will increase the streak
                          true // Show toast notifications
                        );
                        
                        // Also trigger comprehensive wellness analysis with enhanced animations
                        await analyzeDailyWellnessAndAnimate(
                          user.id,
                          {
                            moodLogged: {
                              level: mood.value,
                              sleepHours: 7 // Default sleep hours for quick entry
                            }
                          }
                        );
                        
                        // Also trigger sleep notification for the default sleep hours
                        await triggerSleepNotification(user.id, 7);
                        
                        await onSubmitMoodEntry(quickEntry);
                      }
                    }, 800); // Slightly longer delay for better animation
                  }}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 relative overflow-hidden ${
                    isSelected
                      ? 'border-wellness-primary bg-wellness-primary/20 shadow-lg shadow-wellness-primary/25' 
                      : 'border-netflix-gray-dark hover:border-netflix-gray-medium'
                  }`}
                >
                  {/* Animated background pulse for selected mood */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0.5 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="absolute inset-0 bg-wellness-primary rounded-xl"
                    />
                  )}
                  
                  {/* Emoji with bounce animation */}
                  <motion.div 
                    className="text-3xl mb-2 relative z-10"
                    animate={isSelected ? {
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0]
                    } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    {mood.emoji}
                  </motion.div>
                  
                  <div className={`text-sm transition-colors duration-300 relative z-10 ${
                    isSelected ? 'text-white font-medium' : 'text-netflix-gray-light'
                  }`}>
                    {mood.label}
                  </div>
                  
                  {/* Selection indicator */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-3 h-3 bg-wellness-primary rounded-full z-10"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
          
          {selectedMood && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-center"
            >
              <p className="text-wellness-primary font-medium">
                Mood recorded! ✨ Your {moodLevels.find(m => m.value === selectedMood)?.label.toLowerCase()} mood has been saved.
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="card-wellness"
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
              <TrendingUp className="w-6 h-6 text-wellness-primary" />
              <span>Mood Trends</span>
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={moodData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2F2F2F" />
                <XAxis dataKey="date" stroke="#B3B3B3" />
                <YAxis stroke="#B3B3B3" domain={[1, 5]} />
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
                  dataKey="mood" 
                  stroke="#4F46E5" 
                  strokeWidth={3}
                  dot={{ fill: '#4F46E5', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="card-wellness"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Weekly Overview</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={moodData}>
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
                <Bar dataKey="energy" fill="#06B6D4" />
                <Bar dataKey="sleep" fill="#10B981" />
                <Bar dataKey="stress" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Mood Entry Form Modal */}
        <AnimatePresence>
          {showMoodForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowMoodForm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="card-netflix p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
              >
                <h3 className="text-xl font-bold text-white mb-6">Log Your Mood</h3>
                
                <form onSubmit={handleSubmit(onSubmitMoodEntry)} className="space-y-4">
                  {/* Mood Level */}
                  <div>
                    <label className="block text-sm font-medium text-netflix-gray-light mb-3">
                      How are you feeling? *
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {moodLevels.map((mood) => (
                        <motion.label
                          key={mood.value}
                          whileHover={{ scale: 1.02 }}
                          className="cursor-pointer"
                        >
                          <input
                            {...register('moodLevel', { required: 'Please select your mood level' })}
                            type="radio"
                            value={mood.value}
                            className="sr-only"
                          />
                          <div className={`p-3 border-2 rounded-lg flex items-center gap-3 transition-all duration-200`}>
                            <span className="text-2xl">{mood.emoji}</span>
                            <span className="text-white font-medium">{mood.label}</span>
                          </div>
                        </motion.label>
                      ))}
                    </div>
                    {errors.moodLevel && (
                      <p className="text-netflix-red text-sm mt-1">{errors.moodLevel.message}</p>
                    )}
                  </div>

                  {/* Energy Level */}
                  <div>
                    <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                      Energy Level (1-10) *
                    </label>
                    <input
                      {...register('energyLevel', { 
                        required: 'Energy level is required',
                        min: { value: 1, message: 'Energy level must be at least 1' },
                        max: { value: 10, message: 'Energy level cannot exceed 10' },
                        valueAsNumber: true
                      })}
                      type="number"
                      min="1"
                      max="10"
                      className="input-netflix w-full"
                      placeholder="1-10"
                    />
                    {errors.energyLevel && (
                      <p className="text-netflix-red text-sm mt-1">{errors.energyLevel.message}</p>
                    )}
                  </div>

                  {/* Sleep Hours */}
                  <div>
                    <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                      Sleep Hours *
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

                  {/* Stress Level */}
                  <div>
                    <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                      Stress Level (1-10) *
                    </label>
                    <input
                      {...register('stressLevel', { 
                        required: 'Stress level is required',
                        min: { value: 1, message: 'Stress level must be at least 1' },
                        max: { value: 10, message: 'Stress level cannot exceed 10' },
                        valueAsNumber: true
                      })}
                      type="number"
                      min="1"
                      max="10"
                      className="input-netflix w-full"
                      placeholder="1-10"
                    />
                    {errors.stressLevel && (
                      <p className="text-netflix-red text-sm mt-1">{errors.stressLevel.message}</p>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      {...register('notes')}
                      className="input-netflix w-full h-20 resize-none"
                      placeholder="How was your day? Any specific thoughts or events?"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowMoodForm(false)}
                      className="flex-1 btn-wellness-outline py-3"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 btn-wellness py-3 flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save Entry
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

export default MoodTrackerPage;
