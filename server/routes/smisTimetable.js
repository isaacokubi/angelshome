import express from 'express';
import { listTimetable, createTimetable, deleteTimetable } from '../controllers/smisTimetableController.js';

const router = express.Router();
router.get('/', listTimetable);
router.post('/', createTimetable);
router.delete('/:id', deleteTimetable);
export default router;
