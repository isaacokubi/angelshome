const express = require('express');
const { requireSchoolAuth, requireSchoolRole } = require('../middleware/schoolAuth');
const { listTimetable, createTimetable, updateTimetable, deleteTimetable, generateTimetable } = require('../controllers/smisTimetableController');
const { listScopedTimetable } = require('../controllers/scopedTimetableController');

const router = express.Router();
const adminOnly = requireSchoolRole('admin');

router.get('/', requireSchoolAuth, listScopedTimetable);
router.post('/generate', requireSchoolAuth, adminOnly, generateTimetable);
router.post('/', requireSchoolAuth, adminOnly, createTimetable);
router.patch('/:id', requireSchoolAuth, adminOnly, updateTimetable);
router.delete('/:id', requireSchoolAuth, adminOnly, deleteTimetable);

module.exports = router;
