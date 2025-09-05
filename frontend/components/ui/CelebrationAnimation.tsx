'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CelebrationAnimationProps {
  onComplete?: () => void;
}

export const CelebrationAnimation: React.FC<CelebrationAnimationProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animationType, setAnimationType] = useState<'confetti' | 'fireworks' | 'sparkles' | 'motivation'>('confetti');
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component only renders on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleCelebration = (event: CustomEvent) => {
      setAnimationType(event.detail.type);
      setIsVisible(true);
      
      // Auto hide after animation
      setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 3000);
    };

    window.addEventListener('celebrationAnimation', handleCelebration as EventListener);
    
    return () => {
      window.removeEventListener('celebrationAnimation', handleCelebration as EventListener);
    };
  }, [onComplete]);

  const renderConfetti = () => {
    const confettiPieces = Array.from({ length: 50 }, (_, i) => (
      <motion.div
        key={`celebration-confetti-${i}`}
        initial={{
          x: typeof window !== 'undefined' ? Math.random() * window.innerWidth : Math.random() * 1000,
          y: -50,
          rotate: 0,
          scale: Math.random() * 0.5 + 0.5
        }}
        animate={{
          y: typeof window !== 'undefined' ? window.innerHeight + 50 : 850,
          rotate: Math.random() * 360,
          x: typeof window !== 'undefined' ? Math.random() * window.innerWidth * 0.5 + Math.random() * window.innerWidth * 0.5 : Math.random() * 500 + Math.random() * 500
        }}
        transition={{
          duration: Math.random() * 2 + 2,
          ease: "linear",
          delay: Math.random() * 1
        }}
        className={`absolute w-3 h-3 ${
          ['bg-wellness-primary', 'bg-wellness-success', 'bg-wellness-mood-good', 'bg-yellow-400', 'bg-pink-400'][Math.floor(Math.random() * 5)]
        } rounded-sm`}
        style={{
          transform: `rotate(${Math.random() * 45}deg)`
        }}
      />
    ));

    return <div className="absolute inset-0 pointer-events-none">{confettiPieces}</div>;
  };

  const renderFireworks = () => {
    const fireworks = Array.from({ length: 8 }, (_, i) => (
      <motion.div
        key={i}
        initial={{ scale: 0, opacity: 1 }}
        animate={{
          scale: [0, 1, 1.5],
          opacity: [1, 1, 0]
        }}
        transition={{
          duration: 1.5,
          delay: i * 0.2,
          ease: "easeOut"
        }}
        className="absolute"
        style={{
          left: `${20 + Math.random() * 60}%`,
          top: `${20 + Math.random() * 40}%`,
        }}
      >
        <div className="relative">
          {Array.from({ length: 12 }, (_, j) => (
            <motion.div
              key={j}
              initial={{ scale: 0, x: 0, y: 0 }}
              animate={{
                scale: [0, 1, 0],
                x: Math.cos((j * 30) * Math.PI / 180) * 100,
                y: Math.sin((j * 30) * Math.PI / 180) * 100
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.2,
                ease: "easeOut"
              }}
              className={`absolute w-2 h-2 ${
                ['bg-yellow-400', 'bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400'][Math.floor(Math.random() * 5)]
              } rounded-full`}
            />
          ))}
        </div>
      </motion.div>
    ));

    return <>{fireworks}</>;
  };

  const renderSparkles = () => {
    const sparkles = Array.from({ length: 30 }, (_, i) => (
      <motion.div
        key={i}
        initial={{
          scale: 0,
          opacity: 0,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight
        }}
        animate={{
          scale: [0, 1, 0],
          opacity: [0, 1, 0],
          rotate: 360
        }}
        transition={{
          duration: 2,
          delay: Math.random() * 1,
          ease: "easeInOut"
        }}
        className="absolute"
      >
        <div className="relative w-6 h-6">
          <div className="absolute inset-0 bg-yellow-300 transform rotate-45" style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
        </div>
      </motion.div>
    ));

    return <>{sparkles}</>;
  };

  const renderMotivation = () => {
    const motivationalElements = Array.from({ length: 20 }, (_, i) => (
      <motion.div
        key={`motivation-${i}`}
        initial={{
          scale: 0,
          opacity: 0,
          x: typeof window !== 'undefined' ? Math.random() * window.innerWidth : Math.random() * 1000,
          y: typeof window !== 'undefined' ? Math.random() * window.innerHeight : Math.random() * 800,
        }}
        animate={{
          scale: [0, 1, 1, 0],
          opacity: [0, 0.8, 0.8, 0],
          y: [0, -30, -60, -100],
        }}
        transition={{
          duration: 3,
          delay: Math.random() * 1.5,
          ease: "easeOut"
        }}
        className="absolute"
      >
        <div className={`w-8 h-8 rounded-full ${
          ['bg-amber-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-blue-400', 'bg-purple-400'][Math.floor(Math.random() * 6)]
        } opacity-70 shadow-lg`}>
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-full h-full rounded-full bg-white/30"
          />
        </div>
      </motion.div>
    ));

    // Add some gentle floating hearts
    const hearts = Array.from({ length: 8 }, (_, i) => (
      <motion.div
        key={`heart-${i}`}
        initial={{
          scale: 0,
          opacity: 0,
          x: typeof window !== 'undefined' ? Math.random() * window.innerWidth : Math.random() * 1000,
          y: typeof window !== 'undefined' ? window.innerHeight + 50 : 850,
        }}
        animate={{
          scale: [0, 1, 1],
          opacity: [0, 1, 0],
          y: -100,
          x: Math.random() * 100 - 50, // Slight horizontal drift
        }}
        transition={{
          duration: 4,
          delay: Math.random() * 2,
          ease: "easeOut"
        }}
        className="absolute text-2xl"
      >
        💝
      </motion.div>
    ));

    return (
      <div className="absolute inset-0 pointer-events-none">
        {motivationalElements}
        {hearts}
      </div>
    );
  };

  // Don't render on server side
  if (!isMounted) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
        >
          {animationType === 'confetti' && renderConfetti()}
          {animationType === 'fireworks' && renderFireworks()}
          {animationType === 'sparkles' && renderSparkles()}
          {animationType === 'motivation' && renderMotivation()}
          
          {/* Central celebration burst */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
          >
            <div className="text-8xl">
              {animationType === 'confetti' && '🎉'}
              {animationType === 'fireworks' && '🎆'}
              {animationType === 'sparkles' && '✨'}
              {animationType === 'motivation' && '💪'}
            </div>
          </motion.div>

          {/* Celebration text */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-20"
          >
            <div className={`text-4xl font-bold text-white text-center ${
              animationType === 'motivation' 
                ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 bg-clip-text text-transparent'
                : 'bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 bg-clip-text text-transparent'
            }`}>
              {animationType === 'motivation' ? 'Keep Going! You\'ve Got This!' : 'Awesome Achievement!'}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Achievement badge component for smaller celebrations
export const AchievementBadge: React.FC<{
  title: string;
  emoji: string;
  isVisible: boolean;
  onComplete?: () => void;
}> = ({ title, emoji, isVisible, onComplete }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, y: 100, opacity: 0 }}
          animate={{ 
            scale: [0, 1.2, 1],
            y: [100, -20, 0],
            opacity: [0, 1, 1]
          }}
          exit={{ 
            scale: 0.8,
            y: -50,
            opacity: 0
          }}
          transition={{ 
            duration: 0.8,
            ease: "easeOut"
          }}
          className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="bg-gradient-to-r from-wellness-primary to-wellness-success p-6 rounded-2xl shadow-2xl border-2 border-white/20">
            <div className="text-center">
              <motion.div
                animate={{ 
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 0.6,
                  delay: 0.2
                }}
                className="text-4xl mb-2"
              >
                {emoji}
              </motion.div>
              <div className="text-white font-bold text-lg">
                {title}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CelebrationAnimation;
