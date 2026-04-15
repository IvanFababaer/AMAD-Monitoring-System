const multer = require('multer');

// Store the file in memory as a Buffer, rather than writing it to disk
const storage = multer.memoryStorage();

// Create a filter to ensure users only upload images (no PDFs, scripts, etc.)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error('Invalid file type. Only images are allowed!'), false); // Reject the file
  }
};

// Initialize the Multer upload object with our configurations
const uploadMiddleware = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max file size limit per photo
  },
  fileFilter: fileFilter
});

module.exports = uploadMiddleware;