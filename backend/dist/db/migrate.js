import { runMigrations } from './migrations.js';
async function migrate() {
    try {
        console.log('🔄 Starting database migrations...');
        await runMigrations();
        console.log('✨ Migration complete!');
        process.exit(0);
    }
    catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}
migrate();
//# sourceMappingURL=migrate.js.map