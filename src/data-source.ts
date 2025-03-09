    import { DataSource } from 'typeorm';
    import dotenv from 'dotenv';

    dotenv.config();

    const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, PGPORT, JWT_SECRET, JWT_REFRESH_SECRET } = process.env;

    const requiredVars = ['PGHOST', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
    const missingVars = requiredVars.filter(v => !process.env[v]);
    if (missingVars.length > 0) {
        console.error('❌ Missing required environment variables:', missingVars.join(', '));
        process.exit(1);
    }

    export const AppDataSource = new DataSource({
    type: 'postgres',
    host: PGHOST,
    port: parseInt(PGPORT || '5432'),
    username: PGUSER,
    password: PGPASSWORD,
    database: PGDATABASE,
    ssl: {
        rejectUnauthorized: true,  // This is usually correct for Neon, can be false if you have issues.
    },
    entities: [__dirname + '/../models/*.{js,ts}'],
    synchronize: true,  // set to false in production
    logging: false,
    });