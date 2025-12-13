import pool from './connection';
function getPlaceContext(name) {
    const nameLower = name.toLowerCase();
    return {
        isTransitHub: nameLower.includes('station') ||
            nameLower.includes('terminus') ||
            nameLower.includes('airport') ||
            nameLower.includes('chowk'),
        isTouristSpot: nameLower.includes('gate') ||
            nameLower.includes('fort') ||
            nameLower.includes('palace') ||
            nameLower.includes('mahal') ||
            nameLower.includes('temple') ||
            nameLower.includes('beach') ||
            nameLower.includes('garden') ||
            nameLower.includes('mantar'),
        isResidential: nameLower.includes('nagar') ||
            nameLower.includes('puram') ||
            nameLower.includes('colony') ||
            nameLower.includes('vihar'),
    };
}
function calculateSafetyScore(reportCount, cityMin, cityMax, cityAvg, context) {
    // Handle zero reports (still not 100% safe - give realistic score)
    if (reportCount === 0)
        return 82.0;
    // Calculate percentile within city (0 to 1)
    const range = cityMax - cityMin;
    const percentile = range > 0 ? (reportCount - cityMin) / range : 0;
    // Base score from percentile (inverted: low reports = high score)
    // Range: 35-80 base score
    let baseScore = 80 - percentile * 45;
    // Context adjustments
    if (context.isTransitHub) {
        // Transit hubs naturally have more reports due to traffic
        // Boost score by up to 8 points based on how much above average
        const aboveAverage = Math.max(0, reportCount - cityAvg);
        const boost = Math.min(8, (aboveAverage / cityAvg) * 5);
        baseScore += boost;
    }
    if (context.isTouristSpot) {
        // Tourist spots have better security but more visibility
        // Slight boost (3-5 points)
        baseScore += 4;
    }
    if (context.isResidential && reportCount < cityAvg * 0.5) {
        // Low-report residential might lack infrastructure
        // Slight penalty (2 points)
        baseScore -= 2;
    }
    // Apply crime severity scaling
    // Very high crime (3x average) gets additional penalty
    if (reportCount > cityAvg * 3) {
        const severityPenalty = Math.min(10, (reportCount / cityAvg) * 2);
        baseScore -= severityPenalty;
    }
    // Ensure realistic bounds: 20-85 range
    const finalScore = Math.max(20, Math.min(85, baseScore));
    return Math.round(finalScore * 10) / 10;
}
async function updateSafetyScores() {
    const client = await pool.connect();
    try {
        console.log('🔄 Fetching places with report counts...');
        // Get all places with their current report counts
        const result = await client.query(`
      SELECT id, name, city_id, report_count 
      FROM places 
      ORDER BY city_id, report_count DESC
    `);
        const places = result.rows;
        console.log(`📊 Found ${places.length} places`);
        if (places.length === 0) {
            console.log('⚠️  No places found');
            return;
        }
        // Group by city and calculate city-specific statistics
        const citiesMap = new Map();
        for (const place of places) {
            if (!citiesMap.has(place.city_id)) {
                citiesMap.set(place.city_id, []);
            }
            citiesMap.get(place.city_id).push(place);
        }
        console.log(`📍 Found ${citiesMap.size} cities\n`);
        // Calculate and update safety scores
        console.log('🔧 Calculating context-aware safety scores...\n');
        let updated = 0;
        for (const [cityId, cityPlaces] of citiesMap) {
            const reportCounts = cityPlaces.map((p) => p.report_count || 0);
            const cityMin = Math.min(...reportCounts);
            const cityMax = Math.max(...reportCounts);
            const cityAvg = reportCounts.reduce((a, b) => a + b, 0) / reportCounts.length;
            // Get city name
            const cityNameResult = await client.query('SELECT name FROM cities WHERE id = $1', [cityId]);
            const cityName = cityNameResult.rows[0]?.name || `City ${cityId}`;
            console.log(`📍 ${cityName} (${cityPlaces.length} places | Avg reports: ${Math.round(cityAvg)})`);
            for (const place of cityPlaces) {
                const reportCount = place.report_count || 0;
                const context = getPlaceContext(place.name);
                const safetyScore = calculateSafetyScore(reportCount, cityMin, cityMax, cityAvg, context);
                await client.query('UPDATE places SET safety_score = $1 WHERE id = $2', [
                    safetyScore,
                    place.id,
                ]);
                const contextTags = [];
                if (context.isTransitHub)
                    contextTags.push('🚉');
                if (context.isTouristSpot)
                    contextTags.push('🎭');
                if (context.isResidential)
                    contextTags.push('🏘️');
                console.log(`  ${place.name.padEnd(33)} | ${String(reportCount).padStart(3)} reports | Score: ${String(safetyScore).padStart(4)} ${contextTags.join('')}`);
                updated++;
            }
            console.log('');
        }
        console.log(`✅ Updated ${updated} places`);
        // Update city-level safety scores (average of all places in the city)
        console.log('\n🏙️  Updating city safety scores...\n');
        const cityResult = await client.query(`
      UPDATE cities c
      SET safety_score = (
        SELECT COALESCE(ROUND(AVG(p.safety_score)), 50)
        FROM places p
        WHERE p.city_id = c.id
      )
      RETURNING id, name, safety_score
    `);
        cityResult.rows.forEach((city) => {
            console.log(`✓ ${city.name.padEnd(15)} | Score: ${city.safety_score}`);
        });
        console.log(`\n✅ Updated ${cityResult.rowCount} cities`);
        // Show statistics
        console.log('\n📊 Safety Score Distribution:');
        const stats = await client.query(`
      SELECT 
        CASE 
          WHEN safety_score >= 75 THEN 'Very Safe (75-85)'
          WHEN safety_score >= 60 THEN 'Safe (60-74)'
          WHEN safety_score >= 45 THEN 'Caution (45-59)'
          WHEN safety_score >= 30 THEN 'Unsafe (30-44)'
          ELSE 'Very Unsafe (20-29)'
        END as category,
        COUNT(*) as count,
        ROUND(AVG(report_count)) as avg_reports
      FROM places
      GROUP BY category
      ORDER BY MIN(safety_score) DESC
    `);
        stats.rows.forEach((row) => {
            console.log(`   ${row.category.padEnd(25)} | ${String(row.count).padStart(2)} places | Avg: ${row.avg_reports} reports`);
        });
    }
    catch (error) {
        console.error('❌ Error updating safety scores:', error);
        throw error;
    }
    finally {
        client.release();
        await pool.end();
    }
}
// Run the update
updateSafetyScores().catch(console.error);
//# sourceMappingURL=updateSafetyScores.js.map