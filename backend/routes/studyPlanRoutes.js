const express = require('express');
const router = express.Router();

const { studyPlanController } = require('../controllers');
const { protect } = require('../middleware');

// All study plan routes require JWT authentication
router.use(protect);

router
  .route('/')
  .post(studyPlanController.createStudyPlan)
  .get(studyPlanController.getStudyPlans);

router
  .route('/:id')
  .get(studyPlanController.getStudyPlanById)
  .put(studyPlanController.updateStudyPlan)
  .patch(studyPlanController.updateStudyPlan)
  .delete(studyPlanController.deleteStudyPlan);

router.patch('/:id/status', studyPlanController.toggleStudyPlanStatus);

module.exports = router;
