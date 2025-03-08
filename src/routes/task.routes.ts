import { Router } from 'express';
import { createTask, getTasks, getTask, updateTask, deleteTask } from '../controllers/task.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Protect all routes with authentication middleware
router.use(authMiddleware);

// RESTful task routes
router.get('/', getTasks);        // Get all tasks
router.post('/', createTask);     // Create a task
router.get('/:id', getTask);      // Get a single task
router.put('/:id', updateTask);   // Update a task
router.delete('/:id', deleteTask); // Delete a task

export default router;
