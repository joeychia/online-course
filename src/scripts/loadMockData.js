import { CosmosClient } from "@azure/cosmos";
import dotenv from "dotenv";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadMockData() {
    // Get connection string from environment variable
    const connectionString = process.env.VITE_COSMOS_DB_CONNECTION_STRING;
    if (!connectionString) {
        throw new Error("Cosmos DB connection string not found in environment variables");
    }

    const client = new CosmosClient(connectionString);
    const databaseName = process.env.VITE_COSMOS_DB_NAME || "online-course-db";
    const database = client.database(databaseName);

    // Read mock data
    const mockDataPath = path.join(__dirname, '../data/mock/mockData.json');
    const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));

    // Function to add IDs to items if they don't have one
    const addIds = (items, prefix) => {
        return Object.entries(items).map(([key, value]) => ({
            id: key.startsWith(prefix) ? key : `${prefix}_${key}`,
            ...value
        }));
    };

    // Load data for each container
    const containers = {
        courses: addIds(mockData.courses || {}, 'course'),
        units: addIds(mockData.units || {}, 'unit'),
        lessons: addIds(mockData.lessons || {}, 'lesson'),
        quizzes: addIds(mockData.quizzes || {}, 'quiz'),
        groups: addIds(mockData.groups || {}, 'group'),
        users: addIds(mockData.users || {}, 'user')
    };

    // Function to upsert items
    async function upsertItems(containerName, items) {
        console.log(`Loading ${items.length} items into ${containerName}`);
        const container = database.container(containerName);
        
        for (const item of items) {
            try {
                await container.items.upsert(item);
                console.log(`Upserted item with id ${item.id} in ${containerName}`);
            } catch (error) {
                console.error(`Error upserting item ${item.id} in ${containerName}:`, error.message);
            }
        }
    }

    // Load data into each container
    for (const [containerName, items] of Object.entries(containers)) {
        if (items.length > 0) {
            await upsertItems(containerName, items);
        }
    }

    console.log('Mock data loaded successfully!');
}

// Run the data loading
loadMockData().catch(error => {
    console.error('Error loading mock data:', error);
    process.exit(1);
}); 