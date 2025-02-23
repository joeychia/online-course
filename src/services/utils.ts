export const WRITE_TIMEOUT_MS = 10000; // 10 seconds timeout for write operations

export const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number = WRITE_TIMEOUT_MS): Promise<T> => {
    const timeoutPromise = new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]);
};
