// Data cleanup utility
// Clears existing mock data except resources

export const cleanupAllDataExceptResources = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    console.log('Cleaning up existing data (keeping resources)...');
    
    // Clear appointments data
    localStorage.removeItem('wellness_appointments');
    localStorage.removeItem('wellness_appointment_next_id');
    
    // Clear mood data
    localStorage.removeItem('wellness_mood_entries');
    localStorage.removeItem('wellness_mood_next_id');
    
    // Clear notifications data
    localStorage.removeItem('wellness_notifications');
    localStorage.removeItem('wellness_notification_next_id');
    localStorage.removeItem('wellness_previous_scores');
    
    // Keep resources data intact
    // localStorage.removeItem('wellness_resources'); // DON'T REMOVE
    // localStorage.removeItem('wellness_resource_next_id'); // DON'T REMOVE
    
    console.log('Data cleanup completed! Resources preserved.');
    
    return;
  } catch (error) {
    console.error('Error during data cleanup:', error);
  }
};

export const initializeCleanDatabase = (): void => {
  cleanupAllDataExceptResources();
  
  // Reset ID counters (but keep resource IDs)
  localStorage.setItem('wellness_appointment_next_id', '1');
  localStorage.setItem('wellness_mood_next_id', '1');
  localStorage.setItem('wellness_notification_next_id', '1');
  
  // Set flag to prevent auto-initialization of sample data
  localStorage.setItem('wellness_system_initialized', 'true');
  
  console.log('Database initialized with clean slate (resources preserved).');
};

export const getDataSummary = (): {[key: string]: number} => {
  if (typeof window === 'undefined') return {};
  
  const summary: {[key: string]: number} = {};
  
  // Count appointments
  try {
    const appointments = JSON.parse(localStorage.getItem('wellness_appointments') || '[]');
    summary.appointments = appointments.length;
  } catch {
    summary.appointments = 0;
  }
  
  // Count mood entries
  try {
    const moodEntries = JSON.parse(localStorage.getItem('wellness_mood_entries') || '[]');
    summary.moodEntries = moodEntries.length;
  } catch {
    summary.moodEntries = 0;
  }
  
  // Count resources
  try {
    const resources = JSON.parse(localStorage.getItem('wellness_resources') || '[]');
    summary.resources = resources.length;
  } catch {
    summary.resources = 0;
  }
  
  // Count notifications
  try {
    const notifications = JSON.parse(localStorage.getItem('wellness_notifications') || '[]');
    summary.notifications = notifications.length;
  } catch {
    summary.notifications = 0;
  }
  
  return summary;
};
