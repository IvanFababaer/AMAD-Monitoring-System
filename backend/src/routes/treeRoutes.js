const express = require('express');
const router = express.Router();
const treeController = require('../controllers/treeController');
const multer = require('multer');

// Configure Multer
const upload = multer({ storage: multer.memoryStorage() });

// --- GET ROUTES ---
router.get('/map-markers', treeController.getMapMarkers);
router.get('/', treeController.getTrees);

// --- POST (ADD) ---
// Critical: 'photo' must match data.append('photo', ...) in your React Frontend
router.post('/', upload.single('photo'), treeController.addTree);

// --- PUT (UPDATE) ---
// Critical: Added upload.single('photo') here so updates can handle images too
router.put('/:id', upload.single('photo'), treeController.updateTree);

// --- DELETE ---
router.delete('/:id', treeController.deleteTree);

module.exports = router;