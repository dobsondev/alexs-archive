import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { sql } from "drizzle-orm";

interface HealthCheckResponse {
  status: string;
  timestamp: string;
  database: {
    status: string;
    latency: number;
  };
  uptime: number;
  version: string;
}

export const dynamic = 'force-dynamic'; // Ensure the route is not cached

export async function GET() {
  try {
    // Check database connection
    const startTime = performance.now();
    db.select({ value: sql`1` });
    const dbLatency = performance.now() - startTime;

    const healthyResponse: HealthCheckResponse = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: {
        status: "connected",
        latency: Math.round(dbLatency),
      },
      uptime: process.uptime(),
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0",
    };

    return NextResponse.json(healthyResponse);
  } catch (error) {
    console.error("Healthcheck failed:", error);

    const unhealthyResponse: HealthCheckResponse = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: {
        status: "disconnected",
        latency: -1,
      },
      uptime: process.uptime(),
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0",
    };

    return NextResponse.json(unhealthyResponse, { status: 503 });
  }
}
