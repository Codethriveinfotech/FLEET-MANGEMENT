import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

let dbUrl = process.env.DATABASE_URL || '';
dbUrl = dbUrl.replace(/^["']|["']$/g, '').trim(); // Remove accidental quotes or whitespace

// If it's a Kotlin Spring Boot JDBC URL, convert it to standard Postgres URL
if (dbUrl.startsWith('jdbc:postgresql://')) {
  dbUrl = dbUrl.replace('jdbc:postgresql://', 'postgresql://');
}

const prismaUrl = dbUrl.includes('pgbouncer=true') ? dbUrl : (dbUrl.includes('?') ? `${dbUrl}&pgbouncer=true` : `${dbUrl}?pgbouncer=true`);

// VERY IMPORTANT: Overwrite the OS environment variable so the Prisma Rust Engine sees the fixed URL!
process.env.DATABASE_URL = prismaUrl;

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
