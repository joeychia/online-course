import { Course, Unit, Lesson, Quiz } from '../types';

const DB_NAME = 'online-course-db';
const DB_VERSION = 1;

interface DBSchema {
  courses: Course[];
  units: Unit[];
  lessons: Lesson[];
  quizzes: Quiz[];
}

class IndexedDBService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("Error opening IndexedDB");
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('courses')) {
          db.createObjectStore('courses', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('units')) {
          db.createObjectStore('units', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('lessons')) {
          db.createObjectStore('lessons', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('quizzes')) {
          db.createObjectStore('quizzes', { keyPath: 'id' });
        }
      };
    });
  }

  private async getStore<K extends keyof DBSchema>(
    storeName: K,
    mode: IDBTransactionMode = 'readonly'
  ): Promise<IDBObjectStore> {
    if (!this.db) {
      await this.init();
    }
    const transaction = this.db!.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // Generic get all items from a store
  async getAll<K extends keyof DBSchema>(storeName: K): Promise<DBSchema[K]> {
    const store = await this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Generic get single item from a store
  async get<K extends keyof DBSchema>(
    storeName: K,
    id: string
  ): Promise<DBSchema[K][number] | null> {
    const store = await this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  // Generic put items into a store
  async putAll<K extends keyof DBSchema>(
    storeName: K,
    items: DBSchema[K][number][]
  ): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const transaction = store.transaction;
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      items.forEach(item => {
        store.put(item);
      });
    });
  }

  // Generic put single item into a store
  async put<K extends keyof DBSchema>(
    storeName: K,
    item: DBSchema[K][number]
  ): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Clear all data from a store
  async clear<K extends keyof DBSchema>(storeName: K): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

export const indexedDBService = new IndexedDBService(); 