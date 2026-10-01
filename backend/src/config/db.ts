import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const dbUrl = process.env.DATABASE_URL || '';
const prismaUrl = dbUrl.includes('pgbouncer=true') ? dbUrl : (dbUrl.includes('?') ? `${dbUrl}&pgbouncer=true` : `${dbUrl}?pgbouncer=true`);

export const prisma = new PrismaClient({
  datasources: { db: { url: prismaUrl } },
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
  ],
});

// Log raw database queries in development
if (process.env.NODE_ENV === 'development') {
  (prisma as any).$on('query', (e: any) => {
    logger.debug(`Query: ${e.query} - Params: ${e.params} - Duration: ${e.duration}ms`);
  });
}
export default prisma;
