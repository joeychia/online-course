import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { CosmosClient } from '@azure/cosmos';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for your frontend
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Initialize Cosmos DB client
const client = new CosmosClient(process.env.VITE_COSMOS_DB_CONNECTION_STRING);
const database = client.database(process.env.VITE_COSMOS_DB_NAME);

// API Routes
app.get('/api/courses', async (req, res) => {
    try {
        const container = database.container('courses');
        const { resources } = await container.items.query('SELECT * FROM c').fetchAll();
        res.json(resources);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
});

app.get('/api/courses/:id', async (req, res) => {
    try {
        const container = database.container('courses');
        const { resource } = await container.item(req.params.id).read();
        if (!resource) {
            res.status(404).json({ error: 'Course not found' });
            return;
        }
        res.json(resource);
    } catch (error) {
        console.error('Error fetching course:', error);
        res.status(500).json({ error: 'Failed to fetch course' });
    }
});

app.get('/api/units/:courseId', async (req, res) => {
    try {
        const container = database.container('units');
        const querySpec = {
            query: 'SELECT * FROM c WHERE c.courseId = @courseId',
            parameters: [{ name: '@courseId', value: req.params.courseId }]
        };
        const { resources } = await container.items.query(querySpec).fetchAll();
        res.json(resources);
    } catch (error) {
        console.error('Error fetching units:', error);
        res.status(500).json({ error: 'Failed to fetch units' });
    }
});

app.get('/api/lessons/:unitId', async (req, res) => {
    try {
        const container = database.container('lessons');
        const querySpec = {
            query: 'SELECT * FROM c WHERE c.unitId = @unitId ORDER BY c.orderIndex',
            parameters: [{ name: '@unitId', value: req.params.unitId }]
        };
        const { resources } = await container.items.query(querySpec).fetchAll();
        res.json(resources);
    } catch (error) {
        console.error('Error fetching lessons:', error);
        res.status(500).json({ error: 'Failed to fetch lessons' });
    }
});

app.get('/api/users/:id', async (req, res) => {
    try {
        const container = database.container('users');
        const { resource } = await container.item(req.params.id).read();
        if (!resource) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(resource);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 