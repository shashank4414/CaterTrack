import { PrismaClient } from './generated/prisma/client/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const databaseUrl =
  process.env.DATABASE_URL || `file:${path.join(__dirname, 'dev.db')}`;
const adapter = new PrismaLibSql({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

export default prisma;
