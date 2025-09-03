'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User, Phone, Home, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { RegisterData } from '@/types';

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const { register: registerUser } = useAuth();
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<RegisterData>();

  const watchedRole = watch('role');

  const onSubmit = async (data: RegisterData) => {
    setIsLoading(true);
    
    try {
      const result = await registerUser(data);
      
      if (result.success) {
        toast.success('Account created successfully!');
        router.push('/dashboard');
      } else {
        toast.error(result.error || 'Registration failed');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => setStep(2);
  const prevStep = () => setStep(1);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  return (
    <div className="min-h-screen bg-netflix-black flex items-center justify-center px-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-netflix-black via-netflix-black-light to-netflix-gray-dark opacity-50" />
      
      {/* Back to home */}
      <Link href="/" className="absolute top-6 left-6 z-20">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-2 text-netflix-gray-light hover:text-white transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </motion.button>
      </Link>

      {/* Register Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="card-netflix">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-white mb-2">Join Our Community</h1>
            <p className="text-netflix-gray-light">Create your wellness account</p>
            <div className="flex justify-center space-x-2 mt-4">
              <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${step === 1 ? 'bg-wellness-primary' : 'bg-netflix-gray-dark'}`} />
              <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${step === 2 ? 'bg-wellness-primary' : 'bg-netflix-gray-dark'}`} />
            </div>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="relative overflow-hidden">
              <AnimatePresence mode="wait" custom={step}>
                {step === 1 && (
                  <motion.div
                    key="step1"
                    custom={step}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "tween", duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Role Selection */}
                    <div>
                      <label className="block text-sm font-medium text-netflix-gray-light mb-3">
                        I am a...
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['student', 'counselor', 'admin'] as const).map((role) => (
                          <motion.label
                            key={role}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="cursor-pointer"
                          >
                            <input
                              {...register('role', { required: 'Please select your role' })}
                              type="radio"
                              value={role}
                              className="sr-only"
                            />
                            <div className={`p-3 border-2 rounded-lg text-center transition-all duration-200 ${
                              watchedRole === role 
                                ? 'border-wellness-primary bg-wellness-primary/10 text-wellness-primary' 
                                : 'border-netflix-gray-medium text-netflix-gray-light hover:border-netflix-gray-light'
                            }`}>
                              <div className="text-sm font-medium capitalize">{role}</div>
                            </div>
                          </motion.label>
                        ))}
                      </div>
                      {errors.role && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-netflix-red text-sm mt-1"
                        >
                          {errors.role.message}
                        </motion.p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-netflix-gray-medium" />
                        <input
                          {...register('email', { 
                            required: 'Email is required',
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: 'Invalid email address'
                            }
                          })}
                          type="email"
                          className="input-netflix pl-12 w-full"
                          placeholder="your.email@university.edu"
                        />
                      </div>
                      {errors.email && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-netflix-red text-sm mt-1"
                        >
                          {errors.email.message}
                        </motion.p>
                      )}
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-netflix-gray-medium" />
                        <input
                          {...register('password', { 
                            required: 'Password is required',
                            minLength: {
                              value: 8,
                              message: 'Password must be at least 8 characters'
                            },
                            pattern: {
                              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                              message: 'Password must contain uppercase, lowercase, and number'
                            }
                          })}
                          type={showPassword ? 'text' : 'password'}
                          className="input-netflix pl-12 pr-12 w-full"
                          placeholder="Create a secure password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-netflix-gray-medium hover:text-white transition-colors duration-200"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.password && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-netflix-red text-sm mt-1"
                        >
                          {errors.password.message}
                        </motion.p>
                      )}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={nextStep}
                      className="w-full btn-wellness py-4 text-lg flex items-center justify-center space-x-2"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-5 h-5" />
                    </motion.button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    custom={step}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "tween", duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                          First Name
                        </label>
                        <input
                          {...register('firstName', { required: 'First name is required' })}
                          className="input-netflix w-full"
                          placeholder="John"
                        />
                        {errors.firstName && (
                          <p className="text-netflix-red text-sm mt-1">{errors.firstName.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                          Last Name
                        </label>
                        <input
                          {...register('lastName', { required: 'Last name is required' })}
                          className="input-netflix w-full"
                          placeholder="Doe"
                        />
                        {errors.lastName && (
                          <p className="text-netflix-red text-sm mt-1">{errors.lastName.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Conditional Fields based on role */}
                    {watchedRole === 'student' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                              Hostel Name
                            </label>
                            <input
                              {...register('hostelName')}
                              className="input-netflix w-full"
                              placeholder="North Hall"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                              Room Number
                            </label>
                            <input
                              {...register('roomNumber')}
                              className="input-netflix w-full"
                              placeholder="101A"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                        Phone Number (Optional)
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-netflix-gray-medium" />
                        <input
                          {...register('phone')}
                          type="tel"
                          className="input-netflix pl-12 w-full"
                          placeholder="+1234567890"
                        />
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex space-x-4">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={prevStep}
                        className="flex-1 btn-wellness-outline py-4 text-lg"
                      >
                        Back
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 btn-wellness py-4 text-lg relative overflow-hidden"
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="spinner w-5 h-5" />
                            <span>Creating...</span>
                          </div>
                        ) : (
                          'Create Account'
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </form>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-8 text-center"
          >
            <p className="text-netflix-gray-light">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-wellness-primary hover:text-wellness-secondary transition-colors duration-200 font-medium">
                Sign in here
              </Link>
            </p>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -top-10 -right-10 w-20 h-20 border border-wellness-secondary/20 rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-10 -left-10 w-16 h-16 border border-wellness-primary/20 rounded-full"
        />
      </motion.div>
    </div>
  );
};

export default RegisterPage;
