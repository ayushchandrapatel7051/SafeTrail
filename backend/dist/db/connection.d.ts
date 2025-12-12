import pg from 'pg';
declare const pool: pg.Pool;
export declare const query: (text: string, params?: any[]) => Promise<pg.QueryResult<any>>;
export declare const getClient: () => Promise<pg.PoolClient>;
export default pool;
//# sourceMappingURL=connection.d.ts.map