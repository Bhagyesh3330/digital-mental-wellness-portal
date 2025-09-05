'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimationEvent {
  type: 'celebration' | 'motivation' | 'combo' | 'streak';
  subType: 'goal_complete' | 'good_mood' | 'good_sleep' | 'goal_incomplete' | 'low_mood' | 'poor_sleep' | 'mixed_day';
  data?: {
    goalTitle?: string;
    moodLevel?: string;
    sleepHours?: number;
    streakCount?: number;
    achievements?: string[];
    message?: string;
  };
}

interface WellnessAnimationsProps {
  onComplete?: () => void;
}

export const WellnessAnimations: React.FC<WellnessAnimationsProps> = ({ onComplete }) => {
  const [activeAnimation, setActiveAnimation] = useState<AnimationEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component only renders on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleWellnessAnimation = (event: CustomEvent<AnimationEvent>) => {
      setActiveAnimation(event.detail);
      setIsVisible(true);
      
      // Auto hide after animation based on type
      const duration = event.detail.type === 'combo' ? 5000 : 
                      event.detail.type === 'streak' ? 4000 : 3500;
      
      setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, duration);
    };

    window.addEventListener('wellnessAnimation', handleWellnessAnimation as EventListener);
    
    return () => {
      window.removeEventListener('wellnessAnimation', handleWellnessAnimation as EventListener);
    };
  }, [onComplete]);

  // Celebration animations for achievements
  const renderCelebrationAnimation = () => {
    if (!activeAnimation || activeAnimation.type !== 'celebration') return null;

    const { subType, data } = activeAnimation;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden bg-black/20"
      >
        {/* Celebration confetti */}
        {renderCelebrationConfetti()}
        
        {/* Main celebration display */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
        >
          <div className="text-center bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 p-8 rounded-3xl shadow-2xl border-4 border-white/30">
            {/* Achievement Icon */}
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 1,
                repeat: 2
              }}
              className="text-8xl mb-4"
            >
              {getAchievementEmoji(subType)}
            </motion.div>
            
            {/* Achievement Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold text-white mb-4 drop-shadow-lg"
            >
              {getAchievementTitle(subType, data)}
            </motion.h2>
            
            {/* Achievement Message */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-xl text-white/90 max-w-lg mx-auto"
            >
              {getAchievementMessage(subType, data)}
            </motion.p>
          </div>
        </motion.div>

        {/* Floating particles */}
        {renderFloatingParticles('celebration')}
      </motion.div>
    );
  };

  // Motivation animations for incomplete goals or low moods
  const renderMotivationAnimation = () => {
    if (!activeAnimation || activeAnimation.type !== 'motivation') return null;

    const { subType, data } = activeAnimation;
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden bg-gradient-to-b from-blue-900/30 to-purple-900/30"
      >
        {/* Gentle encouraging particles */}
        {renderFloatingParticles('motivation')}
        
        {/* Main motivation display */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
        >
          <div className="text-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-8 rounded-3xl shadow-2xl border-4 border-white/20">
            {/* Motivation Icon with gentle animation */}
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-8xl mb-4"
            >
              {getMotivationEmoji(subType)}
            </motion.div>
            
            {/* Motivation Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold text-white mb-4 drop-shadow-lg"
            >
              {getMotivationTitle(subType)}
            </motion.h2>
            
            {/* Motivation Message */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-xl text-white/90 max-w-lg mx-auto mb-4"
            >
              {getMotivationMessage(subType, data)}
            </motion.p>

            {/* Encouraging action buttons (visual only) */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
              className="flex justify-center space-x-4"
            >
              <div className="bg-white/20 px-4 py-2 rounded-full text-white font-semibold">
                You've got this! 💪
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Combo achievement animations
  const renderComboAnimation = () => {
    if (!activeAnimation || activeAnimation.type !== 'combo') return null;

    const { data } = activeAnimation;
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden bg-gradient-to-r from-yellow-400/20 via-red-500/20 to-pink-600/20"
      >
        {/* Epic confetti burst */}
        {renderEpicConfetti()}
        
        {/* Combo achievement display */}
        <motion.div
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          exit={{ scale: 0, rotate: 180, opacity: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
        >
          <div className="text-center bg-gradient-to-r from-yellow-400 via-red-500 to-pink-600 p-10 rounded-3xl shadow-2xl border-4 border-white/50">
            {/* Epic Achievement Icon */}
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.3, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: 1
              }}
              className="text-9xl mb-6"
            >
              🏆
            </motion.div>
            
            {/* Combo Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl font-bold text-white mb-6 drop-shadow-lg"
            >
              WELLNESS COMBO!
            </motion.h1>
            
            {/* Achievement List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-2 mb-6"
            >
              {data?.achievements?.map((achievement, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.2 }}
                  className="flex items-center justify-center space-x-2 text-white text-lg"
                >
                  <span>✅</span>
                  <span>{achievement}</span>
                </motion.div>
              ))}
            </motion.div>
            
            {/* Combo Message */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="text-2xl text-white/95 font-semibold"
            >
              You're unstoppable! 🚀
            </motion.p>
          </div>
        </motion.div>

        {/* Side sparkles */}
        {renderSideSparkles()}
      </motion.div>
    );
  };

  // Streak achievement animations
  const renderStreakAnimation = () => {
    if (!activeAnimation || activeAnimation.type !== 'streak') return null;

    const { data } = activeAnimation;
    const streakCount = data?.streakCount || 0;
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden bg-gradient-to-r from-purple-600/20 to-blue-600/20"
      >
        {/* Streak fire effect */}
        {renderStreakFire()}
        
        {/* Streak display */}
        <motion.div
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -200, opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
        >
          <div className="text-center bg-gradient-to-r from-purple-600 to-blue-600 p-8 rounded-3xl shadow-2xl border-4 border-white/30">
            {/* Streak Icon */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 1.5,
                repeat: 2
              }}
              className="text-8xl mb-4"
            >
              🔥
            </motion.div>
            
            {/* Streak Count */}
            <motion.h2
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
              className="text-6xl font-bold text-white mb-4 drop-shadow-lg"
            >
              {streakCount} DAYS
            </motion.h2>
            
            {/* Streak Message */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-2xl text-white/90 max-w-md mx-auto"
            >
              Incredible streak! You're building amazing habits! 🌟
            </motion.p>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Helper functions for animations
  const renderCelebrationConfetti = () => {
    const confetti = Array.from({ length: 100 }, (_, i) => (
      <motion.div
        key={`confetti-${i}`}
        initial={{
          x: typeof window !== 'undefined' ? Math.random() * window.innerWidth : Math.random() * 1000,
          y: -100,
          rotate: 0,
          opacity: 1
        }}
        animate={{
          y: typeof window !== 'undefined' ? window.innerHeight + 100 : 1000,
          rotate: Math.random() * 720 - 360,
          opacity: 0.8
        }}
        transition={{
          duration: Math.random() * 3 + 2,
          ease: "easeOut",
          delay: Math.random() * 2
        }}
        className={`absolute w-4 h-4 ${
          ['bg-yellow-400', 'bg-green-400', 'bg-blue-400', 'bg-pink-400', 'bg-purple-400', 'bg-red-400'][Math.floor(Math.random() * 6)]
        } rounded-full shadow-lg`}
      />
    ));
    return <div className="absolute inset-0 pointer-events-none">{confetti}</div>;
  };

  const renderEpicConfetti = () => {
    const confetti = Array.from({ length: 200 }, (_, i) => (
      <motion.div
        key={`epic-confetti-${i}`}
        initial={{
          x: typeof window !== 'undefined' ? window.innerWidth / 2 : 500,
          y: typeof window !== 'undefined' ? window.innerHeight / 2 : 400,
          scale: 0,
          rotate: 0
        }}
        animate={{
          x: typeof window !== 'undefined' ? Math.random() * window.innerWidth : Math.random() * 1000,
          y: typeof window !== 'undefined' ? Math.random() * window.innerHeight : Math.random() * 800,
          scale: Math.random() * 2 + 0.5,
          rotate: Math.random() * 720
        }}
        transition={{
          duration: Math.random() * 2 + 1,
          ease: "easeOut",
          delay: Math.random() * 1
        }}
        className={`absolute w-6 h-6 ${
          ['bg-yellow-300', 'bg-orange-400', 'bg-red-400', 'bg-pink-400', 'bg-purple-400'][Math.floor(Math.random() * 5)]
        } rounded-full shadow-xl opacity-90`}
      />
    ));
    return <div className="absolute inset-0 pointer-events-none">{confetti}</div>;
  };

  const renderFloatingParticles = (type: 'celebration' | 'motivation') => {
    const colors = type === 'celebration' 
      ? ['bg-yellow-300', 'bg-green-300', 'bg-blue-300', 'bg-pink-300']
      : ['bg-blue-300', 'bg-purple-300', 'bg-indigo-300', 'bg-teal-300'];
    
    const particles = Array.from({ length: 30 }, (_, i) => (
      <motion.div
        key={`particle-${type}-${i}`}
        initial={{
          x: typeof window !== 'undefined' ? Math.random() * window.innerWidth : Math.random() * 1000,
          y: typeof window !== 'undefined' ? window.innerHeight + 50 : 850,
          opacity: 0
        }}
        animate={{
          y: -50,
          opacity: [0, 1, 0],
          scale: [0.5, 1, 0.5]
        }}
        transition={{
          duration: Math.random() * 4 + 3,
          ease: "linear",
          delay: Math.random() * 2,
          repeat: Infinity
        }}
        className={`absolute w-3 h-3 ${colors[Math.floor(Math.random() * colors.length)]} rounded-full opacity-60`}
      />
    ));
    return <div className="absolute inset-0 pointer-events-none">{particles}</div>;
  };

  const renderSideSparkles = () => {
    const sparkles = Array.from({ length: 20 }, (_, i) => (
      <motion.div
        key={`sparkle-${i}`}
        initial={{
          x: typeof window !== 'undefined' ? (i % 2 === 0 ? -50 : window.innerWidth + 50) : (i % 2 === 0 ? -50 : 1050),
          y: typeof window !== 'undefined' ? Math.random() * window.innerHeight : Math.random() * 800,
          scale: 0,
          opacity: 0
        }}
        animate={{
          x: typeof window !== 'undefined' ? (i % 2 === 0 ? window.innerWidth + 50 : -50) : (i % 2 === 0 ? 1050 : -50),
          scale: [0, 2, 0],
          opacity: [0, 1, 0]
        }}
        transition={{
          duration: 3,
          ease: "easeOut",
          delay: Math.random() * 2
        }}
        className="absolute text-4xl"
      >
        ⭐
      </motion.div>
    ));
    return <div className="absolute inset-0 pointer-events-none">{sparkles}</div>;
  };

  const renderStreakFire = () => {
    const flames = Array.from({ length: 15 }, (_, i) => (
      <motion.div
        key={`flame-${i}`}
        initial={{
          x: typeof window !== 'undefined' ? window.innerWidth / 2 + (Math.random() - 0.5) * 200 : 500 + (Math.random() - 0.5) * 200,
          y: typeof window !== 'undefined' ? window.innerHeight + 50 : 850,
          scale: 0
        }}
        animate={{
          y: typeof window !== 'undefined' ? window.innerHeight / 2 + 200 : 600,
          scale: [0, 2, 0],
          opacity: [0, 1, 0]
        }}
        transition={{
          duration: 2,
          ease: "easeOut",
          delay: i * 0.1
        }}
        className="absolute text-6xl"
      >
        🔥
      </motion.div>
    ));
    return <div className="absolute inset-0 pointer-events-none">{flames}</div>;
  };

  // Helper functions for content
  const getAchievementEmoji = (subType: string) => {
    switch (subType) {
      case 'goal_complete': return '🎯';
      case 'good_mood': return '😊';
      case 'good_sleep': return '😴';
      default: return '🎉';
    }
  };

  const getAchievementTitle = (subType: string, data?: any) => {
    switch (subType) {
      case 'goal_complete': return `Goal Achieved!`;
      case 'good_mood': return `Positive Vibes!`;
      case 'good_sleep': return `Sleep Champion!`;
      default: return 'Achievement Unlocked!';
    }
  };

  const getAchievementMessage = (subType: string, data?: any) => {
    switch (subType) {
      case 'goal_complete': return `"${data?.goalTitle || 'Your goal'}" completed! You're building incredible momentum!`;
      case 'good_mood': return `Your ${data?.moodLevel} mood is lighting up your wellness journey!`;
      case 'good_sleep': return `${data?.sleepHours} hours of quality sleep! Your mind and body are thanking you!`;
      default: return 'You\'re doing amazing! Keep up the great work!';
    }
  };

  const getMotivationEmoji = (subType: string) => {
    switch (subType) {
      case 'goal_incomplete': return '💪';
      case 'low_mood': return '🤗';
      case 'poor_sleep': return '🌙';
      default: return '❤️';
    }
  };

  const getMotivationTitle = (subType: string) => {
    switch (subType) {
      case 'goal_incomplete': return "Tomorrow's Your Day!";
      case 'low_mood': return "We Believe in You!";
      case 'poor_sleep': return "Rest is Important!";
      default: return "You're Not Alone!";
    }
  };

  const getMotivationMessage = (subType: string, data?: any) => {
    switch (subType) {
      case 'goal_incomplete': return `"${data?.goalTitle || 'Your goal'}" can wait for tomorrow. Progress isn't always linear, and that's perfectly okay!`;
      case 'low_mood': return `Having a tough day is completely normal. Your feelings are valid, and brighter days are coming!`;
      case 'poor_sleep': return `${data?.sleepHours || 'Not enough'} sleep last night? Let's prioritize rest tonight. Your wellness matters!`;
      default: return "Every small step counts. You're stronger than you know!";
    }
  };

  // Don't render on server side
  if (!isMounted) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <>
          {renderCelebrationAnimation()}
          {renderMotivationAnimation()}
          {renderComboAnimation()}
          {renderStreakAnimation()}
        </>
      )}
    </AnimatePresence>
  );
};

// Trigger functions for different scenarios
export const triggerCelebrationAnimation = (
  subType: 'goal_complete' | 'good_mood' | 'good_sleep',
  data?: any
) => {
  const event = new CustomEvent('wellnessAnimation', {
    detail: { type: 'celebration', subType, data }
  });
  window.dispatchEvent(event);
};

export const triggerMotivationAnimation = (
  subType: 'goal_incomplete' | 'low_mood' | 'poor_sleep',
  data?: any
) => {
  const event = new CustomEvent('wellnessAnimation', {
    detail: { type: 'motivation', subType, data }
  });
  window.dispatchEvent(event);
};

export const triggerComboAnimation = (achievements: string[]) => {
  const event = new CustomEvent('wellnessAnimation', {
    detail: { type: 'combo', subType: 'mixed_day', data: { achievements } }
  });
  window.dispatchEvent(event);
};

export const triggerStreakAnimation = (streakCount: number) => {
  const event = new CustomEvent('wellnessAnimation', {
    detail: { type: 'streak', subType: 'mixed_day', data: { streakCount } }
  });
  window.dispatchEvent(event);
};

export default WellnessAnimations;
