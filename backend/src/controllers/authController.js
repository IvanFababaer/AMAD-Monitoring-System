const authController = {
  register: async (req, res) => {
    res.status(201).json({ success: true, message: 'Registration endpoint ready!' });
  },
  login: async (req, res) => {
    res.status(200).json({ success: true, message: 'Login endpoint ready!' });
  },
  logout: async (req, res) => {
    res.status(200).json({ success: true, message: 'Logout endpoint ready!' });
  }
};

module.exports = authController;