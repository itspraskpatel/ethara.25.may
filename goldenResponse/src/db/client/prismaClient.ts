import 'server-only'
import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

declare global {
  var prisma: PrismaClient | undefined
}

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const adapter = new PrismaPg({ connectionString })

const prisma =
  global.prisma || new PrismaClient({
    adapter,
    log: [ 'info', 'warn', 'error'],
  })

if (process.env.NODE_ENV !== "production") global.prisma = prisma

export default prisma