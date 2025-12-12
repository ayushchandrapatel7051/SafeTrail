import { query } from './connection.js';

async function updateCategories() {
  try {
    console.log('Updating attraction categories...');

    // Update attractions with appropriate categories
    const updates = [
      // Delhi
      { name: 'Red Fort', category: 'culture' },
      { name: 'Qutub Minar', category: 'culture' },
      { name: 'India Gate', category: 'tourist' },
      { name: 'Lotus Temple', category: 'culture' },
      { name: 'Humayun%', category: 'culture' },
      { name: 'Akshardham', category: 'culture' },
      { name: 'Jama Masjid', category: 'culture' },
      { name: 'Chandni Chowk', category: 'tourist' },

      // Mumbai
      { name: 'Gateway of India', category: 'tourist' },
      { name: 'Marine Drive', category: 'tourist' },
      { name: 'Elephanta Caves', category: 'culture' },
      { name: 'Juhu Beach', category: 'tourist' },
      { name: 'Haji Ali', category: 'culture' },
      { name: 'Siddhivinayak', category: 'culture' },
      { name: 'Bandra-Worli Sea Link', category: 'tourist' },
      { name: 'Colaba Causeway', category: 'nightlife' },

      // Bangalore
      { name: 'Lalbagh', category: 'tourist' },
      { name: 'Cubbon Park', category: 'tourist' },
      { name: 'Bangalore Palace', category: 'culture' },
      { name: 'ISKCON Temple', category: 'culture' },
      { name: 'Tipu Sultan', category: 'culture' },
      { name: 'Vidhana Soudha', category: 'tourist' },
      { name: 'Nandi Hills', category: 'tourist' },
      { name: 'MG Road', category: 'nightlife' },

      // Jaipur
      { name: 'Hawa Mahal', category: 'culture' },
      { name: 'Amber Fort', category: 'culture' },
      { name: 'City Palace', category: 'culture' },
      { name: 'Jantar Mantar', category: 'culture' },
      { name: 'Jaigarh Fort', category: 'culture' },
      { name: 'Nahargarh Fort', category: 'culture' },
      { name: 'Jal Mahal', category: 'tourist' },
      { name: 'Albert Hall', category: 'culture' },
    ];

    for (const update of updates) {
      await query(`UPDATE attractions SET category = $1 WHERE name LIKE $2`, [
        update.category,
        `%${update.name}%`,
      ]);
    }

    console.log('✅ Updated attraction categories');

    // Update places with categories based on their type
    await query(`
      UPDATE places SET category = CASE
        WHEN name LIKE '%Market%' OR name LIKE '%Mall%' OR name LIKE '%Shopping%' THEN 'nightlife'
        WHEN name LIKE '%Temple%' OR name LIKE '%Mosque%' OR name LIKE '%Church%' OR name LIKE '%Fort%' THEN 'culture'
        WHEN name LIKE '%Railway%' OR name LIKE '%Station%' OR name LIKE '%Airport%' THEN 'safety'
        WHEN name LIKE '%Park%' OR name LIKE '%Garden%' OR name LIKE '%Beach%' THEN 'tourist'
        WHEN name LIKE '%Road%' OR name LIKE '%Street%' THEN 'nightlife'
        ELSE 'tourist'
      END
    `);

    console.log('✅ Updated place categories');

    // Show some results
    const result = await query(`
      SELECT category, COUNT(*) as count 
      FROM attractions 
      WHERE category IS NOT NULL
      GROUP BY category
    `);

    console.log('\n📊 Attraction categories:');
    result.rows.forEach((row) => {
      console.log(`   ${row.category}: ${row.count}`);
    });

    const placeResult = await query(`
      SELECT category, COUNT(*) as count 
      FROM places 
      WHERE category IS NOT NULL
      GROUP BY category
    `);

    console.log('\n📊 Place categories:');
    placeResult.rows.forEach((row) => {
      console.log(`   ${row.category}: ${row.count}`);
    });

    console.log('\n🎉 Categories updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating categories:', error);
    process.exit(1);
  }
}

updateCategories();
