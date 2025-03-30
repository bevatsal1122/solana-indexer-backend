import { initCronJobs } from './index';
import supabase from '../lib/supabase';

/**
 * Test script to manually trigger cron jobs
 * Usage: ts-node src/cron/test.ts
 */
const testCronJobs = async () => {
  try {
    console.log('Testing cron jobs...');

    // Check database connection
    const { data, error } = await supabase.from('logs').select('id').limit(1);
    
    if (error) {
      console.error('Database connection error:', error);
      process.exit(1);
    }
    
    console.log('Database connection successful');
    
    // Initialize cron jobs
    initCronJobs();
    
    // Keep the process running to see the cron jobs in action
    console.log('Cron jobs initialized. Test script will keep running to allow jobs to execute.');
    console.log('Press Ctrl+C to exit.');
    
  } catch (error) {
    console.error('Test script error:', error);
    process.exit(1);
  }
};

// Run the test
testCronJobs(); 