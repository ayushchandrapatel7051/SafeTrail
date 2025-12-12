import pool from './connection';

// Data from user's crime reports
const reportData = [
  { id: 30, city_id: 3, name: 'Banashankari', report_count: 20 },
  { id: 15, city_id: 2, name: 'Bandra', report_count: 315 },
  { id: 37, city_id: 4, name: 'Bapu Bazaar', report_count: 13 },
  { id: 17, city_id: 2, name: 'Bombay Central Railway Station', report_count: 150 },
  { id: 26, city_id: 3, name: 'Brigade Road', report_count: 57 },
  { id: 2, city_id: 1, name: 'Chandni Chowk', report_count: 173 },
  { id: 38, city_id: 4, name: 'Chaugan Stadium', report_count: 35 },
  { id: 31, city_id: 4, name: 'City Palace', report_count: 25 },
  { id: 12, city_id: 2, name: 'Colaba', report_count: 27 },
  { id: 27, city_id: 3, name: 'Commercial Street', report_count: 195 },
  { id: 5, city_id: 1, name: 'Connaught Place', report_count: 31 },
  { id: 16, city_id: 2, name: 'Dadar', report_count: 291 },
  { id: 11, city_id: 2, name: 'Dharavi', report_count: 136 },
  { id: 14, city_id: 2, name: 'Gateway of India', report_count: 45 },
  { id: 33, city_id: 4, name: 'Hawa Mahal', report_count: 25 },
  { id: 29, city_id: 3, name: 'Hebbal', report_count: 11 },
  { id: 6, city_id: 1, name: 'India Gate', report_count: 22 },
  { id: 22, city_id: 3, name: 'Indiranagar', report_count: 30 },
  { id: 34, city_id: 4, name: 'Jaipur Railway Station', report_count: 0 },
  { id: 32, city_id: 4, name: 'Jantar Mantar', report_count: 17 },
  { id: 36, city_id: 4, name: 'Johri Bazaar', report_count: 25 },
  { id: 19, city_id: 2, name: 'Juhu Beach', report_count: 34 },
  { id: 4, city_id: 1, name: 'Karol Bagh', report_count: 162 },
  { id: 28, city_id: 3, name: 'Koramangala', report_count: 54 },
  { id: 25, city_id: 3, name: 'Lalbagh', report_count: 20 },
  { id: 10, city_id: 1, name: 'Lodi Garden', report_count: 29 },
  { id: 21, city_id: 3, name: 'MG Road', report_count: 54 },
  { id: 13, city_id: 2, name: 'Marine Drive', report_count: 127 },
  { id: 9, city_id: 1, name: 'New Delhi Railway Station', report_count: 389 },
  { id: 35, city_id: 4, name: 'New Gate', report_count: 12 },
  { id: 1, city_id: 1, name: 'Paharganj', report_count: 416 },
  { id: 8, city_id: 1, name: 'Rajiv Chowk', report_count: 824 },
  { id: 7, city_id: 1, name: 'Red Fort', report_count: 64 },
  { id: 3, city_id: 1, name: 'Sarojini Nagar', report_count: 109 },
  { id: 18, city_id: 2, name: 'Victoria Terminus', report_count: 200 },
  { id: 24, city_id: 3, name: 'Vidhana Soudha', report_count: 34 },
  { id: 23, city_id: 3, name: 'Whitefield', report_count: 7 },
  { id: 20, city_id: 2, name: 'Worli', report_count: 18 },
];

async function updateReportCounts() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Updating report counts from crime data...\n');
    
    let updated = 0;
    for (const place of reportData) {
      await client.query(
        'UPDATE places SET report_count = $1 WHERE id = $2',
        [place.report_count, place.id]
      );
      
      console.log(`✓ ${place.name.padEnd(35)} | Reports: ${place.report_count}`);
      updated++;
    }
    
    console.log(`\n✅ Updated ${updated} places with crime report counts`);
    
  } catch (error) {
    console.error('❌ Error updating report counts:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the update
updateReportCounts().catch(console.error);
