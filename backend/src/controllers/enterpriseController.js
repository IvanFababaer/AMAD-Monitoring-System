const enterpriseModel = require('../models/enterpriseModel');

const enterpriseController = {
  getEnterprises: async (req, res) => {
    try {
      const data = await enterpriseModel.getAll();
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  addEnterprise: async (req, res) => {
    try {
      const data = await enterpriseModel.create(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updateEnterprise: async (req, res) => {
    try {
      const data = await enterpriseModel.update(req.params.id, req.body);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  deleteEnterprise: async (req, res) => {
    try {
      await enterpriseModel.delete(req.params.id);
      res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = enterpriseController;