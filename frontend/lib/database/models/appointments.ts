import { getDatabase } from '../connection';
import { userModel } from './users';

export interface DatabaseAppointment {
  id: number;
  studentId: number;
  counselorId: number;
  appointmentDate: string;
  durationMinutes: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  reason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Joined fields from users table
  studentFirstName?: string;
  studentLastName?: string;
  counselorFirstName?: string;
  counselorLastName?: string;
}

export interface CreateAppointmentData {
  studentId: number;
  counselorId: number;
  appointmentDate: string;
  durationMinutes?: number;
  reason?: string;
}

class AppointmentModel {
  private db = getDatabase();

  // Get appointments for a user (student or counselor)
  getAppointmentsForUser(userId: number, userRole: 'student' | 'counselor'): DatabaseAppointment[] {
    const whereClause = userRole === 'student' ? 'a.studentId = ?' : 'a.counselorId = ?';
    
    const stmt = this.db.prepare(`
      SELECT 
        a.*,
        s.firstName as studentFirstName,
        s.lastName as studentLastName,
        c.firstName as counselorFirstName,
        c.lastName as counselorLastName
      FROM appointments a
      JOIN users s ON a.studentId = s.id
      JOIN users c ON a.counselorId = c.id
      WHERE ${whereClause}
      ORDER BY a.appointmentDate DESC
    `);

    return stmt.all(userId) as DatabaseAppointment[];
  }

  // Get appointment by ID
  getAppointmentById(id: number): DatabaseAppointment | null {
    const stmt = this.db.prepare(`
      SELECT 
        a.*,
        s.firstName as studentFirstName,
        s.lastName as studentLastName,
        c.firstName as counselorFirstName,
        c.lastName as counselorLastName
      FROM appointments a
      JOIN users s ON a.studentId = s.id
      JOIN users c ON a.counselorId = c.id
      WHERE a.id = ?
    `);

    const result = stmt.get(id) as DatabaseAppointment;
    return result || null;
  }

  // Create appointment
  createAppointment(appointmentData: CreateAppointmentData): DatabaseAppointment {
    // Validate that both student and counselor exist
    const student = userModel.getUserById(appointmentData.studentId);
    const counselor = userModel.getUserById(appointmentData.counselorId);

    if (!student || student.role !== 'student') {
      throw new Error('Invalid student ID');
    }

    if (!counselor || counselor.role !== 'counselor') {
      throw new Error('Invalid counselor ID');
    }

    const stmt = this.db.prepare(`
      INSERT INTO appointments (studentId, counselorId, appointmentDate, durationMinutes, reason)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      appointmentData.studentId,
      appointmentData.counselorId,
      appointmentData.appointmentDate,
      appointmentData.durationMinutes || 60,
      appointmentData.reason || null
    );

    const newAppointment = this.getAppointmentById(result.lastInsertRowid as number);
    if (!newAppointment) {
      throw new Error('Failed to create appointment');
    }

    console.log(`Appointment created: ${newAppointment.counselorFirstName} ${newAppointment.counselorLastName} with ${newAppointment.studentFirstName} ${newAppointment.studentLastName}`);
    return newAppointment;
  }

  // Update appointment status
  updateAppointmentStatus(id: number, status: DatabaseAppointment['status'], notes?: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE appointments 
      SET status = ?, notes = ?, updatedAt = ?
      WHERE id = ?
    `);

    const result = stmt.run(status, notes || null, new Date().toISOString(), id);
    
    if (result.changes > 0) {
      console.log(`Appointment ${id} status updated to: ${status}`);
    }
    
    return result.changes > 0;
  }

  // Mark appointment as completed
  markAppointmentCompleted(id: number, notes?: string): boolean {
    return this.updateAppointmentStatus(id, 'completed', notes);
  }

  // Cancel appointment
  cancelAppointment(id: number, notes?: string): boolean {
    return this.updateAppointmentStatus(id, 'cancelled', notes);
  }

  // Get upcoming appointments
  getUpcomingAppointments(userId: number, userRole: 'student' | 'counselor'): DatabaseAppointment[] {
    const whereClause = userRole === 'student' ? 'a.studentId = ?' : 'a.counselorId = ?';
    
    const stmt = this.db.prepare(`
      SELECT 
        a.*,
        s.firstName as studentFirstName,
        s.lastName as studentLastName,
        c.firstName as counselorFirstName,
        c.lastName as counselorLastName
      FROM appointments a
      JOIN users s ON a.studentId = s.id
      JOIN users c ON a.counselorId = c.id
      WHERE ${whereClause} AND a.status = 'scheduled' AND a.appointmentDate > datetime('now')
      ORDER BY a.appointmentDate ASC
    `);

    return stmt.all(userId) as DatabaseAppointment[];
  }

  // Get appointments by status
  getAppointmentsByStatus(status: DatabaseAppointment['status']): DatabaseAppointment[] {
    const stmt = this.db.prepare(`
      SELECT 
        a.*,
        s.firstName as studentFirstName,
        s.lastName as studentLastName,
        c.firstName as counselorFirstName,
        c.lastName as counselorLastName
      FROM appointments a
      JOIN users s ON a.studentId = s.id
      JOIN users c ON a.counselorId = c.id
      WHERE a.status = ?
      ORDER BY a.appointmentDate DESC
    `);

    return stmt.all(status) as DatabaseAppointment[];
  }

  // Get appointments for today
  getTodayAppointments(): DatabaseAppointment[] {
    const stmt = this.db.prepare(`
      SELECT 
        a.*,
        s.firstName as studentFirstName,
        s.lastName as studentLastName,
        c.firstName as counselorFirstName,
        c.lastName as counselorLastName
      FROM appointments a
      JOIN users s ON a.studentId = s.id
      JOIN users c ON a.counselorId = c.id
      WHERE date(a.appointmentDate) = date('now')
      ORDER BY a.appointmentDate ASC
    `);

    return stmt.all() as DatabaseAppointment[];
  }

  // Get appointment statistics
  getAppointmentStats(userId?: number, userRole?: 'student' | 'counselor') {
    let whereClause = '';
    let params: any[] = [];

    if (userId && userRole) {
      whereClause = userRole === 'student' ? 'WHERE studentId = ?' : 'WHERE counselorId = ?';
      params = [userId];
    }

    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as noShow,
        SUM(CASE WHEN status = 'scheduled' AND appointmentDate > datetime('now') THEN 1 ELSE 0 END) as upcoming
      FROM appointments
      ${whereClause}
    `);

    return stmt.get(...params);
  }

  // Get counselor availability (appointments per counselor)
  getCounselorAvailability() {
    const stmt = this.db.prepare(`
      SELECT 
        c.id,
        c.firstName,
        c.lastName,
        c.specialization,
        COUNT(a.id) as totalAppointments,
        SUM(CASE WHEN a.status = 'scheduled' AND a.appointmentDate > datetime('now') THEN 1 ELSE 0 END) as upcomingAppointments
      FROM users c
      LEFT JOIN appointments a ON c.id = a.counselorId
      WHERE c.role = 'counselor' AND c.isActive = 1
      GROUP BY c.id, c.firstName, c.lastName, c.specialization
      ORDER BY upcomingAppointments ASC, c.firstName
    `);

    return stmt.all();
  }

  // Delete appointment (hard delete - use with caution)
  deleteAppointment(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM appointments WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}

export const appointmentModel = new AppointmentModel();
