'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  Calendar, 
  Clock, 
  Plus, 
  User,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Video,
  MapPin
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/context/AuthContext';
import type { CreateAppointmentData, Counselor, Student } from '@/lib/api/appointments';
import { Appointment } from '@/types';
import { useSearchParams } from 'next/navigation';
import { 
  getAppointmentsForUser, 
  createAppointment as createStoredAppointment, 
  updateAppointmentStatus,
  initializeSampleAppointments,
  StoredAppointment 
} from '@/lib/storage/appointments';
import { triggerSessionCompletionAppreciation } from '@/lib/utils/appreciation-notifications';

const AppointmentsPageContent = () => {
  const { user, token } = useAuth();
  const searchParams = useSearchParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedCounselorId, setSelectedCounselorId] = useState<number | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<CreateAppointmentData>();

  useEffect(() => {
    if (user) {
      console.log('Appointments page loaded for user:', user.firstName, user.lastName, 'Role:', user.role);
      fetchAppointments();
      if (user.role === 'student') {
        console.log('User is student, fetching counselors...');
        fetchCounselors();
      } else if (user.role === 'counselor') {
        console.log('User is counselor, fetching students...');
        fetchStudents();
      }
    }
  }, [user, token]);

  // Handle preselection from students page
  useEffect(() => {
    const preselectStudentId = searchParams?.get('preselect');
    if (preselectStudentId && user?.role === 'counselor') {
      setTimeout(() => {
        setShowBookingModal(true);
        // Pre-select the student
        const studentId = parseInt(preselectStudentId);
        setSelectedStudentId(studentId);
        setValue('studentId', studentId);
      }, 500);
    }
  }, [searchParams, user, setValue]);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      if (!user || !token) {
        setAppointments([]);
        return;
      }

      console.log('Fetching appointments from database...');
      const response = await fetch('/api/appointments/my', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      console.log('Appointments API response:', data);
      
      if (data.success && data.appointments) {
        console.log(`Loaded ${data.appointments.length} appointments from database`);
        setAppointments(data.appointments);
      } else {
        console.log('API failed, using fallback storage method...');
        // Use shared storage instead
        initializeSampleAppointments(user.id, user.role as 'student' | 'counselor');
        const storedAppointments = getAppointmentsForUser(user.id, user.role as 'student' | 'counselor');
        
        // Convert StoredAppointment to Appointment format
        const appointments: Appointment[] = storedAppointments.map(apt => ({
          id: apt.id,
          studentId: apt.studentId,
          counselorId: apt.counselorId,
          appointmentDate: apt.appointmentDate,
          durationMinutes: apt.durationMinutes,
          status: apt.status,
          reason: apt.reason,
          counselorFirstName: apt.counselorFirstName || 'Dr. Unknown',
          counselorLastName: apt.counselorLastName || 'Counselor',
          createdAt: apt.createdAt,
          updatedAt: apt.updatedAt
        }));
        
        setAppointments(appointments);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      console.log('Using fallback storage method due to error...');
      // Fallback to storage
      try {
        initializeSampleAppointments(user.id, user.role as 'student' | 'counselor');
        const storedAppointments = getAppointmentsForUser(user.id, user.role as 'student' | 'counselor');
        
        const appointments: Appointment[] = storedAppointments.map(apt => ({
          id: apt.id,
          studentId: apt.studentId,
          counselorId: apt.counselorId,
          appointmentDate: apt.appointmentDate,
          durationMinutes: apt.durationMinutes,
          status: apt.status,
          reason: apt.reason,
          counselorFirstName: apt.counselorFirstName || 'Dr. Unknown',
          counselorLastName: apt.counselorLastName || 'Counselor',
          createdAt: apt.createdAt,
          updatedAt: apt.updatedAt
        }));
        
        setAppointments(appointments);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        setAppointments([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCounselors = async () => {
    try {
      console.log('Fetching counselors from database...');
      const response = await fetch('/api/counselors');
      const data = await response.json();
      console.log('Counselors API response:', data);
      
      if (data.success && data.counselors) {
        console.log(`Loaded ${data.counselors.length} counselors from database`);
        // Transform to the format expected by the appointments page
        const counselorsData = data.counselors.map((counselor: any) => ({
          id: counselor.id,
          firstName: counselor.firstName,
          lastName: counselor.lastName,
          email: counselor.email,
          specialization: counselor.specialization,
          experience: counselor.experience,
          phone: counselor.phone,
          licenseNumber: counselor.licenseNumber,
          qualifications: counselor.qualifications
        }));
        setCounselors(counselorsData);
      } else {
        console.error('Failed to fetch counselors:', data.error);
        setCounselors([]);
      }
    } catch (error) {
      console.error('Error fetching counselors:', error);
      setCounselors([]);
    }
  };

  const fetchStudents = async () => {
    try {
      console.log('Fetching students from database...');
      const response = await fetch('/api/students');
      const data = await response.json();
      console.log('Students API response:', data);
      
      if (data.success && data.students) {
        console.log(`Loaded ${data.students.length} students from database`);
        // Transform to the format expected by the appointments page
        const studentsData = data.students.map((student: any) => ({
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          course: student.course,
          yearOfStudy: student.yearOfStudy,
          studentId: student.studentId,
          phone: student.phone,
          hostelName: student.hostelName,
          roomNumber: student.roomNumber
        }));
        setStudents(studentsData);
      } else {
        console.error('Failed to fetch students:', data.error);
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    }
  };

  const onBookAppointment = async (data: CreateAppointmentData) => {
    try {
      console.log('onBookAppointment called with data:', data);
      console.log('User role:', user?.role);
      console.log('Selected counselor ID:', selectedCounselorId);
      console.log('Selected student ID:', selectedStudentId);
      
      if (!user) {
        toast.error('User not logged in');
        return;
      }
      
      if (!token) {
        toast.error('Authentication token not available');
        return;
      }

      let appointmentData;
      let studentInfo, counselorInfo;

      if (user.role === 'counselor') {
        // Counselor booking for student
        if (!data.studentId) {
          toast.error('Please select a student');
          return;
        }
        
        appointmentData = {
          studentId: data.studentId,
          counselorId: user.id,
          appointmentDate: data.appointmentDate,
          durationMinutes: data.durationMinutes,
          reason: data.reason
        };
      } else {
        // Student booking with counselor
        if (!data.counselorId) {
          toast.error('Please select a counselor');
          return;
        }
        
        appointmentData = {
          studentId: user.id,
          counselorId: data.counselorId,
          appointmentDate: data.appointmentDate,
          durationMinutes: data.durationMinutes,
          reason: data.reason
        };
      }
      
      // Try API first, fallback to storage
      console.log('Creating appointment with data:', appointmentData);
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });
      const responseData = await response.json();
      console.log('Create appointment API response:', responseData);
      
      if (responseData.success && responseData.appointment) {
        const successMessage = user.role === 'counselor' 
          ? 'Appointment booked for student successfully!'
          : 'Appointment booked successfully!';
        toast.success(successMessage);
        setAppointments(prev => [responseData.appointment, ...prev]);
        reset();
        setShowBookingModal(false);
        setSelectedCounselorId(null);
        setSelectedStudentId(null);
      } else {
        // API call failed, show error message
        console.error('Appointment booking failed:', responseData.error);
        toast.error(responseData.error || 'Failed to book appointment');
        return;
      }
    } catch (error) {
      console.error('Booking error:', error);
      if (error instanceof Error) {
        toast.error(`Failed to book appointment: ${error.message}`);
      } else {
        toast.error('Failed to book appointment');
      }
    }
  };

  const handleCancelAppointment = async (appointmentId: number) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      console.log('Cancelling appointment:', appointmentId);
      const response = await fetch(`/api/appointments/${appointmentId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      console.log('Cancel appointment API response:', data);
      
      if (data.success) {
        toast.success('Appointment cancelled successfully');
        setAppointments(prev => prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: 'cancelled' as const }
            : apt
        ));
      } else {
        // Use storage instead
        const success = updateAppointmentStatus(appointmentId, 'cancelled');
        if (success) {
          toast.success('Appointment cancelled successfully');
          setAppointments(prev => prev.map(apt => 
            apt.id === appointmentId 
              ? { ...apt, status: 'cancelled' as const }
              : apt
          ));
        } else {
          toast.error('Failed to cancel appointment');
        }
      }
    } catch (error) {
      // Use storage as fallback
      const success = updateAppointmentStatus(appointmentId, 'cancelled');
      if (success) {
        toast.success('Appointment cancelled successfully');
        setAppointments(prev => prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: 'cancelled' as const }
            : apt
        ));
      } else {
        toast.error('Failed to cancel appointment');
      }
    }
  };

  const handleCompleteAppointment = async (appointmentId: number) => {
    if (!confirm('Mark this appointment as completed?')) return;

    try {
      console.log('Completing appointment:', appointmentId);
      const response = await fetch(`/api/appointments/${appointmentId}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: 'Session completed successfully' }),
      });
      const data = await response.json();
      console.log('Complete appointment API response:', data);
      
      if (data.success) {
        const completedAppointment = appointments.find(apt => apt.id === appointmentId);
        if (completedAppointment) {
          // Calculate session number for this student
          const studentCompletedSessions = appointments.filter(apt => 
            apt.studentId === completedAppointment.studentId && 
            apt.status === 'completed'
          ).length + 1; // +1 for the current completion
          
          // Trigger session completion appreciation for the student
          await triggerSessionCompletionAppreciation(
            completedAppointment.studentId,
            'counseling',
            studentCompletedSessions,
            true // Show toast notifications
          );
        }
        
        toast.success('Session completed! 🎉');
        setAppointments(prev => prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: 'completed' as const }
            : apt
        ));
      } else {
        toast.error(data.error || 'Failed to complete appointment');
      }
    } catch (error) {
      toast.error('Failed to complete appointment');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="w-5 h-5 text-wellness-primary" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-wellness-success" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-netflix-red" />;
      case 'no_show':
        return <AlertCircle className="w-5 h-5 text-wellness-warning" />;
      default:
        return <Clock className="w-5 h-5 text-netflix-gray-medium" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'text-wellness-primary bg-wellness-primary/10';
      case 'completed':
        return 'text-wellness-success bg-wellness-success/10';
      case 'cancelled':
        return 'text-netflix-red bg-netflix-red/10';
      case 'no_show':
        return 'text-wellness-warning bg-wellness-warning/10';
      default:
        return 'text-netflix-gray-medium bg-netflix-gray-medium/10';
    }
  };

  const upcomingAppointments = appointments.filter(apt => apt.status === 'scheduled');
  const pastAppointments = appointments.filter(apt => ['completed', 'cancelled', 'no_show'].includes(apt.status));

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
              <Calendar className="w-8 h-8 text-wellness-primary" />
              Appointments
            </h1>
            <p className="text-netflix-gray-light mt-2">
              {user?.role === 'counselor' 
                ? 'Schedule and manage appointments for your students'
                : 'Book and manage your counseling sessions'
              }
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowBookingModal(true);
              setSelectedCounselorId(null);
              setSelectedStudentId(null);
              reset();
            }}
            className="btn-wellness px-6 py-3 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {user?.role === 'counselor' ? 'Book for Student' : 'Book Appointment'}
          </motion.button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card-netflix p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-netflix-gray-light text-sm mb-1">Total Sessions</p>
                <p className="text-3xl font-bold text-white">{appointments.length}</p>
              </div>
              <Calendar className="w-12 h-12 text-wellness-primary" />
            </div>
          </div>

          <div className="card-netflix p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-netflix-gray-light text-sm mb-1">Upcoming</p>
                <p className="text-3xl font-bold text-wellness-secondary">{upcomingAppointments.length}</p>
              </div>
              <Clock className="w-12 h-12 text-wellness-secondary" />
            </div>
          </div>

          <div className="card-netflix p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-netflix-gray-light text-sm mb-1">Completed</p>
                <p className="text-3xl font-bold text-wellness-success">
                  {pastAppointments.filter(apt => apt.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-wellness-success" />
            </div>
          </div>
        </div>

        {/* Appointments Lists */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upcoming Appointments */}
          <div>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-wellness-primary" />
              Upcoming Appointments ({upcomingAppointments.length})
            </h2>
            
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment, index) => (
                  <AppointmentCard 
                    key={appointment.id} 
                    appointment={appointment} 
                    index={index}
                    onCancel={handleCancelAppointment}
                    onComplete={user?.role === 'counselor' ? handleCompleteAppointment : undefined}
                    getStatusIcon={getStatusIcon}
                    getStatusColor={getStatusColor}
                    userRole={user?.role}
                  />
                ))}
              </div>
            ) : (
              <div className="card-netflix p-8 text-center">
                <Calendar className="w-16 h-16 text-netflix-gray-medium mx-auto mb-4" />
                <p className="text-netflix-gray-light mb-4">No upcoming appointments</p>
                <button
                  onClick={() => {
                    setShowBookingModal(true);
                    setSelectedCounselorId(null);
                    setSelectedStudentId(null);
                    reset();
                  }}
                  className="btn-wellness-outline px-4 py-2"
                >
                  {user?.role === 'counselor' ? 'Schedule First Session' : 'Book Your First Session'}
                </button>
              </div>
            )}
          </div>

          {/* Past Appointments */}
          <div>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-wellness-success" />
              Past Appointments ({pastAppointments.length})
            </h2>
            
            {pastAppointments.length > 0 ? (
              <div className="space-y-4">
                {pastAppointments.map((appointment, index) => (
                  <AppointmentCard 
                    key={appointment.id} 
                    appointment={appointment} 
                    index={index}
                    getStatusIcon={getStatusIcon}
                    getStatusColor={getStatusColor}
                    isPast
                  />
                ))}
              </div>
            ) : (
              <div className="card-netflix p-8 text-center">
                <CheckCircle className="w-16 h-16 text-netflix-gray-medium mx-auto mb-4" />
                <p className="text-netflix-gray-light">No past appointments</p>
              </div>
            )}
          </div>
        </div>

        {/* Book Appointment Modal */}
        <AnimatePresence>
          {showBookingModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => {
                setShowBookingModal(false);
                setSelectedCounselorId(null);
                setSelectedStudentId(null);
                reset();
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="card-netflix p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              >
                <h3 className="text-xl font-bold text-white mb-6">
                  {user?.role === 'counselor' ? 'Book Appointment for Student' : 'Book New Appointment'}
                </h3>
                
                <form onSubmit={handleSubmit(onBookAppointment)} className="space-y-4">
                  {/* Conditional selector based on user role */}
                  {user?.role === 'student' ? (
                    // Student sees counselor selector
                    <div>
                      <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                        Select Counselor *
                      </label>
                      <div className="space-y-3">
                        <div className="text-xs text-netflix-gray-medium mb-2">
                          {counselors.length} registered counselor(s) available for booking - Click to select
                        </div>
                        {counselors.length > 0 ? (
                          counselors.map(counselor => {
                            const isSelected = selectedCounselorId === counselor.id;
                            return (
                              <motion.div
                                key={counselor.id}
                                whileHover={{ scale: 1.01 }}
                                className="cursor-pointer"
                                onClick={() => {
                                  setSelectedCounselorId(counselor.id);
                                  setValue('counselorId', counselor.id);
                                }}
                              >
                                <div className={`border rounded-lg p-4 hover:border-wellness-primary transition-colors duration-200 ${
                                  isSelected 
                                    ? 'border-wellness-primary bg-wellness-primary/10' 
                                    : 'border-netflix-gray-medium'
                                }`}>
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-white mb-1">
                                        {counselor.firstName} {counselor.lastName}
                                      </h4>
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="px-2 py-1 bg-wellness-primary/20 text-wellness-primary rounded-full text-xs font-medium">
                                        {counselor.specialization}
                                      </span>
                                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                                        ✓ Registered
                                      </span>
                                      <span className="text-netflix-gray-light text-xs">
                                        {counselor.yearsOfExperience} years exp.
                                      </span>
                                    </div>
                                      <p className="text-sm text-netflix-gray-light">
                                        {counselor.email}
                                      </p>
                                    </div>
                                    <div className={`w-4 h-4 border-2 rounded-full flex items-center justify-center ${
                                      isSelected 
                                        ? 'border-wellness-primary bg-wellness-primary' 
                                        : 'border-netflix-gray-medium'
                                    }`}>
                                      <div className={`w-2 h-2 bg-white rounded-full ${
                                        isSelected ? 'opacity-100' : 'opacity-0'
                                      }`} />
                                    </div>
                                  </div>
                                </div>
                                {/* Hidden input for form validation */}
                                <input
                                  {...register('counselorId', { 
                                    required: 'Please select a counselor',
                                    valueAsNumber: true
                                  })}
                                  type="radio"
                                  value={counselor.id}
                                  checked={isSelected}
                                  onChange={() => {}} // Handled by onClick
                                  className="hidden"
                                />
                              </motion.div>
                            );
                          })
                        ) : (
                          <div className="text-center py-8">
                            <User className="w-12 h-12 text-netflix-gray-medium mx-auto mb-3" />
                            <p className="text-netflix-gray-light text-sm mb-2">No registered counselors available</p>
                            <p className="text-netflix-gray-medium text-xs">
                              Only registered counselors can accept appointments
                            </p>
                          </div>
                        )}
                      </div>
                      {errors.counselorId && (
                        <p className="text-netflix-red text-sm mt-2">{errors.counselorId.message}</p>
                      )}
                    </div>
                  ) : (
                    // Counselor sees student selector  
                    <div>
                      <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                        Select Student *
                      </label>
                      <div className="space-y-3">
                        <div className="text-xs text-netflix-gray-medium mb-2">
                          {students.length} registered student(s) available for booking - Click to select
                        </div>
                        {students.length > 0 ? (
                          students.map(student => {
                            const isSelected = selectedStudentId === student.id;
                            return (
                              <motion.div
                                key={student.id}
                                whileHover={{ scale: 1.01 }}
                                className="cursor-pointer"
                                onClick={() => {
                                  setSelectedStudentId(student.id);
                                  setValue('studentId', student.id);
                                }}
                              >
                                <div className={`border rounded-lg p-4 hover:border-wellness-primary transition-colors duration-200 ${
                                  isSelected 
                                    ? 'border-wellness-primary bg-wellness-primary/10' 
                                    : 'border-netflix-gray-medium'
                                }`}>
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-white mb-1">
                                        {student.firstName} {student.lastName}
                                      </h4>
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-1 bg-wellness-secondary/20 text-wellness-secondary rounded-full text-xs font-medium">
                                          {student.course}
                                        </span>
                                        <span className="text-netflix-gray-light text-xs">
                                          Year {student.yearOfStudy}
                                        </span>
                                      </div>
                                      <p className="text-sm text-netflix-gray-light">
                                        {student.email}
                                      </p>
                                      {student.hostelName && student.roomNumber && (
                                        <p className="text-xs text-netflix-gray-medium mt-1">
                                          {student.hostelName} - Room {student.roomNumber}
                                        </p>
                                      )}
                                    </div>
                                    <div className={`w-4 h-4 border-2 rounded-full flex items-center justify-center ${
                                      isSelected 
                                        ? 'border-wellness-primary bg-wellness-primary' 
                                        : 'border-netflix-gray-medium'
                                    }`}>
                                      <div className={`w-2 h-2 bg-white rounded-full ${
                                        isSelected ? 'opacity-100' : 'opacity-0'
                                      }`} />
                                    </div>
                                  </div>
                                </div>
                                {/* Hidden input for form validation */}
                                <input
                                  {...register('studentId', { 
                                    required: 'Please select a student',
                                    valueAsNumber: true
                                  })}
                                  type="radio"
                                  value={student.id}
                                  checked={isSelected}
                                  onChange={() => {}} // Handled by onClick
                                  className="hidden"
                                />
                              </motion.div>
                            );
                          })
                        ) : (
                          <div className="text-center py-8">
                            <User className="w-12 h-12 text-netflix-gray-medium mx-auto mb-3" />
                            <p className="text-netflix-gray-light text-sm mb-2">No registered students available</p>
                            <p className="text-netflix-gray-medium text-xs">
                              Only registered students can book appointments
                            </p>
                          </div>
                        )}
                      </div>
                      {errors.studentId && (
                        <p className="text-netflix-red text-sm mt-2">{errors.studentId.message}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                      Appointment Date & Time *
                    </label>
                    <input
                      {...register('appointmentDate', { required: 'Date and time are required' })}
                      type="datetime-local"
                      min={new Date().toISOString().slice(0, 16)}
                      className="input-netflix w-full"
                    />
                    {errors.appointmentDate && (
                      <p className="text-netflix-red text-sm mt-1">{errors.appointmentDate.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                      Duration (minutes)
                    </label>
                    <select
                      {...register('durationMinutes', { valueAsNumber: true })}
                      className="input-netflix w-full"
                      defaultValue={60}
                    >
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                      <option value={90}>90 minutes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                      Reason for Appointment (Optional)
                    </label>
                    <textarea
                      {...register('reason')}
                      className="input-netflix w-full h-24 resize-none"
                      placeholder="Describe what you'd like to discuss..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBookingModal(false);
                        setSelectedCounselorId(null);
                        setSelectedStudentId(null);
                        reset();
                      }}
                      className="flex-1 btn-wellness-outline py-3"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 btn-wellness py-3"
                    >
                      Book Appointment
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

// Appointment Card Component
const AppointmentCard: React.FC<{
  appointment: Appointment;
  index: number;
  onCancel?: (id: number) => void;
  onComplete?: (id: number) => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  isPast?: boolean;
  userRole?: string;
}> = ({ appointment, index, onCancel, onComplete, getStatusIcon, getStatusColor, isPast = false, userRole }) => {
  const appointmentDate = new Date(appointment.appointmentDate);
  const isToday = appointmentDate.toDateString() === new Date().toDateString();
  const isTomorrow = appointmentDate.toDateString() === new Date(Date.now() + 86400000).toDateString();

  const getRelativeDateText = () => {
    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';
    return appointmentDate.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="card-netflix p-6 hover:bg-netflix-black-light transition-colors duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          {getStatusIcon(appointment.status)}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">
              {userRole === 'counselor' 
                ? `${appointment.studentFirstName || 'Unknown'} ${appointment.studentLastName || 'Student'}`
                : `${appointment.counselorFirstName || 'Dr.'} ${appointment.counselorLastName || 'Counselor'}`}
            </h3>
            <p className="text-xs text-netflix-gray-medium mb-2">
              {userRole === 'counselor' 
                ? `Session with student`
                : `Session with ${appointment.counselorFirstName || 'Dr.'} ${appointment.counselorLastName || 'Counselor'}`}
            </p>
            <div className="flex items-center gap-4 text-sm text-netflix-gray-light mb-2">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {getRelativeDateText()}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            {appointment.reason && (
              <p className="text-sm text-netflix-gray-light mb-3">{appointment.reason}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(appointment.status)}`}>
            {appointment.status.replace('_', ' ')}
          </span>
          {!isPast && appointment.status === 'scheduled' && (
            <div className="flex gap-2">
              {/* Counselors can mark as completed */}
              {userRole === 'counselor' && onComplete && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onComplete(appointment.id)}
                  className="btn-wellness px-3 py-1 text-sm flex items-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" />
                  Complete
                </motion.button>
              )}
              {/* Both can cancel */}
              {onCancel && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onCancel(appointment.id)}
                  className="btn-wellness-outline px-3 py-1 text-sm text-netflix-red border-netflix-red hover:bg-netflix-red"
                >
                  Cancel
                </motion.button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-netflix-gray-medium">
        <span>Duration: {appointment.durationMinutes} minutes</span>
        {isPast && (
          <span>
            {appointment.status === 'completed' ? 'Session completed' : 'Session cancelled'}
          </span>
        )}
      </div>
    </motion.div>
  );
};

const AppointmentsPage = () => {
  return (
    <Suspense fallback={<div className="min-h-screen bg-netflix-black p-6"><div className="max-w-7xl mx-auto"><div className="flex items-center justify-center h-64"><div className="spinner w-8 h-8" /></div></div></div>}>
      <AppointmentsPageContent />
    </Suspense>
  );
};

export default AppointmentsPage;
