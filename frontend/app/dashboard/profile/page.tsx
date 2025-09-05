'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Edit, Save, X, Mail, Phone, Home, BookOpen, Calendar, Shield, Eye, EyeOff, UserCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { useAuth } from '@/lib/context/AuthContext';
import { profileApi, StudentProfile, CounselorProfile, UpdateProfileData } from '@/lib/api/profile';

const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | CounselorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Helper function for ordinal suffix (1st, 2nd, 3rd, etc.)
  const getOrdinalSuffix = (num: number): string => {
    const lastDigit = num % 10;
    const lastTwoDigits = num % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) return 'th';
    if (lastDigit === 1) return 'st';
    if (lastDigit === 2) return 'nd';
    if (lastDigit === 3) return 'rd';
    return 'th';
  };
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<UpdateProfileData>();

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword
  } = useForm<{ currentPassword: string; newPassword: string; confirmPassword: string }>();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    setIsLoading(true);
    console.log('User data from registration:', user);
    
    // Debug authentication
    const token = Cookies.get('auth_token');
    console.log('Auth token from cookies:', token ? 'Present' : 'Missing');
    
    try {
      let response;
      if (user?.role === 'student') {
        response = await profileApi.getStudentProfile();
      } else if (user?.role === 'counselor') {
        response = await profileApi.getCounselorProfile();
      }

      if (response?.success && response.data) {
        setProfile(response.data);
        // Pre-fill form with current data
        setValue('firstName', response.data.firstName);
        setValue('lastName', response.data.lastName);
        setValue('phone', response.data.phone || '');
        if ('hostelName' in response.data) {
          setValue('hostelName', response.data.hostelName || '');
          setValue('roomNumber', response.data.roomNumber || '');
        }
        // For students, ensure studentProfile always exists
        if (user?.role === 'student' && 'studentProfile' in response.data) {
          // If no studentProfile exists, create an empty one
          if (!response.data.studentProfile) {
            response.data.studentProfile = {
              studentId: user.id.toString().padStart(6, '0'),
              enrollmentNumber: '',
              course: '',
              department: '',
              yearOfStudy: 1,
              admissionYear: new Date().getFullYear(),
              dateOfBirth: '',
              guardianName: '',
              guardianContact: '',
              emergencyContact: '',
              emergencyRelation: '',
              permanentAddress: '',
              city: '',
              state: '',
              pinCode: '',
              bloodGroup: '',
              allergies: '',
              medicalConditions: ''
            };
          }
          
          setValue('profileData.studentId', response.data.studentProfile.studentId || user.id.toString().padStart(6, '0'));
          setValue('profileData.enrollmentNumber', response.data.studentProfile.enrollmentNumber || '');
          setValue('profileData.course', response.data.studentProfile.course || '');
          setValue('profileData.department', response.data.studentProfile.department || '');
          setValue('profileData.yearOfStudy', response.data.studentProfile.yearOfStudy || 1);
          setValue('profileData.admissionYear', response.data.studentProfile.admissionYear || new Date().getFullYear());
          setValue('profileData.dateOfBirth', response.data.studentProfile.dateOfBirth || '');
          setValue('profileData.guardianName', response.data.studentProfile.guardianName || '');
          setValue('profileData.guardianContact', response.data.studentProfile.guardianContact || '');
          setValue('profileData.emergencyContact', response.data.studentProfile.emergencyContact || '');
          setValue('profileData.emergencyRelation', response.data.studentProfile.emergencyRelation || '');
          setValue('profileData.permanentAddress', response.data.studentProfile.permanentAddress || '');
          setValue('profileData.city', response.data.studentProfile.city || '');
          setValue('profileData.state', response.data.studentProfile.state || '');
          setValue('profileData.pinCode', response.data.studentProfile.pinCode || '');
          setValue('profileData.bloodGroup', response.data.studentProfile.bloodGroup || '');
          setValue('profileData.allergies', response.data.studentProfile.allergies || '');
          setValue('profileData.medicalConditions', response.data.studentProfile.medicalConditions || '');
        }
        if ('counselorProfile' in response.data && response.data.counselorProfile) {
          setValue('profileData.specialization', response.data.counselorProfile.specialization || '');
          setValue('profileData.yearsOfExperience', response.data.counselorProfile.yearsOfExperience || 0);
          setValue('profileData.qualifications', response.data.counselorProfile.qualifications || '');
        }
      } else {
        // Fallback to use auth user data from registration
        console.warn('Profile API failed, using auth user data from registration as fallback');
        if (user) {
          const fallbackProfile = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            hostelName: user.hostelName,
            roomNumber: user.roomNumber,
            isActive: user.isActive,
            createdAt: user.createdAt,
            ...(user.role === 'student' && {
              studentProfile: {
                studentId: user.id.toString().padStart(6, '0'),
                enrollmentNumber: '',
                course: '',
                department: '',
                yearOfStudy: 1,
                admissionYear: new Date().getFullYear(),
                dateOfBirth: '',
                guardianName: '',
                guardianContact: '',
                emergencyContact: '',
                emergencyRelation: '',
                permanentAddress: '',
                city: '',
                state: '',
                pinCode: '',
                bloodGroup: '',
                allergies: '',
                medicalConditions: ''
              }
            }),
            ...(user.role === 'counselor' && {
              counselorProfile: {
                licenseNumber: '',
                specialization: 'Mental Health Counseling',
                yearsOfExperience: 0,
                qualifications: ''
              }
            })
          };
          setProfile(fallbackProfile as StudentProfile | CounselorProfile);
          
          // Pre-fill form with registration data
          setValue('firstName', user.firstName);
          setValue('lastName', user.lastName);
          setValue('phone', user.phone || '');
          if (user.role === 'student') {
            setValue('hostelName', user.hostelName || '');
            setValue('roomNumber', user.roomNumber || '');
            setValue('profileData.studentId', user.id.toString().padStart(6, '0'));
          }
        }
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      // Still use fallback with registration data even on error
      if (user) {
        const fallbackProfile = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          hostelName: user.hostelName,
          roomNumber: user.roomNumber,
          isActive: user.isActive,
          createdAt: user.createdAt,
          ...(user.role === 'student' && {
            studentProfile: {
              studentId: user.id.toString().padStart(6, '0'),
              enrollmentNumber: '',
              course: '',
              department: '',
              yearOfStudy: 1,
              admissionYear: new Date().getFullYear(),
              dateOfBirth: '',
              guardianName: '',
              guardianContact: '',
              emergencyContact: '',
              emergencyRelation: '',
              permanentAddress: '',
              city: '',
              state: '',
              pinCode: '',
              bloodGroup: '',
              allergies: '',
              medicalConditions: ''
            }
          })
        };
        setProfile(fallbackProfile as StudentProfile | CounselorProfile);
        // Pre-fill with registration data
        setValue('firstName', user.firstName);
        setValue('lastName', user.lastName);
        setValue('phone', user.phone || '');
        if (user.role === 'student') {
          setValue('hostelName', user.hostelName || '');
          setValue('roomNumber', user.roomNumber || '');
          setValue('profileData.studentId', user.id.toString().padStart(6, '0'));
          // Pre-fill all student profile fields with empty values
          setValue('profileData.enrollmentNumber', '');
          setValue('profileData.course', '');
          setValue('profileData.department', '');
          setValue('profileData.yearOfStudy', 1);
          setValue('profileData.admissionYear', new Date().getFullYear());
          setValue('profileData.dateOfBirth', '');
          setValue('profileData.guardianName', '');
          setValue('profileData.guardianContact', '');
          setValue('profileData.emergencyContact', '');
          setValue('profileData.emergencyRelation', '');
          setValue('profileData.permanentAddress', '');
          setValue('profileData.city', '');
          setValue('profileData.state', '');
          setValue('profileData.pinCode', '');
          setValue('profileData.bloodGroup', '');
          setValue('profileData.allergies', '');
          setValue('profileData.medicalConditions', '');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitProfile = async (data: UpdateProfileData) => {
    console.log('Updating profile with data:', data);
    
    // Try API first, fallback to local update
    try {
      const response = await profileApi.updateProfile(data);
      if (response.success) {
        toast.success('Profile updated and saved to database!');
        setProfile(response.data!);
        setIsEditing(false);
        fetchProfile(); // Refresh data
        return;
      } else {
        console.warn('API update failed:', response.error);
        toast.error(response.error || 'Failed to save to database');
      }
    } catch (error) {
      console.warn('API call failed, saving locally:', error);
    }
    
    // Fallback: update locally if API fails
    if (profile) {
      const updatedProfile = {
        ...profile,
        firstName: data.firstName || profile.firstName,
        lastName: data.lastName || profile.lastName,
        phone: data.phone || profile.phone,
        ...('hostelName' in profile && {
          hostelName: data.hostelName || profile.hostelName,
          roomNumber: data.roomNumber || profile.roomNumber,
        }),
        // Update student profile data if it exists
        ...('studentProfile' in profile && profile.studentProfile && {
          studentProfile: {
            ...profile.studentProfile,
            studentId: data.profileData?.studentId || profile.studentProfile.studentId,
            enrollmentNumber: data.profileData?.enrollmentNumber || profile.studentProfile.enrollmentNumber,
            course: data.profileData?.course || profile.studentProfile.course,
            department: data.profileData?.department || profile.studentProfile.department,
            yearOfStudy: data.profileData?.yearOfStudy || profile.studentProfile.yearOfStudy,
            admissionYear: data.profileData?.admissionYear || profile.studentProfile.admissionYear,
            dateOfBirth: data.profileData?.dateOfBirth || profile.studentProfile.dateOfBirth,
            guardianName: data.profileData?.guardianName || profile.studentProfile.guardianName,
            guardianContact: data.profileData?.guardianContact || profile.studentProfile.guardianContact,
            emergencyContact: data.profileData?.emergencyContact || profile.studentProfile.emergencyContact,
            emergencyRelation: data.profileData?.emergencyRelation || profile.studentProfile.emergencyRelation,
            permanentAddress: data.profileData?.permanentAddress || profile.studentProfile.permanentAddress,
            city: data.profileData?.city || profile.studentProfile.city,
            state: data.profileData?.state || profile.studentProfile.state,
            pinCode: data.profileData?.pinCode || profile.studentProfile.pinCode,
            bloodGroup: data.profileData?.bloodGroup || profile.studentProfile.bloodGroup,
            allergies: data.profileData?.allergies || profile.studentProfile.allergies,
            medicalConditions: data.profileData?.medicalConditions || profile.studentProfile.medicalConditions,
          }
        }),
        // Update counselor profile data if it exists
        ...('counselorProfile' in profile && profile.counselorProfile && {
          counselorProfile: {
            ...profile.counselorProfile,
            specialization: data.profileData?.specialization || profile.counselorProfile.specialization,
            yearsOfExperience: data.profileData?.yearsOfExperience || profile.counselorProfile.yearsOfExperience,
            qualifications: data.profileData?.qualifications || profile.counselorProfile.qualifications,
          }
        })
      };
      
      console.log('Updated profile locally:', updatedProfile);
      setProfile(updatedProfile);
      setIsEditing(false);
      toast.success('Profile updated locally (database connection failed)');
    } else {
      toast.error('Profile data not available');
    }
  };

  const onSubmitPassword = async (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    // For now, simulate password change since backend API is not implemented
    console.log('Password change requested (backend not implemented yet)');
    toast.success('Password change feature will be available once backend is implemented');
    setShowPasswordForm(false);
    resetPassword();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-netflix-black flex items-center justify-center">
        <div className="spinner w-12 h-12" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-netflix-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Profile Not Found</h2>
          <p className="text-netflix-gray-light mb-4">Unable to load your profile information.</p>
          <Link href="/dashboard">
            <button className="btn-wellness">Back to Dashboard</button>
          </Link>
        </div>
      </div>
    );
  }

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
                {user?.role === 'counselor' ? (
                  <UserCheck className="w-8 h-8 text-wellness-primary" />
                ) : (
                  <User className="w-8 h-8 text-wellness-primary" />
                )}
                <span>{user?.role === 'counselor' ? 'Counselor Profile' : 'Student Profile'}</span>
              </h1>
              <p className="text-netflix-gray-light">
                {user?.role === 'counselor' 
                  ? 'View and manage your professional information and credentials'
                  : 'View and manage your personal information and name details'
                }
              </p>
            </div>
          </div>
          
          {!isEditing && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(true)}
              className="btn-wellness flex items-center space-x-2"
            >
              <Edit className="w-5 h-5" />
              <span>Edit Profile</span>
            </motion.button>
          )}
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-wellness text-center"
        >
          <div className="w-24 h-24 bg-wellness-primary rounded-full flex items-center justify-center mx-auto mb-4">
            {user?.role === 'counselor' ? (
              <UserCheck className="w-12 h-12 text-white" />
            ) : (
              <User className="w-12 h-12 text-white" />
            )}
          </div>
          <div className="mb-4">
            <h2 className="text-3xl font-bold text-white mb-3">
              {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-netflix-gray-light capitalize mb-4">
              {user?.role}
            </p>
          </div>
          {profile.isActive ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-wellness-success/20 text-wellness-success">
              Active Account
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-netflix-red/20 text-netflix-red">
              Inactive Account
            </span>
          )}
        </motion.div>

        {/* Profile Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-wellness"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-white">
              {user?.role === 'counselor' ? 'Professional Information' : 'Personal Information'}
            </h3>
            {isEditing && (
              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(false)}
                  className="btn-wellness-outline flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </motion.button>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-6">
            {/* Name Section - Highlighted */}
            <div className="bg-wellness-primary/5 border border-wellness-primary/20 rounded-lg p-6 mb-6">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                {user?.role === 'counselor' ? (
                  <UserCheck className="w-5 h-5 text-wellness-primary" />
                ) : (
                  <User className="w-5 h-5 text-wellness-primary" />
                )}
                <span>Full Name</span>
              </h4>
              <div className="grid md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-wellness-primary mb-2">
                    First Name *
                  </label>
                  {isEditing ? (
                    <input
                      {...register('firstName', { required: 'First name is required' })}
                      className="input-netflix w-full focus:border-wellness-primary focus:ring-wellness-primary"
                      placeholder="Enter your first name"
                    />
                  ) : (
                    <div className="p-4 bg-netflix-gray-dark/30 rounded-lg text-white font-medium border-l-4 border-wellness-primary">
                      {profile.firstName}
                    </div>
                  )}
                  {errors.firstName && (
                    <p className="text-netflix-red text-sm mt-1">{errors.firstName.message}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-wellness-primary mb-2">
                    Last Name *
                  </label>
                  {isEditing ? (
                    <input
                      {...register('lastName', { required: 'Last name is required' })}
                      className="input-netflix w-full focus:border-wellness-primary focus:ring-wellness-primary"
                      placeholder="Enter your last name"
                    />
                  ) : (
                    <div className="p-4 bg-netflix-gray-dark/30 rounded-lg text-white font-medium border-l-4 border-wellness-primary">
                      {profile.lastName}
                    </div>
                  )}
                  {errors.lastName && (
                    <p className="text-netflix-red text-sm mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-netflix-gray-light mb-2 flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Email Address</span>
                </label>
                <div className="p-3 bg-netflix-gray-dark/30 rounded-lg text-white relative">
                  {profile.email}
                  <span className="text-xs text-netflix-gray-light ml-2">(cannot be changed)</span>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-netflix-gray-light mb-2 flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>Phone Number</span>
                </label>
                {isEditing ? (
                  <input
                    {...register('phone')}
                    type="tel"
                    className="input-netflix w-full"
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <div className="p-3 bg-netflix-gray-dark/30 rounded-lg text-white">
                    {profile.phone || 'Not provided'}
                  </div>
                )}
              </div>

              {/* Member Since */}
              <div>
                <label className="block text-sm font-medium text-netflix-gray-light mb-2 flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Member Since</span>
                </label>
                <div className="p-3 bg-netflix-gray-dark/30 rounded-lg text-white">
                  {new Date(profile.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>

            {/* Student-specific fields */}
            {user?.role === 'student' && 'hostelName' in profile && (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-netflix-gray-light mb-2 flex items-center space-x-2">
                      <Home className="w-4 h-4" />
                      <span>Hostel Name</span>
                    </label>
                    {isEditing ? (
                      <input
                        {...register('hostelName')}
                        className="input-netflix w-full"
                        placeholder="Enter your hostel name"
                      />
                    ) : (
                      <div className="p-3 bg-netflix-gray-dark/30 rounded-lg text-white">
                        {profile.hostelName || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                      Room Number
                    </label>
                    {isEditing ? (
                      <input
                        {...register('roomNumber')}
                        className="input-netflix w-full"
                        placeholder="Enter your room number"
                      />
                    ) : (
                      <div className="p-3 bg-netflix-gray-dark/30 rounded-lg text-white">
                        {profile.roomNumber || 'Not provided'}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Student Profile Information - Always show for students */}
            {user?.role === 'student' && (
              <div className="border-t border-netflix-gray-dark pt-6 mt-6">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <BookOpen className="w-5 h-5" />
                  <span>Academic Information</span>
                </h4>
                
                {/* Row 1: Basic Academic Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-wellness-primary mb-2">
                      Student ID / Roll Number *
                    </label>
                    {isEditing ? (
                      <input
                        {...register('profileData.studentId')}
                        className="input-netflix w-full focus:border-wellness-primary"
                        placeholder="e.g., STU123456"
                      />
                    ) : (
                      <div className="p-3 bg-netflix-gray-dark/30 rounded-lg text-white border-l-4 border-wellness-primary">
                        {('studentProfile' in profile && profile.studentProfile?.studentId) || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-wellness-primary mb-2">
                      Enrollment Number *
                    </label>
                    {isEditing ? (
                      <input
                        {...register('profileData.enrollmentNumber')}
                        className="input-netflix w-full focus:border-wellness-primary"
                        placeholder="e.g., EN202300001"
                      />
                    ) : (
                      <div className="p-3 bg-netflix-gray-dark/30 rounded-lg text-white border-l-4 border-wellness-primary">
                        {('studentProfile' in profile && profile.studentProfile?.enrollmentNumber) || 'Not provided'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 2: Course and Department */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-wellness-secondary mb-2">
                      Course/Program *
                    </label>
                    {isEditing ? (
                      <select
                        {...register('profileData.course')}
                        className="input-netflix w-full focus:border-wellness-secondary"
                      >
                        <option value="">Select your course</option>
                        <option value="Computer Science Engineering">Computer Science Engineering</option>
                        <option value="Information Technology">Information Technology</option>
                        <option value="Electronics & Communication">Electronics & Communication</option>
                        <option value="Mechanical Engineering">Mechanical Engineering</option>
                        <option value="Civil Engineering">Civil Engineering</option>
                        <option value="Electrical Engineering">Electrical Engineering</option>
                        <option value="Business Administration">Business Administration</option>
                        <option value="Commerce">Commerce</option>
                        <option value="Economics">Economics</option>
                        <option value="Psychology">Psychology</option>
                        <option value="English Literature">English Literature</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Biology">Biology</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <div className="p-3 bg-netflix-gray-dark/30 rounded-lg text-white border-l-4 border-wellness-secondary">
                        {('studentProfile' in profile && profile.studentProfile?.course) || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-wellness-secondary mb-2">
                      Department/Faculty *
                    </label>
                    {isEditing ? (
                      <select
                        {...register('profileData.department')}
                        className="input-netflix w-full focus:border-wellness-secondary"
                      >
                        <option value="">Select department</option>
                        <option value="Engineering & Technology">Engineering & Technology</option>
                        <option value="Computer Applications">Computer Applications</option>
                        <option value="Management Studies">Management Studies</option>
                        <option value="Commerce & Economics">Commerce & Economics</option>
                        <option value="Arts & Humanities">Arts & Humanities</option>
                        <option value="Science">Science</option>
                        <option value="Social Sciences">Social Sciences</option>
                        <option value="Medical Sciences">Medical Sciences</option>
                        <option value="Law">Law</option>
                      </select>
                    ) : (
                      <div className="p-3 bg-netflix-gray-dark/30 rounded-lg text-white border-l-4 border-wellness-secondary">
                        {('studentProfile' in profile && profile.studentProfile?.department) || 'Not provided'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 3: Academic Year Info */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-wellness-warning mb-2">
                      Current Year of Study *
                    </label>
                    {isEditing ? (
                      <select
                        {...register('profileData.yearOfStudy', { valueAsNumber: true })}
                        className="input-netflix w-full focus:border-wellness-warning"
                      >
                        <option value={1}>1st Year</option>
                        <option value={2}>2nd Year</option>
                        <option value={3}>3rd Year</option>
                        <option value={4}>4th Year</option>
                        <option value={5}>5th Year</option>
                        <option value={6}>6th Year</option>
                      </select>
                    ) : (
                      <div className="p-3 bg-netflix-gray-dark/30 rounded-lg text-white border-l-4 border-wellness-warning">
                        {('studentProfile' in profile && profile.studentProfile?.yearOfStudy) ? `${profile.studentProfile.yearOfStudy}${getOrdinalSuffix(profile.studentProfile.yearOfStudy)} Year` : 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-wellness-warning mb-2">
                      Admission Year *
                    </label>
                    {isEditing ? (
                      <select
                        {...register('profileData.admissionYear', { valueAsNumber: true })}
                        className="input-netflix w-full focus:border-wellness-warning"
                      >
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = new Date().getFullYear() - i;
                          return (
                            <option key={year} value={year}>{year}</option>
                          );
                        })}
                      </select>
                    ) : (
                      <div className="p-3 bg-netflix-gray-dark/30 rounded-lg text-white border-l-4 border-wellness-warning">
                        {('studentProfile' in profile && profile.studentProfile?.admissionYear) || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-wellness-success mb-2">
                      Date of Birth *
                    </label>
                    {isEditing ? (
                      <input
                        {...register('profileData.dateOfBirth')}
                        type="date"
                        className="input-netflix w-full focus:border-wellness-success"
                        max={new Date().toISOString().split('T')[0]}
                      />
                    ) : (
                      <div className="p-3 bg-netflix-gray-dark/30 rounded-lg text-white border-l-4 border-wellness-success">
                        {('studentProfile' in profile && profile.studentProfile?.dateOfBirth) ? 
                          new Date(profile.studentProfile.dateOfBirth).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 
                          'Not provided'
                        }
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="border-t border-netflix-gray-dark pt-6 mt-6">
                  <h5 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                    <Phone className="w-5 h-5 text-wellness-info" />
                    <span>Contact Information</span>
                  </h5>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-wellness-info mb-2">
                        Guardian/Parent Name *
                      </label>
                      {isEditing ? (
                        <input
                          {...register('profileData.guardianName')}
                          className="input-netflix w-full focus:border-wellness-info"
                          placeholder="Enter guardian's full name"
                        />
                      ) : (
                        <div className="p-3 bg-netflix-gray-dark/30 rounded-lg text-white border-l-4 border-wellness-info">
                          {('studentProfile' in profile && profile.studentProfile?.guardianName) || 'Not provided'}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-wellness-info mb-2">
                        Guardian Contact Number *
                      </label>
                      {isEditing ? (
                        <input
                          {...register('profileData.guardianContact')}
                          type="tel"
                          className="input-netflix w-full focus:border-wellness-info"
                          placeholder="Enter guardian's phone number"
                        />
                      ) : (
                        <div className="p-3 bg-netflix-gray-dark/30 rounded-lg text-white border-l-4 border-wellness-info">
                          {('studentProfile' in profile && profile.studentProfile?.guardianContact) || 'Not provided'}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-wellness-info mb-2">
                        Emergency Contact *
                      </label>
                      {isEditing ? (
                        <input
                          {...register('profileData.emergencyContact')}
                          type="tel"
                          className="input-netflix w-full focus:border-wellness-info"
                          placeholder="Emergency contact number"
                        />
                      ) : (
                        <div className="p-3 bg-netflix-gray-dark/30 rounded-lg text-white border-l-4 border-wellness-info">
                          {('studentProfile' in profile && profile.studentProfile?.emergencyContact) || 'Not provided'}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-wellness-info mb-2">
                        Relationship to Emergency Contact
                      </label>
                      {isEditing ? (
                        <select
                          {...register('profileData.emergencyRelation')}
                          className="input-netflix w-full focus:border-wellness-info"
                        >
                          <option value="">Select relationship</option>
                          <option value="Parent">Parent</option>
                          <option value="Guardian">Guardian</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Relative">Relative</option>
                          <option value="Friend">Friend</option>
                          <option value="Other">Other</option>
                        </select>
                      ) : (
                        <div className="p-3 bg-netflix-gray-dark/30 rounded-lg text-white border-l-4 border-wellness-info">
                          {('studentProfile' in profile && profile.studentProfile?.emergencyRelation) || 'Not provided'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Address Information Section */}
                <div className="border-t border-netflix-gray-dark pt-6 mt-6">
                  <h5 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                    <Home className="w-5 h-5 text-wellness-mood-good" />
                    <span>Address Information</span>
                  </h5>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-wellness-mood-good mb-2">
                        Permanent Address *
                      </label>
                      {isEditing ? (
                        <textarea
                          {...register('profileData.permanentAddress')}
                          className="input-netflix w-full h-20 resize-none focus:border-wellness-mood-good"
                          placeholder="Enter your permanent address"
                        />
                      ) : (
                        <div className="p-3 bg-netflix-gray-dark/30 rounded-lg text-white border-l-4 border-wellness-mood-good">
                          {('studentProfile' in profile && profile.studentProfile?.permanentAddress) || 'Not provided'}
                        </div>
                      )}
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-wellness-mood-good mb-2">
                          City *
                        </label>
                        {isEditing ? (
                          <input
                            {...register('profileData.city')}
                            className="input-netflix w-full focus:border-wellness-mood-good"
                            placeholder="Enter city"
                          />
                        ) : (
                          <div className="p-3 bg-netflix-gray-dark/30 rounded-lg text-white border-l-4 border-wellness-mood-good">
                            {('studentProfile' in profile && profile.studentProfile?.city) || 'Not provided'}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-wellness-mood-good mb-2">
                          State *
                        </label>
                        {isEditing ? (
                          <input
                            {...register('profileData.state')}
                            className="input-netflix w-full focus:border-wellness-mood-good"
                            placeholder="Enter state"
                          />
                        ) : (
                          <div className="p-3 bg-netflix-gray-dark/30 rounded-lg text-white border-l-4 border-wellness-mood-good">
                            {('studentProfile' in profile && profile.studentProfile?.state) || 'Not provided'}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-wellness-mood-good mb-2">
                          PIN Code *
                        </label>
                        {isEditing ? (
                          <input
                            {...register('profileData.pinCode')}
                            type="text"
                            pattern="[0-9]{6}"
                            className="input-netflix w-full focus:border-wellness-mood-good"
                            placeholder="Enter PIN code"
                          />
                        ) : (
                          <div className="p-3 bg-netflix-gray-dark/30 rounded-lg text-white border-l-4 border-wellness-mood-good">
                            {('studentProfile' in profile && profile.studentProfile?.pinCode) || 'Not provided'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Medical Information Section */}
                <div className="border-t border-netflix-gray-dark pt-6 mt-6">
                  <h5 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-netflix-red" />
                    <span>Medical Information</span>
                    <span className="text-xs text-netflix-gray-light ml-2">(Optional but recommended)</span>
                  </h5>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-netflix-red mb-2">
                        Blood Group
                      </label>
                      {isEditing ? (
                        <select
                          {...register('profileData.bloodGroup')}
                          className="input-netflix w-full focus:border-netflix-red"
                        >
                          <option value="">Select blood group</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      ) : (
                        <div className="p-3 bg-netflix-gray-dark/30 rounded-lg text-white border-l-4 border-netflix-red">
                          {('studentProfile' in profile && profile.studentProfile?.bloodGroup) || 'Not provided'}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-netflix-red mb-2">
                        Known Allergies
                      </label>
                      {isEditing ? (
                        <input
                          {...register('profileData.allergies')}
                          className="input-netflix w-full focus:border-netflix-red"
                          placeholder="List any known allergies"
                        />
                      ) : (
                        <div className="p-3 bg-netflix-gray-dark/30 rounded-lg text-white border-l-4 border-netflix-red">
                          {('studentProfile' in profile && profile.studentProfile?.allergies) || 'None reported'}
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-netflix-red mb-2">
                        Medical Conditions/Medications
                      </label>
                      {isEditing ? (
                        <textarea
                          {...register('profileData.medicalConditions')}
                          className="input-netflix w-full h-20 resize-none focus:border-netflix-red"
                          placeholder="List any medical conditions or regular medications"
                        />
                      ) : (
                        <div className="p-3 bg-netflix-gray-dark/30 rounded-lg text-white border-l-4 border-netflix-red">
                          {('studentProfile' in profile && profile.studentProfile?.medicalConditions) || 'None reported'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isEditing && (
              <div className="flex justify-end space-x-4 pt-6 border-t border-netflix-gray-dark">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsEditing(false);
                    // Reset form to original values
                    setValue('firstName', profile.firstName);
                    setValue('lastName', profile.lastName);
                    setValue('phone', profile.phone || '');
                    if ('hostelName' in profile) {
                      setValue('hostelName', profile.hostelName || '');
                      setValue('roomNumber', profile.roomNumber || '');
                    }
                  }}
                  className="btn-wellness-outline flex items-center space-x-2"
                >
                  <X className="w-5 h-5" />
                  <span>Cancel</span>
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-wellness flex items-center space-x-2"
                >
                  <Save className="w-5 h-5" />
                  <span>Save Changes</span>
                </motion.button>
              </div>
            )}
          </form>
        </motion.div>

        {/* Security Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-wellness"
        >
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
            <Shield className="w-6 h-6" />
            <span>Security Settings</span>
          </h3>

          {!showPasswordForm ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowPasswordForm(true)}
              className="btn-wellness-outline"
            >
              Change Password
            </motion.button>
          ) : (
            <form onSubmit={handlePasswordSubmit(onSubmitPassword)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    {...registerPassword('currentPassword', { required: 'Current password is required' })}
                    type={showCurrentPassword ? 'text' : 'password'}
                    className="input-netflix w-full pr-10"
                    placeholder="Enter your current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-netflix-gray-light hover:text-white"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="text-netflix-red text-sm mt-1">{passwordErrors.currentPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    {...registerPassword('newPassword', { 
                      required: 'New password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' }
                    })}
                    type={showNewPassword ? 'text' : 'password'}
                    className="input-netflix w-full pr-10"
                    placeholder="Enter your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-netflix-gray-light hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="text-netflix-red text-sm mt-1">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                  Confirm New Password
                </label>
                <input
                  {...registerPassword('confirmPassword', { required: 'Please confirm your password' })}
                  type="password"
                  className="input-netflix w-full"
                  placeholder="Confirm your new password"
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-netflix-red text-sm mt-1">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex space-x-4">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowPasswordForm(false);
                    resetPassword();
                  }}
                  className="btn-wellness-outline"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-wellness"
                >
                  Update Password
                </motion.button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
