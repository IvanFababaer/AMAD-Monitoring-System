const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors()); 
app.use(express.json()); 

// Import Routes
const treeRoutes = require('./routes/treeRoutes');
const enterpriseRoutes = require('./routes/enterpriseRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

// Basic health check route
app.get('/', (req, res) => {
  res.send('🌿 AgriTreeTracker API is awake and listening!');
});

// Register API Routes (These connect to the files we built earlier!)
app.use('/api/trees', treeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/enterprises', require('./routes/enterpriseRoutes')); 
// Note: Adjust the path if your routes folder is located somewhere else!

module.exports = app;