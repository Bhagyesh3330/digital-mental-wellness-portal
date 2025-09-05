import { getDatabase, initializeSampleData } from './connection';

// Initialize the database and sample data
export const initializeDatabase = () => {
  try {
    console.log('Initializing database...');
    
    // This will create tables if they don't exist
    getDatabase();
    
    // Initialize sample data if needed
    initializeSampleData();
    
    console.log('Database initialization completed successfully');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
};

// Call initialization when the module is imported
if (typeof window === 'undefined') {
  // Only initialize on server side
  initializeDatabase();
}
