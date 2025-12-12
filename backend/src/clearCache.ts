import { redis } from './lib/redis.js';

(async () => {
  try {
    // Clear emergency cache by deleting specific pattern keys
    const patterns = ['emergency:city:', 'emergency:place:', 'emergency:search:'];
    let cleared = 0;
    
    for (const pattern of patterns) {
      // Delete known city IDs (1-4 for our cities)
      for (let i = 1; i <= 10; i++) {
        await redis.delete(`${pattern}${i}`);
        cleared++;
      }
    }
    
    console.log(`✅ Cleared ${cleared} potential emergency cache keys`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    process.exit(1);
  }
})();
