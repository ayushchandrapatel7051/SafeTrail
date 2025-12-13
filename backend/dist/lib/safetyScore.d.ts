export declare function calculateSafetyScore(placeId: number): Promise<number>;
export declare function updatePlaceSafetyScore(placeId: number): Promise<void>;
export declare function updateCitySafetyScore(cityId: number): Promise<void>;
export declare function getSafetyStatus(score: number): Promise<'safe' | 'caution' | 'danger'>;
export declare function updatePlaceReportCount(placeId: number): Promise<void>;
export declare function updateCityReportCount(cityId: number): Promise<void>;
export declare function updateCityPlacesCount(cityId: number): Promise<void>;
//# sourceMappingURL=safetyScore.d.ts.map