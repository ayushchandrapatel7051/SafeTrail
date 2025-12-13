import { query } from './connection.js';
async function updateAllCounts() {
    console.log('🔄 Updating report counts...');
    try {
        // Update all place report counts
        console.log('📊 Updating place report counts...');
        await query(`
      UPDATE places p
      SET report_count = (
        SELECT COUNT(*) FROM reports r WHERE r.place_id = p.id
      )
    `);
        console.log('✅ Place report counts updated');
        // Update all city report counts
        console.log('📊 Updating city report counts...');
        await query(`
      UPDATE cities c
      SET reports_count = (
        SELECT COUNT(*) 
        FROM reports r
        JOIN places p ON r.place_id = p.id
        WHERE p.city_id = c.id
      )
    `);
        console.log('✅ City report counts updated');
        // Update all city places counts
        console.log('📊 Updating city places counts...');
        await query(`
      UPDATE cities c
      SET places_count = (
        SELECT COUNT(*) FROM places p WHERE p.city_id = c.id
      )
    `);
        console.log('✅ City places counts updated');
        console.log('🎉 All counts updated successfully!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error updating counts:', error);
        process.exit(1);
    }
}
updateAllCounts();
//# sourceMappingURL=updateCounts.js.map