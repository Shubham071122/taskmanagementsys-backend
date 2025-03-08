import dotenv from 'dotenv';
import { AppDataSource } from './data-source';
// import { app } from './app';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());

AppDataSource.initialize()
  .then(() => {
    console.log('✅ Connected to Neon PostgreSQL successfully');

    // 🛠 Import routes only after the DB is initialized
    import('./routes/user.routes').then((userRoutes) => {
      app.use('/api/users', userRoutes.default);
    });

    app.get('/', (req, res) => {
      res.send('🚀 Server is running');
  });

    import('./routes/task.routes').then((taskRoutes) => {
      app.use('/api/tasks', taskRoutes.default);
    });

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });