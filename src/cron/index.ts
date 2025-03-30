import cron from "node-cron";
import supabase from "../lib/supabase";
import { format, subHours, subDays } from "date-fns";

export const initCronJobs = () => {
  console.log("Initializing cron jobs...");

  cleanupLogs();

  resetEntriesProcessed();
};

const cleanupLogs = () => {
  cron.schedule("0 * * * *", async () => {
    console.log("Running log cleanup job...");

    try {
      const infoLogsCutoff = format(subHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
      const errorWarningLogsCutoff = format(subDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");

      const { error: infoError, count: infoCount } = await supabase
        .from("logs")
        .delete({ count: "exact" })
        .eq("tag", "INFO")
        .lt("created_at", infoLogsCutoff);

      if (infoError) {
        console.error('Error deleting INFO logs:', infoError);
      } else {
        console.log(`Deleted ${infoCount} INFO logs older than 1 hour`);
      }

      const { error: errorError, count: errorCount } = await supabase
        .from("logs")
        .delete({ count: "exact" })
        .eq("tag", "ERROR")
        .lt("created_at", errorWarningLogsCutoff);

      if (errorError) {
        console.error('Error deleting ERROR logs:', errorError);
      } else {
        console.log(`Deleted ${errorCount} ERROR logs older than 1 day`);
      }

      const { error: warningError, count: warningCount } = await supabase
        .from("logs")
        .delete({ count: "exact" })
        .eq("tag", "WARNING")
        .lt("created_at", errorWarningLogsCutoff);

      if (warningError) {
        console.error('Error deleting WARNING logs:', warningError);
      } else {
        console.log(`Deleted ${warningCount} WARNING logs older than 1 day`);
      }
    } catch (error) {
      console.error('Error in log cleanup job:', error);
    }
  });

  console.log("Scheduled log cleanup job (runs every hour)");
};

const resetEntriesProcessed = () => {
  cron.schedule("0 0 1 * *", async () => {
    console.log('Running monthly job to reset entries_processed...');
    
    try {
      const { error, count } = await supabase
        .from('indexer_jobs')
        .update({ entries_processed: 0 })
        .neq('entries_processed', 0);
        
      if (error) {
        console.error('Error resetting entries_processed:', error);
      } else {
        console.log(`Reset entries_processed to 0 for ${count} indexer jobs`);
      }
    } catch (error) {
      console.error('Error in monthly reset job:', error);
    }
  });
  
  console.log('Scheduled monthly job to reset entries_processed (runs on 1st day of each month)');
}; 