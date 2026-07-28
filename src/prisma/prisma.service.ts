import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {

  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    const adapter = new PrismaPg(pool);
    
    const isDev = process.env.NODE_ENV !== 'production';
    super({
      adapter,
      log: isDev ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
    });
  }
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

