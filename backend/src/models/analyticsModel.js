const supabase = require('../config/supabase');

const analyticsModel = {
  getSummary: async (province) => {
    try {
      console.log(`[Database] Fetching stats for: ${province || 'All'}`);

      let query = supabase.from('trees').select('health_status, province, municipality');
      
      if (province && province !== 'All') {
        query = query.eq('province', province);
      }
      
      const { data, error } = await query;
      
      // If Supabase throws an error, log it to the terminal!
      if (error) {
        console.error("[Database Error]:", error);
        throw error;
      }

      // THE SAFETY NET: If data is null, use an empty array so .length doesn't crash
      const safeData = data || [];

      const totalTrees = safeData.length;
      const healthStatus = { 'Healthy': 0, 'Needs Attention': 0, 'Diseased': 0 };
      const locationDistribution = {};

      safeData.forEach(tree => {
        healthStatus[tree.health_status] = (healthStatus[tree.health_status] || 0) + 1;
        const locationKey = province && province !== 'All' ? tree.municipality : tree.province;
        locationDistribution[locationKey] = (locationDistribution[locationKey] || 0) + 1;
      });

      return { totalTrees, healthStatus, locationDistribution };
      
    } catch (err) {
      console.error("Fatal Error in analyticsModel:", err.message);
      throw err; // Pass error up to the controller
    }
  }
};

module.exports = analyticsModel;