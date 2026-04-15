const userController = {
  getUsers: async (req, res) => {
    res.status(200).json({ success: true, message: 'Get users endpoint ready!' });
  }
};
module.exports = userController;