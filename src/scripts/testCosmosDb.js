import { CosmosClient } from "@azure/cosmos";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function testCosmosDb() {
    const connectionString = process.env.VITE_COSMOS_DB_CONNECTION_STRING;
    if (!connectionString) {
        throw new Error("Cosmos DB connection string not found in environment variables");
    }

    const client = new CosmosClient(connectionString);
    const database = client.database(process.env.VITE_COSMOS_DB_NAME || "online-course-db");

    // Test functions
    async function testCourseOperations() {
        console.log("\n=== Testing Course Operations ===");
        const container = database.container("courses");
        const { resources: courses } = await container.items.query("SELECT * FROM c").fetchAll();
        console.log("All courses:", JSON.stringify(courses, null, 2));
    }

    async function testUnitOperations() {
        console.log("\n=== Testing Unit Operations ===");
        const container = database.container("units");
        const { resources: units } = await container.items
            .query("SELECT * FROM c WHERE c.courseId = 'course_rbh7nhons'")
            .fetchAll();
        console.log("Units for course_rbh7nhons:", JSON.stringify(units, null, 2));
    }

    async function testLessonOperations() {
        console.log("\n=== Testing Lesson Operations ===");
        const container = database.container("lessons");
        // Get first unit ID
        const unitsContainer = database.container("units");
        const { resources: [firstUnit] } = await unitsContainer.items
            .query("SELECT * FROM c")
            .fetchAll();
        
        if (firstUnit) {
            const { resources: lessons } = await container.items
                .query(`SELECT * FROM c WHERE c.unitId = '${firstUnit.id}' ORDER BY c.orderIndex`)
                .fetchAll();
            console.log(`Lessons for unit ${firstUnit.id}:`, JSON.stringify(lessons, null, 2));
        }
    }

    async function testQuizOperations() {
        console.log("\n=== Testing Quiz Operations ===");
        const container = database.container("quizzes");
        const { resources: quizzes } = await container.items
            .query("SELECT * FROM c")
            .fetchAll();
        console.log("All quizzes:", JSON.stringify(quizzes, null, 2));
    }

    async function testUserOperations() {
        console.log("\n=== Testing User Operations ===");
        const container = database.container("users");
        const { resources: users } = await container.items
            .query("SELECT c.id, c.name, c.email, c.registeredCourses FROM c")
            .fetchAll();
        console.log("Users (basic info):", JSON.stringify(users, null, 2));
    }

    // Run all tests
    try {
        await testCourseOperations();
        await testUnitOperations();
        await testLessonOperations();
        await testQuizOperations();
        await testUserOperations();
        console.log("\nAll tests completed successfully!");
    } catch (error) {
        console.error("Error during testing:", error);
    }
}

// Run the tests
testCosmosDb().catch(error => {
    console.error('Error running tests:', error);
    process.exit(1);
}); 