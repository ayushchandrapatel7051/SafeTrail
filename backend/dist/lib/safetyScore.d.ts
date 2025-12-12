export declare function calculateSafetyScore(placeId: number): Promise<number>;
export declare function updatePlaceSafetyScore(placeId: number): Promise<void>;
export declare function updateCitySafetyScore(cityId: number): Promise<void>;
export declare function getSafetyStatus(score: number): Promise<'safe' | 'caution' | 'danger'>;
//# sourceMappingURL=safetyScore.d.ts.map