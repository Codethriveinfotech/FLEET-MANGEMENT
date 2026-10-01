import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

let dbUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Njtby5QdhCf0@ep-frosty-butterfly-ax6itycw-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require';
dbUrl = dbUrl.replace(/^["']|["']$/g, '').trim(); // Remove accidental quotes or whitespace

// If it's a Kotlin Spring Boot JDBC URL, convert it to standard Postgres URL
if (dbUrl.startsWith('jdbc:postgresql://')) {
  dbUrl = dbUrl.replace('jdbc:postgresql://', 'postgresql://');
}

// Force Neon connection to use the -pooler endpoint to avoid Serverless cold start timeouts
if (dbUrl.includes('ep-frosty-butterfly-ax6itycw.c-4') && !dbUrl.includes('-pooler')) {
  dbUrl = dbUrl.replace('ep-frosty-butterfly-ax6itycw.c-4', 'ep-frosty-butterfly-ax6itycw-pooler.c-4');
}

let prismaUrl = dbUrl.includes('pgbouncer=true') ? dbUrl : (dbUrl.includes('?') ? `${dbUrl}&pgbouncer=true` : `${dbUrl}?pgbouncer=true`);

// Ensure a longer connect timeout for Serverless DB cold starts (30 seconds)
if (!prismaUrl.includes('connect_timeout')) {
  prismaUrl = `${prismaUrl}&connect_timeout=30`;
}

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
