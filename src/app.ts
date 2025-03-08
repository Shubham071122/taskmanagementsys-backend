import 'reflect-metadata';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

// Express App
const app = express();
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());


app.get('/', (req, res) => {
    res.send('🚀 Server is running');
});


import userRoutes from './routes/user.routes';
import taskRoutes from './routes/task.routes';

app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);

export { app };
