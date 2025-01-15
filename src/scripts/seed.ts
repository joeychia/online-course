import { seedFirestore } from './seedFirestoreAdmin';

async function main() {
    try {
        await seedFirestore();
    } catch (error) {
        console.error('Error running seed script:', error);
        process.exit(1);
    }
}

main(); 