const express = require('express');
const router = express.Router();
const enterpriseController = require('../controllers/enterpriseController');

router.get('/', enterpriseController.getEnterprises);
router.post('/', enterpriseController.addEnterprise);
router.put('/:id', enterpriseController.updateEnterprise);
router.delete('/:id', enterpriseController.deleteEnterprise);

module.exports = router;