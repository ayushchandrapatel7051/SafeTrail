import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();
const client = createClient({
    socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    password: process.env.REDIS_PASSWORD || undefined,
});
client.on('error', (err) => {
    console.error('Redis client error:', err);
});
// Connect to Redis
(async () => {
    try {
        await client.connect();
        console.log('Redis connected');
    }
    catch (error) {
        console.error('Redis connection error:', error);
    }
})();
export const redis = {
    async get(key) {
        try {
            const value = await client.get(key);
            return value ? JSON.parse(value) : null;
        }
        catch (error) {
            console.error('Redis get error:', error);
            return null;
        }
    },
    async set(key, value, expiresIn) {
        try {
            await client.set(key, JSON.stringify(value));
            if (expiresIn) {
                await client.expire(key, expiresIn);
            }
            return true;
        }
        catch (error) {
            console.error('Redis set error:', error);
            return false;
        }
    },
    async delete(key) {
        try {
            await client.del(key);
            return true;
        }
        catch (error) {
            console.error('Redis delete error:', error);
            return false;
        }
    },
    async flush() {
        try {
            await client.flushDb();
            return true;
        }
        catch (error) {
            console.error('Redis flush error:', error);
            return false;
        }
    },
};
export default client;
//# sourceMappingURL=redis.js.map