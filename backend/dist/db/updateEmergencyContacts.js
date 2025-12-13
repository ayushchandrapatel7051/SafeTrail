import { query } from './connection.js';
async function updateEmergencyContacts() {
    try {
        console.log('🔧 Updating emergency_contacts table...');
        // Check if emergency_contacts table exists
        const tableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'emergency_contacts'
      );
    `);
        if (tableExists.rows[0].exists) {
            console.log('Dropping existing emergency_contacts table...');
            await query('DROP TABLE emergency_contacts CASCADE');
            console.log('✅ Dropped emergency_contacts table');
        }
        // Create new emergency_contacts table with email-only
        console.log('Creating new emergency_contacts table...');
        await query(`
      CREATE TABLE emergency_contacts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        relationship VARCHAR(100),
        is_primary BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Created new emergency_contacts table (email-only)');
        console.log('\n✅ Emergency contacts table updated successfully!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error updating emergency_contacts:', error);
        process.exit(1);
    }
}
updateEmergencyContacts();
//# sourceMappingURL=updateEmergencyContacts.js.map