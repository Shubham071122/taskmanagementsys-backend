import { Request, Response } from 'express';
import { Task, TaskStatus } from '../models/Task';
import { validate } from 'class-validator';
import { AppDataSource } from '../data-source';

// Get task repository
const taskRepository = AppDataSource.getRepository(Task);

export const createTask = async (req: Request, res: Response) => {
    try {
        const { title, description, dueDate, status } = req.body;
        const user = req.user!;

        const task = taskRepository.create({
            title,
            description,
            status: status as TaskStatus,
            dueDate: new Date(dueDate),
            user
        });

        const errors = await validate(task);
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        await taskRepository.save(task);

        return res.status(201).json({
            id: task.id,
            title: task.title,
            description: task.description,
            dueDate: task.dueDate,
            status: task.status,
            userId: task.user.id
        });
    } catch (error) {
        console.error("Error creating task:", error);
        return res.status(500).json({ message: 'Error creating task' });
    }
};

export const getTasks = async (req: Request, res: Response) => {
    try {
        const user = req.user!;
        const tasks = await taskRepository.find({
            where: { user: { id: user.id } },
            order: { createdAt: 'DESC' }
        });

        return res.json(tasks);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return res.status(500).json({ message: 'Error fetching tasks' });
    }
};

export const getTask = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const user = req.user!;

        const task = await taskRepository.findOne({
            where: { id, user: { id: user.id } }
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        return res.json(task);
    } catch (error) {
        console.error("Error fetching task:", error);
        return res.status(500).json({ message: 'Error fetching task' });
    }
};

export const updateTask = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const user = req.user!;
        const { title, description, status, dueDate } = req.body;

        const task = await taskRepository.findOne({
            where: { id, user: { id: user.id } }
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        task.title = title || task.title;
        task.description = description || task.description;
        task.status = status || task.status;
        task.dueDate = dueDate ? new Date(dueDate) : task.dueDate;

        const errors = await validate(task);
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        await taskRepository.save(task);
        return res.json(task);
    } catch (error) {
        console.error("Error updating task:", error);
        return res.status(500).json({ message: 'Error updating task' });
    }
};

export const deleteTask = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const user = req.user!;

        const task = await taskRepository.findOne({
            where: { id, user: { id: user.id } }
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        await taskRepository.remove(task);
        return res.status(204).send();
    } catch (error) {
        console.error("Error deleting task:", error);
        return res.status(500).json({ message: 'Error deleting task' });
    }
};
