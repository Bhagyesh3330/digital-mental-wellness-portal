'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Shield, Users, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const HomePage = () => {
  const features = [
    {
      icon: Heart,
      title: 'Mental Wellness Tracking',
      description: 'Track your daily mood, energy levels, and overall mental health progress'
    },
    {
      icon: Users,
      title: 'Professional Counseling',
      description: 'Connect with licensed counselors for personalized support and guidance'
    },
    {
      icon: Shield,
      title: 'Safe & Secure',
      description: 'Your mental health data is protected with enterprise-grade security'
    },
    {
      icon: TrendingUp,
      title: 'Progress Analytics',
      description: 'Visualize your wellness journey with detailed insights and trends'
    }
  ];

  return (
    <div className="min-h-screen bg-netflix-black">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative min-h-screen flex items-center justify-center"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-netflix-black via-netflix-black-light to-netflix-gray-dark opacity-90" />
        
        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold mb-6 text-gradient-wellness"
          >
            Digital Mental Wellness Portal
          </motion.h1>
          
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-xl md:text-2xl text-netflix-gray-light mb-8 max-w-2xl mx-auto"
          >
            Supporting student mental health with professional counseling, wellness tracking, and community resources
          </motion.p>
          
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="space-x-4"
          >
            <Link href="/auth/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-netflix text-lg px-12 py-4 glow-netflix"
              >
                Get Started
              </motion.button>
            </Link>
            
            <Link href="/auth/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-netflix-outline text-lg px-12 py-4"
              >
                Sign Up
              </motion.button>
            </Link>
          </motion.div>
        </div>

        {/* Floating particles animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-wellness-primary rounded-full opacity-20"
              animate={{
                x: [0, 100, 0],
                y: [0, -100, 0],
              }}
              transition={{
                duration: 10 + i * 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                left: `${10 + i * 15}%`,
                top: `${20 + i * 10}%`
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 px-4 max-w-6xl mx-auto"
      >
        <h2 className="text-4xl font-bold text-center mb-16 text-white">
          Why Choose Our Platform?
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              whileHover={{ scale: 1.05, rotate: 1 }}
              viewport={{ once: true }}
              className="card-wellness text-center group cursor-pointer"
            >
              <feature.icon className="w-12 h-12 mx-auto mb-4 text-wellness-primary group-hover:text-wellness-secondary transition-colors duration-300" />
              <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
              <p className="text-netflix-gray-light leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 px-4 text-center bg-gradient-to-r from-wellness-primary/10 to-wellness-secondary/10"
      >
        <h2 className="text-4xl font-bold mb-6 text-white">
          Start Your Wellness Journey Today
        </h2>
        <p className="text-xl text-netflix-gray-light mb-8 max-w-2xl mx-auto">
          Join thousands of students who have found support, guidance, and community through our platform
        </p>
        
        <Link href="/auth/register">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-wellness text-xl px-16 py-5 glow-wellness"
          >
            Join Now - It's Free
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
};

export default HomePage;
