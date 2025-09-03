-- Sample data for Digital Mental Wellness Portal

-- Insert sample users
INSERT INTO users (email, password_hash, first_name, last_name, role, phone, hostel_name, room_number) VALUES
('john.student@university.edu', '$2b$10$example.hash.for.password', 'John', 'Doe', 'student', '+1234567890', 'North Hall', '101A'),
('jane.student@university.edu', '$2b$10$example.hash.for.password', 'Jane', 'Smith', 'student', '+1234567891', 'South Hall', '205B'),
('dr.counselor@university.edu', '$2b$10$example.hash.for.password', 'Dr. Sarah', 'Johnson', 'counselor', '+1234567892', NULL, NULL),
('admin.user@university.edu', '$2b$10$example.hash.for.password', 'Admin', 'Wilson', 'admin', '+1234567893', NULL, NULL);

-- Insert student profiles
INSERT INTO student_profiles (user_id, student_id, course, year_of_study, date_of_birth, guardian_contact) VALUES
(1, 'STU001', 'Computer Science', 2, '2003-05-15', 'parent1@email.com'),
(2, 'STU002', 'Psychology', 3, '2002-08-22', 'parent2@email.com');

-- Insert counselor profiles
INSERT INTO counselor_profiles (user_id, license_number, specialization, years_of_experience, qualifications, availability_schedule) VALUES
(3, 'LIC12345', 'Anxiety and Depression Counseling', 8, 'PhD in Clinical Psychology, Licensed Professional Counselor', 
 '{"monday": ["9:00-17:00"], "tuesday": ["9:00-17:00"], "wednesday": ["9:00-17:00"], "thursday": ["9:00-17:00"], "friday": ["9:00-15:00"]}');

-- Insert admin profiles
INSERT INTO admin_profiles (user_id, department, permissions) VALUES
(4, 'Student Affairs', '{"users": "full", "appointments": "full", "resources": "full", "reports": "full"}');

-- Insert sample mood entries
INSERT INTO mood_entries (user_id, mood_level, notes, energy_level, sleep_hours, stress_level) VALUES
(1, 'good', 'Feeling positive today after a good nights sleep', 7, 8.0, 3),
(1, 'neutral', 'Average day, some study stress', 5, 6.5, 6),
(2, 'excellent', 'Great day! Finished my project successfully', 9, 7.5, 2);

-- Insert sample wellness goals
INSERT INTO wellness_goals (user_id, title, description, target_date, progress_percentage) VALUES
(1, 'Improve Sleep Schedule', 'Get 7-8 hours of sleep daily and sleep before midnight', '2024-12-31', 60),
(1, 'Daily Meditation', 'Practice 10 minutes of meditation every morning', '2024-12-31', 40),
(2, 'Exercise Routine', 'Establish a regular exercise routine 3 times per week', '2024-12-31', 80);

-- Insert sample goal progress
INSERT INTO goal_progress (goal_id, progress_note, progress_value) VALUES
(1, 'Slept 8 hours last night, went to bed at 11 PM', 70),
(2, 'Completed morning meditation session', 45),
(3, 'Went for a 30-minute jog today', 85);

-- Insert sample appointments
INSERT INTO appointments (student_id, counselor_id, appointment_date, reason, status) VALUES
(1, 3, '2024-09-10 14:00:00', 'Stress management and study anxiety', 'scheduled'),
(2, 3, '2024-09-12 15:00:00', 'Follow-up session on coping strategies', 'scheduled');

-- Insert sample resources
INSERT INTO resources (title, content, resource_type, category, author_id, is_published) VALUES
('Managing Study Stress', 'Comprehensive guide on managing academic stress and maintaining mental wellness during exams...', 'article', 'stress-management', 3, true),
('5-Minute Breathing Exercise', 'Quick breathing exercise to reduce anxiety and improve focus...', 'exercise', 'anxiety', 3, true),
('Sleep Hygiene for Students', 'Best practices for maintaining healthy sleep habits in hostel environments...', 'article', 'sleep', 3, true);

-- Insert emergency contacts
INSERT INTO emergency_contacts (name, phone, email, role, availability) VALUES
('Campus Crisis Helpline', '+1-800-CRISIS', 'crisis@university.edu', 'crisis helpline', '24/7'),
('University Health Center', '+1234567999', 'health@university.edu', 'medical', 'Mon-Fri 8AM-6PM'),
('Dr. Sarah Johnson', '+1234567892', 'dr.counselor@university.edu', 'counselor', 'Mon-Fri 9AM-5PM');

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, type) VALUES
(1, 'Upcoming Appointment', 'You have an appointment with Dr. Sarah Johnson tomorrow at 2:00 PM', 'appointment'),
(1, 'Goal Reminder', 'Don\'t forget to practice your daily meditation!', 'reminder'),
(2, 'New Resource Available', 'Check out the new stress management article in your resources', 'alert');
