import { CosmosClient } from "@azure/cosmos";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function setupCosmosDb() {
    // Get connection string from environment variable
    const connectionString = process.env.VITE_COSMOS_DB_CONNECTION_STRING;
    if (!connectionString) {
        throw new Error("Cosmos DB connection string not found in environment variables");
    }

    const client = new CosmosClient(connectionString);
    const databaseName = process.env.VITE_COSMOS_DB_NAME || "online-course-db";

    console.log(`Creating database: ${databaseName}`);
    const { database } = await client.databases.createIfNotExists({ id: databaseName });

    // Container configurations with partition keys
    const containers = [
        { id: 'courses', partitionKey: '/id' },
        { id: 'units', partitionKey: '/courseId' },
        { id: 'lessons', partitionKey: '/unitId' },
        { id: 'quizzes', partitionKey: '/id' },
        { id: 'groups', partitionKey: '/courseId' },
        { id: 'grades', partitionKey: '/courseId' },
        { id: 'notes', partitionKey: '/lessonId' },
        { id: 'users', partitionKey: '/id' }
    ];

    // Create containers
    for (const containerConfig of containers) {
        console.log(`Creating container: ${containerConfig.id}`);
        await database.containers.createIfNotExists({
            id: containerConfig.id,
            partitionKey: containerConfig.partitionKey
        });
    }

    console.log('Database and containers setup completed successfully!');
}

// Run the setup
setupCosmosDb().catch(error => {
    console.error('Error setting up Cosmos DB:', error);
    process.exit(1);
}); 