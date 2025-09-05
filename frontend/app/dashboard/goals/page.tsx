'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  Target, 
  Plus, 
  CheckCircle, 
  Circle, 
  Calendar, 
  TrendingUp, 
  Award,
  Edit3,
  Trash2,
  Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/context/AuthContext';
import { goalsApi, CreateGoalData, UpdateProgressData } from '@/lib/api/goals';
import { WellnessGoal } from '@/types';
import { triggerGoalCompletionAppreciation } from '@/lib/utils/appreciation-notifications';
import { analyzeDailyWellnessAndAnimate } from '@/lib/utils/daily-wellness-analyzer';

const GoalsPage = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<WellnessGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<WellnessGoal | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);

  const {
    register: registerGoal,
    handleSubmit: handleGoalSubmit,
    formState: { errors: goalErrors },
    reset: resetGoalForm
  } = useForm<CreateGoalData>();

  const {
    register: registerProgress,
    handleSubmit: handleProgressSubmit,
    formState: { errors: progressErrors },
    reset: resetProgressForm
  } = useForm<UpdateProgressData>();

  // Fetch goals on component mount
  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  const fetchGoals = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await goalsApi.getGoalsByUser(user.id);
      if (response.success && response.data) {
        setGoals(response.data.goals);
      } else {
        toast.error(response.error || 'Failed to fetch goals');
      }
    } catch (error) {
      toast.error('Failed to fetch goals');
    } finally {
      setIsLoading(false);
    }
  };

  const onCreateGoal = async (data: CreateGoalData) => {
    if (!user) {
      toast.error('User not logged in');
      return;
    }
    
    try {
      console.log('Creating goal with data:', data);
      const goalData = { ...data, userId: user.id };
      const response = await goalsApi.createGoal(goalData);
      console.log('Goal creation response:', response);
      
      if (response.success && response.data) {
        toast.success('Goal created successfully!');
        setGoals(prev => [response.data!.goal, ...prev]);
        resetGoalForm();
        setShowCreateForm(false);
      } else {
        console.error('Goal creation failed:', response);
        // Show detailed error if available
        if (response.details && Array.isArray(response.details)) {
          const errorMessages = response.details.map((detail: any) => detail.msg || detail.message).join(', ');
          toast.error(`Validation failed: ${errorMessages}`);
        } else {
          toast.error(response.error || 'Failed to create goal');
        }
      }
    } catch (error) {
      console.error('Goal creation error:', error);
      toast.error('Failed to create goal');
    }
  };

  const onUpdateProgress = async (data: UpdateProgressData) => {
    if (!selectedGoal || !user) return;

    try {
      const wasCompleted = selectedGoal.isCompleted;
      const willBeCompleted = data.progress_percentage >= 100;
      
      const response = await goalsApi.updateProgress(selectedGoal.id, data);
      if (response.success) {
        // Check if goal was just completed
        if (!wasCompleted && willBeCompleted) {
          // Trigger immediate goal completion appreciation with celebration
          await triggerGoalCompletionAppreciation(
            user.id,
            selectedGoal.title,
            'general', // Default category since WellnessGoal doesn't have category field
            true, // Show toast notifications
            true  // Enable celebration animations
          );
          
          // Also trigger comprehensive wellness analysis with enhanced animations
          await analyzeDailyWellnessAndAnimate(
            user.id,
            {
              goalCompleted: {
                title: selectedGoal.title,
                type: 'wellness'
              }
            }
          );
        }
        
        toast.success(willBeCompleted ? 'Goal completed! 🎉' : 'Progress updated successfully!');
        
        // Update the goal in the local state
        setGoals(prev => prev.map(goal => 
          goal.id === selectedGoal.id 
            ? { ...goal, progressPercentage: data.progress_percentage, isCompleted: willBeCompleted }
            : goal
        ));
        resetProgressForm();
        setShowProgressModal(false);
        setSelectedGoal(null);
      } else {
        toast.error(response.error || 'Failed to update progress');
      }
    } catch (error) {
      toast.error('Failed to update progress');
    }
  };

  const openProgressModal = (goal: WellnessGoal) => {
    setSelectedGoal(goal);
    resetProgressForm();
    setShowProgressModal(true);
  };

  const completedGoals = goals.filter(goal => goal.isCompleted);
  const activeGoals = goals.filter(goal => !goal.isCompleted);

  if (isLoading) {
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
              <Target className="w-8 h-8 text-wellness-primary" />
              Wellness Goals
            </h1>
            <p className="text-netflix-gray-light mt-2">
              Set and track your personal wellness journey
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateForm(true)}
            className="btn-wellness px-6 py-3 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Goal
          </motion.button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card-netflix p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-netflix-gray-light text-sm mb-1">Total Goals</p>
                <p className="text-3xl font-bold text-white">{goals.length}</p>
              </div>
              <Target className="w-12 h-12 text-wellness-primary" />
            </div>
          </div>

          <div className="card-netflix p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-netflix-gray-light text-sm mb-1">Active Goals</p>
                <p className="text-3xl font-bold text-wellness-secondary">{activeGoals.length}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-wellness-secondary" />
            </div>
          </div>

          <div className="card-netflix p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-netflix-gray-light text-sm mb-1">Completed</p>
                <p className="text-3xl font-bold text-wellness-success">{completedGoals.length}</p>
              </div>
              <Award className="w-12 h-12 text-wellness-success" />
            </div>
          </div>
        </div>

        {/* Goals Lists */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Active Goals */}
          <div>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-wellness-secondary" />
              Active Goals ({activeGoals.length})
            </h2>
            
            {activeGoals.length > 0 ? (
              <div className="space-y-4">
                {activeGoals.map((goal, index) => (
                  <GoalCard 
                    key={goal.id} 
                    goal={goal} 
                    index={index}
                    onUpdateProgress={openProgressModal}
                  />
                ))}
              </div>
            ) : (
              <div className="card-netflix p-8 text-center">
                <Target className="w-16 h-16 text-netflix-gray-medium mx-auto mb-4" />
                <p className="text-netflix-gray-light mb-4">No active goals yet</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="btn-wellness-outline px-4 py-2"
                >
                  Create Your First Goal
                </button>
              </div>
            )}
          </div>

          {/* Completed Goals */}
          <div>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-wellness-success" />
              Completed Goals ({completedGoals.length})
            </h2>
            
            {completedGoals.length > 0 ? (
              <div className="space-y-4">
                {completedGoals.map((goal, index) => (
                  <GoalCard 
                    key={goal.id} 
                    goal={goal} 
                    index={index}
                    isCompleted
                  />
                ))}
              </div>
            ) : (
              <div className="card-netflix p-8 text-center">
                <Award className="w-16 h-16 text-netflix-gray-medium mx-auto mb-4" />
                <p className="text-netflix-gray-light">No completed goals yet</p>
                <p className="text-sm text-netflix-gray-medium mt-2">
                  Keep working on your active goals!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Create Goal Modal */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowCreateForm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="card-netflix p-6 w-full max-w-md"
              >
                <h3 className="text-xl font-bold text-white mb-6">Create New Goal</h3>
                
                <form onSubmit={handleGoalSubmit(onCreateGoal)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                      Goal Title *
                    </label>
                    <input
                      {...registerGoal('title', { 
                        required: 'Goal title is required',
                        minLength: { value: 3, message: 'Title must be at least 3 characters' },
                        maxLength: { value: 200, message: 'Title must not exceed 200 characters' }
                      })}
                      className="input-netflix w-full"
                      placeholder="e.g., Exercise 3 times a week"
                    />
                    {goalErrors.title && (
                      <p className="text-netflix-red text-sm mt-1">{goalErrors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      {...registerGoal('description')}
                      className="input-netflix w-full h-24 resize-none"
                      placeholder="Describe your goal in more detail..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                      Target Date (Optional)
                    </label>
                    <input
                      {...registerGoal('target_date')}
                      type="date"
                      className="input-netflix w-full"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 btn-wellness-outline py-3"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 btn-wellness py-3"
                    >
                      Create Goal
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Update Modal */}
        <AnimatePresence>
          {showProgressModal && selectedGoal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowProgressModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="card-netflix p-6 w-full max-w-md"
              >
                <h3 className="text-xl font-bold text-white mb-2">Update Progress</h3>
                <p className="text-netflix-gray-light mb-6">{selectedGoal.title}</p>
                
                <form onSubmit={handleProgressSubmit(onUpdateProgress)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                      Progress Percentage *
                    </label>
                    <input
                      {...registerProgress('progress_percentage', { 
                        required: 'Progress percentage is required',
                        min: { value: 0, message: 'Progress cannot be less than 0%' },
                        max: { value: 100, message: 'Progress cannot exceed 100%' },
                        valueAsNumber: true
                      })}
                      type="number"
                      min="0"
                      max="100"
                      className="input-netflix w-full"
                      placeholder="0-100"
                      defaultValue={selectedGoal.progressPercentage}
                    />
                    {progressErrors.progress_percentage && (
                      <p className="text-netflix-red text-sm mt-1">{progressErrors.progress_percentage.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                      Progress Note (Optional)
                    </label>
                    <textarea
                      {...registerProgress('progress_note')}
                      className="input-netflix w-full h-24 resize-none"
                      placeholder="What progress have you made?"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowProgressModal(false)}
                      className="flex-1 btn-wellness-outline py-3"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 btn-wellness py-3"
                    >
                      Update Progress
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

// Goal Card Component
const GoalCard: React.FC<{ 
  goal: WellnessGoal; 
  index: number; 
  isCompleted?: boolean;
  onUpdateProgress?: (goal: WellnessGoal) => void;
}> = ({ goal, index, isCompleted = false, onUpdateProgress }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="card-netflix p-6 hover:bg-netflix-black-light transition-colors duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          {isCompleted ? (
            <CheckCircle className="w-6 h-6 text-wellness-success mt-1 flex-shrink-0" />
          ) : (
            <Circle className="w-6 h-6 text-netflix-gray-medium mt-1 flex-shrink-0" />
          )}
          <div className="flex-1">
            <h3 className={`text-lg font-semibold mb-2 ${isCompleted ? 'text-wellness-success line-through' : 'text-white'}`}>
              {goal.title}
            </h3>
            {goal.description && (
              <p className="text-netflix-gray-light text-sm mb-3">{goal.description}</p>
            )}
          </div>
        </div>
        
        {!isCompleted && onUpdateProgress && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onUpdateProgress(goal)}
            className="btn-wellness-outline px-3 py-1 text-sm flex items-center gap-1"
          >
            <Edit3 className="w-4 h-4" />
            Update
          </motion.button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-netflix-gray-light">Progress</span>
          <span className="text-sm font-medium text-white">{goal.progressPercentage}%</span>
        </div>
        <div className="w-full bg-netflix-gray-dark rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${goal.progressPercentage}%` }}
            transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
            className={`h-2 rounded-full ${isCompleted ? 'bg-wellness-success' : 'bg-wellness-primary'}`}
          />
        </div>
      </div>

      {/* Target Date */}
      {goal.targetDate && (
        <div className="flex items-center gap-2 text-sm text-netflix-gray-light">
          <Calendar className="w-4 h-4" />
          Target: {new Date(goal.targetDate).toLocaleDateString()}
        </div>
      )}
    </motion.div>
  );
};

export default GoalsPage;
