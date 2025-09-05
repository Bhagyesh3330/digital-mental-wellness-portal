'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Clock, 
  Mail, 
  Smartphone, 
  Volume, 
  VolumeX, 
  Settings,
  Save,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/context/AuthContext';
import {
  NotificationPreferences,
  getNotificationPreferences,
  updateNotificationPreferences,
  getDefaultNotificationPreferences
} from '@/lib/api/notification-preferences';

interface NotificationSettingsProps {
  className?: string;
  onClose?: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  className = '',
  onClose
}) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await getNotificationPreferences();
      if (response.success && response.data) {
        setPreferences(response.data);
      } else {
        // Use default preferences if none exist
        setPreferences(getDefaultNotificationPreferences(user.id));
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      setPreferences(getDefaultNotificationPreferences(user.id));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences || !user) return;

    setSaving(true);
    try {
      const response = await updateNotificationPreferences(preferences);
      if (response.success) {
        toast.success(response.message || 'Notification preferences updated successfully!');
        if (onClose) onClose();
      } else {
        toast.error(response.error || 'Failed to update preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    setPreferences(prev => prev ? { ...prev, [key]: value } : null);
  };

  const updateQuietHours = (updates: Partial<NotificationPreferences['quietHours']>) => {
    setPreferences(prev => prev ? {
      ...prev,
      quietHours: { ...prev.quietHours, ...updates }
    } : null);
  };

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card-wellness max-w-4xl ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-wellness-primary" />
          <h2 className="text-2xl font-bold text-white">Notification Settings</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-netflix-gray-light hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-wellness-primary" />
          <span className="ml-3 text-netflix-gray-light">Loading preferences...</span>
        </div>
      ) : preferences ? (
        <div className="space-y-8">
          {/* Notification Types */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-wellness-primary" />
              Notification Types
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Wellness Score Changes</label>
                  <p className="text-sm text-netflix-gray-light">Get notified when your wellness score changes significantly</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={preferences.enableWellnessScoreNotifications}
                    onChange={(e) => updatePreference('enableWellnessScoreNotifications', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Goal Completions</label>
                  <p className="text-sm text-netflix-gray-light">Celebrate when you achieve your wellness goals</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={preferences.enableGoalCompletionNotifications}
                    onChange={(e) => updatePreference('enableGoalCompletionNotifications', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Streak Achievements</label>
                  <p className="text-sm text-netflix-gray-light">Get recognized for maintaining wellness habits</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={preferences.enableStreakNotifications}
                    onChange={(e) => updatePreference('enableStreakNotifications', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Mood Pattern Insights</label>
                  <p className="text-sm text-netflix-gray-light">Receive insights about your mood patterns and trends</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={preferences.enableMoodPatternNotifications}
                    onChange={(e) => updatePreference('enableMoodPatternNotifications', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Delivery Methods */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-wellness-primary" />
              Delivery Methods
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-wellness-primary" />
                  <div>
                    <label className="text-white font-medium">Push Notifications</label>
                    <p className="text-sm text-netflix-gray-light">In-app notifications</p>
                  </div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={preferences.pushNotifications}
                    onChange={(e) => updatePreference('pushNotifications', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-wellness-primary" />
                  <div>
                    <label className="text-white font-medium">Email Notifications</label>
                    <p className="text-sm text-netflix-gray-light">Send notifications to your email (Coming Soon)</p>
                  </div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={preferences.emailNotifications}
                    onChange={(e) => updatePreference('emailNotifications', e.target.checked)}
                    disabled={true} // Disabled for now
                  />
                  <span className="slider opacity-50"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Timing & Frequency */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-wellness-primary" />
              Timing & Frequency
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">Notification Frequency</label>
                <div className="grid grid-cols-3 gap-3">
                  {['immediate', 'daily', 'weekly'].map((freq) => (
                    <motion.button
                      key={freq}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updatePreference('frequency', freq)}
                      className={`p-3 border-2 rounded-lg transition-all duration-200 ${
                        preferences.frequency === freq
                          ? 'border-wellness-primary bg-wellness-primary/20 text-white'
                          : 'border-netflix-gray-dark hover:border-netflix-gray-medium text-netflix-gray-light'
                      }`}
                    >
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Minimum Score Change Threshold: {preferences.minScoreChangeThreshold}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={preferences.minScoreChangeThreshold}
                  onChange={(e) => updatePreference('minScoreChangeThreshold', parseInt(e.target.value))}
                  className="w-full h-2 bg-netflix-gray-dark rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-netflix-gray-medium mt-1">
                  <span>1%</span>
                  <span>More Sensitive</span>
                  <span>20%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quiet Hours */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              {preferences.quietHours.enabled ? (
                <VolumeX className="w-5 h-5 text-wellness-primary" />
              ) : (
                <Volume className="w-5 h-5 text-wellness-primary" />
              )}
              Quiet Hours
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Enable Quiet Hours</label>
                  <p className="text-sm text-netflix-gray-light">Pause notifications during specific hours</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={preferences.quietHours.enabled}
                    onChange={(e) => updateQuietHours({ enabled: e.target.checked })}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              {preferences.quietHours.enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <label className="block text-white font-medium mb-2">Start Time</label>
                    <input
                      type="time"
                      value={preferences.quietHours.startTime}
                      onChange={(e) => updateQuietHours({ startTime: e.target.value })}
                      className="input-netflix w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">End Time</label>
                    <input
                      type="time"
                      value={preferences.quietHours.endTime}
                      onChange={(e) => updateQuietHours({ endTime: e.target.value })}
                      className="input-netflix w-full"
                    />
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Daily Reminders */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-wellness-primary" />
              Daily Reminders
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Enable Daily Check-ins</label>
                  <p className="text-sm text-netflix-gray-light">Remind me to log my mood daily</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={preferences.enableDailyReminders}
                    onChange={(e) => updatePreference('enableDailyReminders', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              {preferences.enableDailyReminders && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-center gap-4"
                >
                  <label className="text-white font-medium">Reminder Time:</label>
                  <input
                    type="time"
                    value={preferences.reminderTime}
                    onChange={(e) => updatePreference('reminderTime', e.target.value)}
                    className="input-netflix"
                  />
                </motion.div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-6 border-t border-netflix-gray-dark">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving}
              className="btn-wellness flex items-center gap-2 px-6 py-3"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving...' : 'Save Preferences'}
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Settings className="w-12 h-12 mx-auto mb-4 text-netflix-gray-medium" />
            <p className="text-netflix-gray-light">Failed to load notification preferences</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default NotificationSettings;
