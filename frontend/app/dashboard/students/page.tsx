'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  MessageCircle, 
  TrendingUp,
  Search,
  Filter,
  User,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  X,
  BookOpen,
  Home,
  Shield
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getUserWellnessStats } from '@/lib/storage/mood';

// Function to fetch appointments from database API
const fetchAppointmentsFromAPI = async (token: string): Promise<any[]> => {
  try {
    const response = await fetch('/api/appointments/my', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.success ? data.appointments : [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching appointments from API:', error);
    return [];
  }
};

const StudentsPage = () => {
  const { user, token } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showSessionHistory, setShowSessionHistory] = useState(false);
  const [studentWellnessData, setStudentWellnessData] = useState<{[key: number]: any}>({});
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'all' | 'appointments'>('all'); // Show all students by default

  const loadStudents = async () => {
    if (!user || !token) return;
    
    setLoading(true);
    // Load real student data from API
    try {
      console.log('🔄 Fetching students from API...');
      
      // Fetch students from API
      const response = await fetch('/api/students');
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch students');
      }
      
      const allStudents = data.students;
      // Fetch appointments from database API instead of localStorage
      const allAppointments = await fetchAppointmentsFromAPI(token);
      
      console.log(`✅ Loaded ${allStudents.length} students from database`);
      console.log(`✅ Loaded ${allAppointments.length} appointments from database`);
      console.log('Students:', allStudents);
      console.log('Appointments:', allAppointments);
      
      // Filter students based on view mode
      const filteredStudents = viewMode === 'appointments' 
        ? allStudents.filter(student => {
            const hasAppointments = allAppointments.some(apt => 
              apt.studentId === student.id && apt.counselorId === user.id
            );
            return hasAppointments;
          })
        : allStudents; // Show all students in 'all' mode
      
      // Transform filtered students to the format expected by the UI
      const studentsData = filteredStudents.map(student => {
        // Get appointments for this student with current counselor
        const studentAppointments = allAppointments.filter(apt => 
          apt.studentId === student.id && apt.counselorId === user.id
        );
        
        // Find last session
        const completedSessions = studentAppointments
          .filter(apt => apt.status === 'completed')
          .sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
          
        // Find next appointment
        const upcomingSessions = studentAppointments
          .filter(apt => apt.status === 'scheduled' && new Date(apt.appointmentDate) > new Date())
          .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
          
        return {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          phone: student.phone,
          studentId: student.studentId || `STU${String(student.id).padStart(3, '0')}`,
          enrollmentNumber: student.enrollmentNumber,
          course: student.course || 'Not specified',
          department: student.department,
          yearOfStudy: student.yearOfStudy || 1,
          admissionYear: student.admissionYear,
          dateOfBirth: student.dateOfBirth,
          hostelName: student.hostelName,
          roomNumber: student.roomNumber,
          guardianName: student.guardianName,
          emergencyContact: student.emergencyContact,
          emergencyRelation: student.emergencyRelation,
          permanentAddress: student.permanentAddress,
          city: student.city,
          state: student.state,
          pinCode: student.pinCode,
          bloodGroup: student.bloodGroup,
          allergies: student.allergies,
          medicalConditions: student.medicalConditions,
          lastSession: completedSessions.length > 0 ? completedSessions[0].appointmentDate : null,
          totalSessions: studentAppointments.filter(apt => apt.status === 'completed').length,
          status: studentAppointments.length > 0 ? 'active' : 'inactive',
          nextAppointment: upcomingSessions.length > 0 ? upcomingSessions[0].appointmentDate : null
        };
      });
      
      // Show all registered students for now
      setStudents(studentsData);
      
      // Load wellness data for each student asynchronously
      const wellnessData: {[key: number]: any} = {};
      await Promise.all(
        studentsData.map(async (student) => {
          wellnessData[student.id] = await getUserWellnessStats(student.id);
        })
      );
      setStudentWellnessData(wellnessData);
      
      console.log('Loaded students for counselor:', studentsData.length);
      console.log('View mode:', viewMode);
      console.log('All students from storage:', allStudents.length);
      console.log('Filtered students for display:', studentsData.length);
    } catch (error) {
      console.error('Error loading students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'counselor') {
      router.push('/dashboard');
      return;
    }
    
    loadStudents();
    
    // Set up periodic refresh every 30 seconds for real-time updates
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing student list...');
      loadStudents();
      setLastRefresh(new Date());
    }, 30000); // 30 seconds for more responsive updates
    
    // Listen for real-time user registration updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'wellness_users' || e.key === 'wellness_appointments') {
        console.log('Detected user/appointment data change, refreshing...');
        loadStudents();
        setLastRefresh(new Date());
      }
    };
    
    // Listen for custom events triggered by registration
    const handleUsersUpdate = (e: CustomEvent) => {
      console.log('Received users update event, refreshing student list...');
      loadStudents();
      setLastRefresh(new Date());
    };
    
    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('wellness-users-updated', handleUsersUpdate as EventListener);
    
    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('wellness-users-updated', handleUsersUpdate as EventListener);
    };
  }, [user, token, router, viewMode]); // Add token and viewMode dependencies

  const handleViewDetails = (student: any) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
  };

  const closeStudentModal = () => {
    setShowStudentModal(false);
    setSelectedStudent(null);
    setShowSessionHistory(false);
  };

  const handleScheduleSession = () => {
    // Close student modal and redirect to appointments page with student pre-selected
    closeStudentModal();
    router.push('/dashboard/appointments?preselect=' + selectedStudent?.id);
  };

  const handleViewSessionHistory = () => {
    setShowSessionHistory(true);
  };

  const filteredStudents = students.filter((student: any) =>
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
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
              <Users className="w-8 h-8 text-wellness-primary" />
              My Students
            </h1>
            <p className="text-netflix-gray-light mt-2">
              Manage your student cases and track their progress
            </p>
            <p className="text-netflix-gray-medium text-sm mt-1">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex bg-netflix-gray-dark rounded-lg p-1">
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  viewMode === 'all'
                    ? 'bg-wellness-primary text-white'
                    : 'text-netflix-gray-light hover:text-white'
                }`}
              >
                All Students
              </button>
              <button
                onClick={() => setViewMode('appointments')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  viewMode === 'appointments'
                    ? 'bg-wellness-primary text-white'
                    : 'text-netflix-gray-light hover:text-white'
                }`}
              >
                My Cases
              </button>
            </div>
            
            <button
              onClick={() => {
                loadStudents();
                setLastRefresh(new Date());
              }}
              className="btn-wellness-outline px-4 py-2 flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Refresh
            </button>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-netflix-gray-medium" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-netflix pl-10 pr-4 py-2 w-64"
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card-netflix p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-netflix-gray-light text-sm mb-1">Total Students</p>
                <p className="text-3xl font-bold text-white">{students.length}</p>
              </div>
              <Users className="w-12 h-12 text-wellness-primary" />
            </div>
          </div>

          <div className="card-netflix p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-netflix-gray-light text-sm mb-1">Active Cases</p>
                <p className="text-3xl font-bold text-wellness-secondary">
                  {students.filter(s => s.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-wellness-secondary" />
            </div>
          </div>

          <div className="card-netflix p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-netflix-gray-light text-sm mb-1">Total Sessions</p>
                <p className="text-3xl font-bold text-wellness-success">
                  {students.reduce((sum, student) => sum + student.totalSessions, 0)}
                </p>
              </div>
              <Calendar className="w-12 h-12 text-wellness-success" />
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="space-y-4">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student, index) => {
            const wellnessData = studentWellnessData[student.id] || {
              wellnessScore: 50,
              moodStreak: 0,
              wellnessStreak: 0,
              isAtRisk: false
            };
            const isAtRisk = wellnessData.isAtRisk;
            
            return (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`card-netflix p-6 hover:bg-netflix-black-light transition-colors duration-300 relative ${
                  isAtRisk ? 'border-2 border-red-500 bg-red-500/5' : ''
                }`}
              >
                {/* At-Risk Indicator */}
                {isAtRisk && (
                  <div className="absolute top-2 right-2 flex items-center space-x-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-red-400 text-xs font-medium">At Risk</span>
                  </div>
                )}
                
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isAtRisk ? 'bg-red-500' : 'bg-wellness-primary'
                    }`}>
                      <User className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {student.firstName} {student.lastName}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          student.status === 'active' 
                            ? 'bg-wellness-success/20 text-wellness-success'
                            : 'bg-netflix-gray-medium/20 text-netflix-gray-medium'
                        }`}>
                          {student.status}
                        </span>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Academic and Contact Info Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-netflix-gray-light">
                          <div>
                            <p className="font-medium">Student ID</p>
                            <p>{student.studentId}</p>
                          </div>
                          <div>
                            <p className="font-medium">Course</p>
                            <p>{student.course}</p>
                          </div>
                          <div>
                            <p className="font-medium">Department</p>
                            <p>{student.department || 'Not specified'}</p>
                          </div>
                          <div>
                            <p className="font-medium">Year</p>
                            <p>Year {student.yearOfStudy}</p>
                          </div>
                        </div>
                        
                        {/* Accommodation Info (if available) */}
                        {(student.hostelName || student.roomNumber) && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-netflix-gray-light bg-netflix-gray-dark/20 p-3 rounded">
                            <div>
                              <p className="font-medium text-wellness-mood-good">Hostel</p>
                              <p>{student.hostelName || 'Not provided'}</p>
                            </div>
                            <div>
                              <p className="font-medium text-wellness-mood-good">Room</p>
                              <p>{student.roomNumber || 'Not provided'}</p>
                            </div>
                            <div>
                              <p className="font-medium text-wellness-mood-good">Emergency Contact</p>
                              <p>{student.emergencyContact ? student.emergencyContact : 'Not provided'}</p>
                            </div>
                            {student.bloodGroup && (
                              <div>
                                <p className="font-medium text-netflix-red">Blood Group</p>
                                <p>{student.bloodGroup}</p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Wellness and Session Info Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-netflix-gray-light">
                          <div>
                            <p className="font-medium">Total Sessions</p>
                            <p>{student.totalSessions}</p>
                          </div>
                          <div>
                            <p className="font-medium">Wellness Score</p>
                            <p className={`font-bold ${
                              wellnessData.wellnessScore >= 80 ? 'text-green-400' :
                              wellnessData.wellnessScore >= 50 ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              {wellnessData.wellnessScore}/100
                            </p>
                          </div>
                          <div>
                            <p className="font-medium">Mood Streak</p>
                            <div className="flex items-center gap-2">
                              <p className={`font-medium ${
                                wellnessData.moodStreak >= 30 ? 'text-yellow-400' :
                                wellnessData.moodStreak >= 14 ? 'text-green-400' :
                                wellnessData.moodStreak >= 7 ? 'text-wellness-primary' :
                                'text-netflix-gray-light'
                              }`}>
                                {wellnessData.moodStreak} days
                              </p>
                              {wellnessData.moodStreak >= 30 && (
                                <span className="text-yellow-400 text-xs">🏆</span>
                              )}
                              {wellnessData.moodStreak >= 14 && wellnessData.moodStreak < 30 && (
                                <span className="text-green-400 text-xs">🔥</span>
                              )}
                              {wellnessData.moodStreak >= 7 && wellnessData.moodStreak < 14 && (
                                <span className="text-wellness-primary text-xs">⭐</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="font-medium">Risk Level</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isAtRisk ? 'bg-red-500/20 text-red-400' :
                              wellnessData.wellnessScore >= 70 ? 'bg-green-500/20 text-green-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {isAtRisk ? 'High Risk' : 
                               wellnessData.wellnessScore >= 70 ? 'Low Risk' : 'Medium Risk'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-3 text-sm text-netflix-gray-light">
                        <div className="flex items-center space-x-1">
                          <Mail className="w-4 h-4" />
                          <span>{student.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>Last session: {student.lastSession ? new Date(student.lastSession).toLocaleDateString() : 'No sessions yet'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {student.nextAppointment && (
                      <div className="text-right text-sm">
                        <p className="text-netflix-gray-light">Next appointment</p>
                        <p className="text-wellness-primary font-medium">
                          {new Date(student.nextAppointment).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    
                    {isAtRisk && (
                      <button 
                        onClick={() => {
                          setSelectedStudent(student);
                          router.push('/dashboard/appointments?preselect=' + student.id);
                        }}
                        className="btn-netflix-red px-3 py-1 text-xs mr-2"
                        title="Schedule priority session"
                      >
                        Priority Session
                      </button>
                    )}
                    
                    <button 
                      onClick={() => handleViewDetails(student)}
                      className="btn-wellness-outline px-4 py-2 text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-netflix-gray-medium mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No students found</h3>
              <p className="text-netflix-gray-light mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms.' 
                  : viewMode === 'appointments'
                    ? 'No students have booked sessions with you yet. Switch to "All Students" to see all registered students.'
                    : 'No students have registered yet.'}
              </p>
              {!searchTerm && (
                <div className="flex justify-center gap-4">
                  <button
                    onClick={loadStudents}
                    className="btn-wellness-outline px-4 py-2"
                  >
                    Refresh List
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/appointments')}
                    className="btn-wellness px-4 py-2"
                  >
                    Manage Appointments
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Student Details Modal */}
        {showStudentModal && selectedStudent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="card-netflix p-6 w-full max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <User className="w-6 h-6 text-wellness-primary" />
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </h3>
                <button
                  onClick={closeStudentModal}
                  className="text-netflix-gray-light hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Academic Information */}
                <div>
                  <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-wellness-primary" />
                    Academic Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-netflix-gray-light">Student ID</p>
                      <p className="text-white">{selectedStudent.studentId}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-netflix-gray-light">Enrollment Number</p>
                      <p className="text-white">{selectedStudent.enrollmentNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-netflix-gray-light">Course</p>
                      <p className="text-white">{selectedStudent.course}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-netflix-gray-light">Department</p>
                      <p className="text-white">{selectedStudent.department || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-netflix-gray-light">Year of Study</p>
                      <p className="text-white">Year {selectedStudent.yearOfStudy}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-netflix-gray-light">Admission Year</p>
                      <p className="text-white">{selectedStudent.admissionYear || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="border-t border-netflix-gray-dark pt-6">
                  <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-wellness-info" />
                    Contact Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-netflix-gray-light">Email Address</p>
                      <p className="text-white">{selectedStudent.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-netflix-gray-light">Phone Number</p>
                      <p className="text-white">{selectedStudent.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-netflix-gray-light">Date of Birth</p>
                      <p className="text-white">{selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString() : 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-netflix-gray-light">Guardian Name</p>
                      <p className="text-white">{selectedStudent.guardianName || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-netflix-gray-light">Emergency Contact</p>
                      <p className="text-white">{selectedStudent.emergencyContact || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-netflix-gray-light">Emergency Relation</p>
                      <p className="text-white">{selectedStudent.emergencyRelation || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Accommodation Information */}
                {(selectedStudent.hostelName || selectedStudent.roomNumber || selectedStudent.permanentAddress) && (
                  <div className="border-t border-netflix-gray-dark pt-6">
                    <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                      <Home className="w-5 h-5 text-wellness-mood-good" />
                      Address Information
                    </h4>
                    <div className="space-y-4">
                      {(selectedStudent.hostelName || selectedStudent.roomNumber) && (
                        <div>
                          <p className="text-sm font-medium text-netflix-gray-light mb-2">Campus Accommodation</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-medium text-netflix-gray-light">Hostel Name</p>
                              <p className="text-white">{selectedStudent.hostelName || 'Not provided'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-netflix-gray-light">Room Number</p>
                              <p className="text-white">{selectedStudent.roomNumber || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {selectedStudent.permanentAddress && (
                        <div>
                          <p className="text-sm font-medium text-netflix-gray-light mb-2">Permanent Address</p>
                          <p className="text-white mb-2">{selectedStudent.permanentAddress}</p>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-xs font-medium text-netflix-gray-light">City</p>
                              <p className="text-white">{selectedStudent.city || 'Not provided'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-netflix-gray-light">State</p>
                              <p className="text-white">{selectedStudent.state || 'Not provided'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-netflix-gray-light">PIN Code</p>
                              <p className="text-white">{selectedStudent.pinCode || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Medical Information */}
                {(selectedStudent.bloodGroup || selectedStudent.allergies || selectedStudent.medicalConditions) && (
                  <div className="border-t border-netflix-gray-dark pt-6">
                    <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-netflix-red" />
                      Medical Information
                      <span className="text-xs text-netflix-gray-light ml-2">(Confidential)</span>
                    </h4>
                    <div className="bg-netflix-gray-dark/30 p-4 rounded-lg space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-netflix-gray-light">Blood Group</p>
                          <p className="text-white">{selectedStudent.bloodGroup || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-netflix-gray-light">Known Allergies</p>
                          <p className="text-white">{selectedStudent.allergies || 'None reported'}</p>
                        </div>
                      </div>
                      {selectedStudent.medicalConditions && (
                        <div>
                          <p className="text-sm font-medium text-netflix-gray-light">Medical Conditions/Medications</p>
                          <p className="text-white text-sm">{selectedStudent.medicalConditions}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Wellness Analytics */}
                <div>
                  <h4 className="text-lg font-medium text-white mb-4">Wellness Analytics</h4>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-netflix-gray-dark/50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-netflix-gray-light mb-2">Wellness Score Trend</p>
                      <div className="flex items-center gap-2">
                        <p className={`text-2xl font-bold ${
                          studentWellnessData[selectedStudent.id]?.wellnessScore >= 80 ? 'text-green-400' :
                          studentWellnessData[selectedStudent.id]?.wellnessScore >= 50 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {studentWellnessData[selectedStudent.id]?.wellnessScore || 50}/100
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          studentWellnessData[selectedStudent.id]?.wellnessScore >= 70 
                            ? 'bg-green-500/20 text-green-400' 
                            : studentWellnessData[selectedStudent.id]?.wellnessScore >= 40
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {studentWellnessData[selectedStudent.id]?.wellnessScore >= 70 
                            ? 'Good' 
                            : studentWellnessData[selectedStudent.id]?.wellnessScore >= 40
                            ? 'Fair'
                            : 'At Risk'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-netflix-gray-dark/50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-netflix-gray-light mb-2">Mood Consistency</p>
                      <div className="flex items-center gap-2">
                        <p className={`text-2xl font-bold ${
                          studentWellnessData[selectedStudent.id]?.moodStreak >= 14 ? 'text-green-400' :
                          studentWellnessData[selectedStudent.id]?.moodStreak >= 7 ? 'text-wellness-primary' :
                          'text-netflix-gray-light'
                        }`}>
                          {studentWellnessData[selectedStudent.id]?.moodStreak || 0}
                        </p>
                        <div className="text-sm">
                          <p className="text-white font-medium">day streak</p>
                          <p className="text-netflix-gray-light">
                            {studentWellnessData[selectedStudent.id]?.totalEntries || 0} total entries
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Risk Assessment */}
                  {studentWellnessData[selectedStudent.id]?.isAtRisk && (
                    <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <h5 className="text-red-400 font-medium">Risk Alert</h5>
                      </div>
                      <p className="text-red-300 text-sm">
                        This student's wellness score is below 50, indicating potential mental health concerns. 
                        Consider scheduling a priority session or checking in via message.
                      </p>
                    </div>
                  )}
                </div>

                {/* Session Information */}
                <div>
                  <h4 className="text-lg font-medium text-white mb-4">Session Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-netflix-gray-light">Total Sessions</p>
                      <p className="text-wellness-primary text-2xl font-bold">{selectedStudent.totalSessions}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-netflix-gray-light">Status</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedStudent.status === 'active' 
                          ? 'bg-wellness-success/20 text-wellness-success'
                          : 'bg-netflix-gray-medium/20 text-netflix-gray-medium'
                      }`}>
                        {selectedStudent.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-netflix-gray-light">Last Session</p>
                      <p className="text-white">{new Date(selectedStudent.lastSession).toLocaleDateString()}</p>
                    </div>
                    {selectedStudent.nextAppointment && (
                      <div>
                        <p className="text-sm font-medium text-netflix-gray-light">Next Appointment</p>
                        <p className="text-wellness-primary font-medium">
                          {new Date(selectedStudent.nextAppointment).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-netflix-gray-dark pt-4">
                  <div className="flex space-x-3">
                    <button 
                      onClick={handleScheduleSession}
                      className="btn-wellness px-4 py-2"
                    >
                      Schedule Session
                    </button>
                    <button 
                      onClick={handleViewSessionHistory}
                      className="btn-wellness-outline px-4 py-2"
                    >
                      View Session History
                    </button>
                    <button
                      onClick={closeStudentModal}
                      className="btn-wellness-outline px-4 py-2 ml-auto"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Session History Modal */}
        {showSessionHistory && selectedStudent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="card-netflix p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Clock className="w-6 h-6 text-wellness-primary" />
                  Session History - {selectedStudent.firstName} {selectedStudent.lastName}
                </h3>
                <button
                  onClick={() => setShowSessionHistory(false)}
                  className="text-netflix-gray-light hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Mock session history data */}
                {[
                  { id: 1, date: '2024-01-15T10:00:00Z', duration: 60, status: 'completed', notes: 'Discussed anxiety management techniques' },
                  { id: 2, date: '2024-01-08T14:00:00Z', duration: 45, status: 'completed', notes: 'Progress review and goal setting' },
                  { id: 3, date: '2024-01-01T11:00:00Z', duration: 60, status: 'completed', notes: 'Initial assessment session' },
                  { id: 4, date: '2023-12-25T15:00:00Z', duration: 30, status: 'cancelled', notes: 'Student cancelled due to illness' },
                  { id: 5, date: '2023-12-18T13:00:00Z', duration: 60, status: 'completed', notes: 'Stress management workshop follow-up' }
                ].map((session, index) => (
                  <div key={session.id} className="border-l-2 border-wellness-primary pl-4 pb-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-white">
                          Session #{session.id}
                        </h4>
                        <p className="text-sm text-netflix-gray-light">
                          {new Date(session.date).toLocaleDateString()} at {new Date(session.date).toLocaleTimeString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        session.status === 'completed' 
                          ? 'bg-wellness-success/20 text-wellness-success'
                          : 'bg-netflix-red/20 text-netflix-red'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                    <div className="text-sm text-netflix-gray-light mb-2">
                      Duration: {session.duration} minutes
                    </div>
                    {session.notes && (
                      <div className="text-sm text-white bg-netflix-gray-dark/50 p-3 rounded">
                        <strong>Notes:</strong> {session.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="border-t border-netflix-gray-dark pt-4 mt-6">
                <button
                  onClick={() => setShowSessionHistory(false)}
                  className="btn-wellness-outline px-6 py-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentsPage;
