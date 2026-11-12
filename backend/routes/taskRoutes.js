const express = require('express');
const router = express.Router();

const { taskController } = require('../controllers');
const { protect } = require('../middleware');

// All task routes require JWT authentication
router.use(protect);

router
  .route('/')
  .post(taskController.createTask)
  .get(taskController.getTasks);

router
  .route('/:id')
  .get(taskController.getTaskById)
  .put(taskController.updateTask)
  .patch(taskController.updateTask)
  .delete(taskController.deleteTask);

router.patch('/:id/toggle', taskController.toggleTaskStatus);

module.exports = router;

