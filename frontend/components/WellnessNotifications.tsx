'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  Check, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Award,
  Heart,
  CheckCircle,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import {
  getNotificationsForUser,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  type WellnessNotification
} from '@/lib/api/wellness-notifications';

interface WellnessNotificationsProps {
  className?: string;
  showBadge?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const WellnessNotifications: React.FC<WellnessNotificationsProps> = ({ 
  className = '', 
  showBadge = true,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<WellnessNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userNotifications = await getNotificationsForUser(user.id, 20);
      const unread = await getUnreadNotificationCount(user.id);
      
      // Check for new notifications
      if (userNotifications.length > lastNotificationCount && lastNotificationCount > 0) {
        setHasNewNotifications(true);
        // Reset the animation after a delay
        setTimeout(() => setHasNewNotifications(false), 3000);
      }
      
      setNotifications(userNotifications);
      setUnreadCount(unread);
      setLastNotificationCount(userNotifications.length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user, lastNotificationCount]);

  // Initial load
  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user, loadNotifications]);

  // Auto-refresh notifications
  useEffect(() => {
    if (user && autoRefresh) {
      intervalRef.current = setInterval(() => {
        loadNotifications();
      }, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [user, autoRefresh, refreshInterval, loadNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    const success = await markNotificationAsRead(notificationId);
    if (success) {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    
    const success = await markAllNotificationsAsRead(user.id);
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    const success = await deleteNotification(notificationId);
    if (success) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const deletedNotification = notifications.find(n => n.id === notificationId);
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  const handleRefreshNotifications = () => {
    loadNotifications();
  };

  const getNotificationIcon = (notification: WellnessNotification) => {
    switch (notification.type) {
      case 'improvement':
        return <TrendingUp className="w-5 h-5 text-wellness-success" />;
      case 'milestone':
        return <Award className="w-5 h-5 text-wellness-warning" />;
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-netflix-red" />;
      case 'decline':
        return <TrendingDown className="w-5 h-5 text-wellness-info" />;
      default:
        return <Heart className="w-5 h-5 text-wellness-primary" />;
    }
  };

  const getPriorityColor = (priority: WellnessNotification['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-netflix-red';
      case 'medium':
        return 'border-l-wellness-warning';
      case 'low':
      default:
        return 'border-l-wellness-primary';
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  if (!user) return null;

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-netflix-gray-light hover:text-white transition-colors duration-200"
      >
        <motion.div
          animate={hasNewNotifications ? { rotate: [0, -10, 10, -5, 5, 0] } : {}}
          transition={{ duration: 0.6 }}
        >
          <Bell className="w-6 h-6" />
        </motion.div>
        
        {/* Badge */}
        {showBadge && unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ 
              scale: 1,
              ...(hasNewNotifications && { 
                scale: [1, 1.2, 1],
                backgroundColor: ['#e50914', '#ff6b6b', '#e50914']
              })
            }}
            transition={{ duration: hasNewNotifications ? 0.6 : 0.2 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-netflix-red rounded-full flex items-center justify-center"
          >
            <span className="text-xs font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </motion.div>
        )}
      </motion.button>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-netflix-black-light border border-netflix-gray-dark rounded-lg shadow-xl z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-netflix-gray-dark">
              <h3 className="text-lg font-semibold text-white">Wellness Updates</h3>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleRefreshNotifications}
                  disabled={loading}
                  className="text-xs text-netflix-gray-light hover:text-wellness-primary transition-colors disabled:opacity-50"
                  title="Refresh notifications"
                >
                  <motion.div
                    animate={loading ? { rotate: 360 } : {}}
                    transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: "linear" }}
                  >
                    🔄
                  </motion.div>
                </motion.button>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-wellness-primary hover:text-wellness-secondary transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-netflix-gray-light hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="spinner w-6 h-6" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center p-8 text-netflix-gray-light">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No wellness notifications yet</p>
                  <p className="text-sm mt-1">Keep tracking your mood to get personalized insights!</p>
                </div>
              ) : (
                <div className="divide-y divide-netflix-gray-dark">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 border-l-4 ${getPriorityColor(notification.priority)} ${
                        notification.read ? 'bg-transparent' : 'bg-wellness-primary/5'
                      } hover:bg-netflix-gray-dark/20 transition-colors cursor-pointer`}
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        {getNotificationIcon(notification)}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className={`text-sm font-medium ${
                              notification.read ? 'text-netflix-gray-light' : 'text-white'
                            }`}>
                              {notification.title}
                            </h4>
                            
                            {!notification.read && (
                              <div className="w-2 h-2 bg-wellness-primary rounded-full flex-shrink-0" />
                            )}
                          </div>
                          
                          <p className={`text-xs mt-1 ${
                            notification.read ? 'text-netflix-gray-medium' : 'text-netflix-gray-light'
                          }`}>
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-netflix-gray-medium">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                            
                            {notification.scoreChange !== 0 && (
                              <div className={`text-xs px-2 py-1 rounded-full ${
                                notification.scoreChange > 0 
                                  ? 'bg-wellness-success/20 text-wellness-success'
                                  : 'bg-wellness-info/20 text-wellness-info'
                              }`}>
                                {notification.scoreChange > 0 ? '+' : ''}{notification.scoreChange} pts
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                              className="text-netflix-gray-medium hover:text-wellness-primary transition-colors"
                              title="Mark as read"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </motion.button>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(notification.id);
                            }}
                            className="text-netflix-gray-medium hover:text-netflix-red transition-colors"
                            title="Delete notification"
                          >
                            <Trash2 className="w-3 h-3" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-netflix-gray-dark bg-netflix-black-light/50">
                <p className="text-xs text-center text-netflix-gray-medium">
                  Showing recent wellness notifications
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WellnessNotifications;
