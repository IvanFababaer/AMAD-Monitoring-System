const analyticsModel = require('../models/analyticsModel');

const analyticsController = {
  getSummary: async (req, res) => {
    try {
      const { province } = req.query; 
      console.log("➡️ Dashboard requested data for:", province || "All Provinces"); 
      
      // THIS is the line that was breaking! It must match the Model exactly.
      const stats = await analyticsModel.getSummary(province);
      
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = analyticsController;