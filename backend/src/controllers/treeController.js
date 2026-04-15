const treeModel = require('../models/treeModel');
const supabase = require('../config/supabase');

// Helper function to clean FormData strings before they hit the database
const cleanDataTypes = (body) => {
  let data = { ...body };
  
  // 🚨 THE FIX: Strip out locked database fields so PostgreSQL doesn't crash! 🚨
  delete data.id;
  delete data.created_at;
  delete data.enterprises; 

  // Fix empty IDs
  if (data.enterprise_id === '' || data.enterprise_id === 'null') {
    data.enterprise_id = null;
  }
  
  // Convert number fields back to actual numbers
  if (data.hectares) data.hectares = parseFloat(data.hectares);
  if (data.age) data.age = parseInt(data.age, 10);
  if (data.latitude) data.latitude = parseFloat(data.latitude);
  if (data.longitude) data.longitude = parseFloat(data.longitude);
  
  return data;
};
const treeController = {
  // --- GET ALL TREES ---
  // --- GET ALL TREES ---
  // --- GET ALL TREES ---
  getTrees: async (req, res) => {
    try {
      // THIS LINE NOW PERFECTLY MATCHES YOUR MODEL!
      const data = await treeModel.getAllTrees(); 
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // --- GET MAP MARKERS ---
  getMapMarkers: async (req, res) => {
    try {
      const data = await treeModel.getMapMarkers(req.query.province);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // --- ADD NEW TREE ---
  addTree: async (req, res) => {
    try {
      let treeData = cleanDataTypes(req.body);

      // Handle Image Upload
      if (req.file) {
        const file = req.file;
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, ''); // Remove weird characters
        const fileName = `${Date.now()}-${safeName}`;

        const { error: storageError } = await supabase.storage
          .from('tree-photos')
          .upload(fileName, file.buffer, { contentType: file.mimetype });

        if (storageError) throw storageError;

        const { data: urlData } = supabase.storage.from('tree-photos').getPublicUrl(fileName);
        treeData.image_url = urlData.publicUrl;
      }

      const newTree = await treeModel.createTree(treeData);
      res.status(201).json({ success: true, data: newTree });
    } catch (error) {
      console.error("Add Tree Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // --- UPDATE EXISTING TREE ---
  updateTree: async (req, res) => {
    try {
      let treeData = cleanDataTypes(req.body);

      // Handle Image Upload (Exactly the same as Add Tree)
      if (req.file) {
        const file = req.file;
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '');
        const fileName = `${Date.now()}-${safeName}`;

        const { error: storageError } = await supabase.storage
          .from('tree-photos')
          .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: true });

        if (storageError) throw storageError;

        const { data: urlData } = supabase.storage.from('tree-photos').getPublicUrl(fileName);
        treeData.image_url = urlData.publicUrl;
      }

      const updatedTree = await treeModel.updateTree(req.params.id, treeData);
      res.status(200).json({ success: true, data: updatedTree });
    } catch (error) {
      console.error("Update Tree Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // --- DELETE TREE ---
  deleteTree: async (req, res) => {
    try {
      await treeModel.deleteTree(req.params.id);
      res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = treeController;