/**
 * Trust Score System
 *
 * Base Score: 50
 * Range: 0-100
 *
 * Factors:
 * - Verified reports: +5 per verified report
 * - Rejected reports: -3 per rejected report
 * - Reports with photos: +2 per report with photo
 * - Report accuracy rate: bonus/penalty based on verification ratio
 * - Account age: +0.5 per month (max +10)
 */
interface TrustScoreFactors {
    verifiedReports: number;
    rejectedReports: number;
    reportsWithPhotos: number;
    totalReports: number;
    accountAgeDays: number;
}
export declare function calculateTrustScore(factors: TrustScoreFactors): number;
export declare function updateUserTrustScore(userId: number): Promise<number>;
export declare function getUserTrustScore(userId: number): Promise<number>;
/**
 * Get trust weight for safety score calculation
 * Higher trust users have more influence on safety scores
 */
export declare function getTrustWeight(trustScore: number): number;
/**
 * Calculate weighted safety score based on reports and user trust scores
 */
export declare function calculateWeightedSafetyScore(placeId: number): Promise<number>;
export {};
//# sourceMappingURL=trustScore.d.ts.map