import { query } from '../db/connection.js';
const BASE_SCORE = 50;
const VERIFIED_REPORT_BONUS = 5;
const REJECTED_REPORT_PENALTY = 3;
const PHOTO_BONUS = 2;
const ACCOUNT_AGE_BONUS_PER_MONTH = 0.5;
const MAX_ACCOUNT_AGE_BONUS = 10;
export function calculateTrustScore(factors) {
    let score = BASE_SCORE;
    // Add points for verified reports
    score += factors.verifiedReports * VERIFIED_REPORT_BONUS;
    // Deduct points for rejected reports
    score -= factors.rejectedReports * REJECTED_REPORT_PENALTY;
    // Add bonus for reports with photos
    score += factors.reportsWithPhotos * PHOTO_BONUS;
    // Calculate accuracy rate bonus/penalty
    if (factors.totalReports > 0) {
        const accuracyRate = factors.verifiedReports / factors.totalReports;
        if (accuracyRate >= 0.8) {
            score += 10; // High accuracy bonus
        }
        else if (accuracyRate >= 0.6) {
            score += 5; // Medium accuracy bonus
        }
        else if (accuracyRate < 0.3) {
            score -= 10; // Low accuracy penalty
        }
    }
    // Add account age bonus
    const accountAgeMonths = factors.accountAgeDays / 30;
    const accountAgeBonus = Math.min(accountAgeMonths * ACCOUNT_AGE_BONUS_PER_MONTH, MAX_ACCOUNT_AGE_BONUS);
    score += accountAgeBonus;
    // Clamp score between 0 and 100
    return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}
export async function updateUserTrustScore(userId) {
    try {
        // Get user's report statistics
        const statsResult = await query(`SELECT 
        COUNT(CASE WHEN status = 'verified' THEN 1 END)::int as verified_count,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END)::int as rejected_count,
        COUNT(CASE WHEN has_photo = true THEN 1 END)::int as photo_count,
        COUNT(*)::int as total_count
       FROM reports 
       WHERE user_id = $1`, [userId]);
        // Get user's account age
        const userResult = await query('SELECT EXTRACT(DAY FROM NOW() - created_at)::int as account_age_days FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            throw new Error('User not found');
        }
        const stats = statsResult.rows[0];
        const accountAgeDays = userResult.rows[0].account_age_days;
        // Calculate new trust score
        const newTrustScore = calculateTrustScore({
            verifiedReports: stats.verified_count,
            rejectedReports: stats.rejected_count,
            reportsWithPhotos: stats.photo_count,
            totalReports: stats.total_count,
            accountAgeDays,
        });
        // Update user's trust score and stats
        await query(`UPDATE users 
       SET trust_score = $1,
           verified_reports_count = $2,
           rejected_reports_count = $3,
           reports_with_photos_count = $4,
           total_reports_count = $5,
           updated_at = NOW()
       WHERE id = $6`, [
            newTrustScore,
            stats.verified_count,
            stats.rejected_count,
            stats.photo_count,
            stats.total_count,
            userId,
        ]);
        return newTrustScore;
    }
    catch (error) {
        console.error('Error updating trust score:', error);
        throw error;
    }
}
export async function getUserTrustScore(userId) {
    try {
        const result = await query('SELECT trust_score FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            throw new Error('User not found');
        }
        return parseFloat(result.rows[0].trust_score) || BASE_SCORE;
    }
    catch (error) {
        console.error('Error getting trust score:', error);
        return BASE_SCORE;
    }
}
/**
 * Get trust weight for safety score calculation
 * Higher trust users have more influence on safety scores
 */
export function getTrustWeight(trustScore) {
    if (trustScore >= 80)
        return 2.0; // High trust: double weight
    if (trustScore >= 60)
        return 1.5; // Medium-high trust: 1.5x weight
    if (trustScore >= 40)
        return 1.0; // Normal trust: normal weight
    if (trustScore >= 20)
        return 0.7; // Low trust: reduced weight
    return 0.5; // Very low trust: minimal weight
}
/**
 * Calculate weighted safety score based on reports and user trust scores
 */
export async function calculateWeightedSafetyScore(placeId) {
    try {
        const result = await query(`SELECT 
        r.severity,
        r.trust_score_at_submission,
        u.trust_score
       FROM reports r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.place_id = $1 AND r.status = 'verified'`, [placeId]);
        if (result.rows.length === 0) {
            return 50; // Default safety score
        }
        let totalWeightedScore = 0;
        let totalWeight = 0;
        for (const report of result.rows) {
            const trustScore = report.trust_score || report.trust_score_at_submission || 50;
            const weight = getTrustWeight(trustScore);
            const severity = report.severity || 1;
            // Convert severity to safety impact (1-5 severity -> 10-50 safety reduction)
            const safetyImpact = severity * 10;
            const reportSafetyScore = Math.max(0, 100 - safetyImpact);
            totalWeightedScore += reportSafetyScore * weight;
            totalWeight += weight;
        }
        const weightedScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 50;
        return Math.round(weightedScore * 10) / 10;
    }
    catch (error) {
        console.error('Error calculating weighted safety score:', error);
        return 50;
    }
}
//# sourceMappingURL=trustScore.js.map