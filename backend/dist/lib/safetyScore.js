import { query } from '../db/connection.js';
export async function calculateSafetyScore(placeId) {
    try {
        const result = await query(`SELECT 
        COUNT(*) FILTER (WHERE status = 'verified') as verified_count,
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE status = 'verified' AND severity >= 3) as critical_count
      FROM reports 
      WHERE place_id = $1`, [placeId]);
        const data = result.rows[0];
        const { verified_count, total_count, critical_count } = data;
        // Base score is 85 (safe)
        let score = 85;
        // Deduct points based on verified reports
        if (verified_count > 0) {
            const reportRatio = verified_count / Math.max(total_count, 1);
            score -= reportRatio * 35; // Max deduction: 35 points
        }
        // Additional deduction for critical severity reports
        if (critical_count > 0) {
            score -= critical_count * 5; // 5 points per critical report
        }
        // Ensure score stays between 0 and 100
        score = Math.max(0, Math.min(100, score));
        // Round to 1 decimal place
        return Math.round(score * 10) / 10;
    }
    catch (error) {
        console.error('Error calculating safety score:', error);
        return 50; // Default neutral score on error
    }
}
export async function updatePlaceSafetyScore(placeId) {
    try {
        const score = await calculateSafetyScore(placeId);
        await query('UPDATE places SET safety_score = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [score, placeId]);
    }
    catch (error) {
        console.error('Error updating place safety score:', error);
    }
}
export async function updateCitySafetyScore(cityId) {
    try {
        const result = await query(`SELECT AVG(safety_score) as avg_score FROM places WHERE city_id = $1`, [cityId]);
        const avgScore = result.rows[0].avg_score || 50;
        await query('UPDATE cities SET safety_score = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [Math.round(avgScore * 10) / 10, cityId]);
    }
    catch (error) {
        console.error('Error updating city safety score:', error);
    }
}
export async function getSafetyStatus(score) {
    if (score >= 80)
        return 'safe';
    if (score >= 50)
        return 'caution';
    return 'danger';
}
//# sourceMappingURL=safetyScore.js.map