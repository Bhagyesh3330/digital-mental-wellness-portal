'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, ArrowLeft, Plus, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MoodTrackerPage = () => {
  const [selectedMood, setSelectedMood] = useState<string>('');

  // Sample data for charts
  const moodData = [
    { date: '2024-09-01', mood: 4, energy: 7, sleep: 8, stress: 3 },
    { date: '2024-09-02', mood: 3, energy: 5, sleep: 6, stress: 6 },
    { date: '2024-09-03', mood: 5, energy: 8, sleep: 7, stress: 2 },
    { date: '2024-09-04', mood: 4, energy: 6, sleep: 7, stress: 4 },
    { date: '2024-09-05', mood: 5, energy: 9, sleep: 8, stress: 1 },
  ];

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
            {moodLevels.map((mood) => (
              <motion.button
                key={mood.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedMood(mood.value)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedMood === mood.value 
                    ? `border-${mood.color} bg-${mood.color}/20` 
                    : 'border-netflix-gray-dark hover:border-netflix-gray-medium'
                }`}
              >
                <div className="text-3xl mb-2">{mood.emoji}</div>
                <div className="text-sm text-netflix-gray-light">{mood.label}</div>
              </motion.button>
            ))}
          </div>
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
      </div>
    </div>
  );
};

export default MoodTrackerPage;
