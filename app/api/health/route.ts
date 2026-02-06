import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../src/infrastructure/lib/prisma';
import { createRouteHandler } from '../../../src/infrastructure/middleware/with-error-handler';
import { config } from '../../../src/config';

async function GETHandler(request: NextRequest) {
  const startTime = Date.now();
  
  // Basic system info
  const systemInfo = {
    app: 'crm-cobranzas',
    version: process.env.npm_package_version || '0.1.0',
    node: process.version,
    environment: config.NODE_ENV,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };

  // Health checks
  const checks: Record<string, { status: 'healthy' | 'unhealthy'; duration?: number; error?: string }> = {};
  
  // Database connectivity check
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: 'healthy',
      duration: Date.now() - dbStart,
    };
  } catch (error: any) {
    checks.database = {
      status: 'unhealthy',
      duration: Date.now() - dbStart,
      error: error.message,
    };
  }

  // Overall status
  const allHealthy = Object.values(checks).every(check => check.status === 'healthy');
  const overallStatus = allHealthy ? 'healthy' : 'unhealthy';

  const response = {
    status: overallStatus,
    timestamp: systemInfo.timestamp,
    system: systemInfo,
    checks,
    responseTime: Date.now() - startTime,
  };

  return NextResponse.json(response, {
    status: overallStatus === 'healthy' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Content-Type': 'application/json',
    },
  });
}

export const GET = createRouteHandler(GETHandler);