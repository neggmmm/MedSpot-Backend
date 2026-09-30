import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import compression from 'compression';
import { ConfigService } from '@nestjs/config';
import { AppLogger } from './common/logger/logger.service';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import cluster from 'cluster';
import * as os from 'os';

// A cluster is useful in production, but makes local configuration failures
// appear once per CPU and obscures the original error with EPIPE messages.
const NUM_WORKERS = process.env.NODE_ENV === 'production' ? os.cpus().length : 1;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const appLogger    = app.get(AppLogger);
  const frontendUri  = configService.getOrThrow<string>('frontendUri');
  const port         = configService.get<number>('port') ?? 3000;
  const cookieParser = require('cookie-parser');

  app.enableCors({ origin: frontendUri, credentials: true });
  app.use(compression()); // gzip all responses — reduces payload 70-80%
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(new GlobalExceptionFilter(appLogger));
  app.use('/uploads', express.static('uploads'));

  await app.listen(port);
  appLogger.info('Bootstrap', `Worker ${process.pid} ready on :${port}`);
}

// ─── Cluster entry point ─────────────────────────────────────────────────────

if (cluster.isPrimary && NUM_WORKERS > 1) {
  console.log(`[Cluster] Primary ${process.pid} — spawning ${NUM_WORKERS} workers`);

  // Fork one worker per logical CPU core
  for (let i = 0; i < NUM_WORKERS; i++) {
    cluster.fork();
  }

  // Auto-respawn any worker that crashes so the server stays up
  cluster.on('exit', (worker, code, signal) => {
    console.warn(
      `[Cluster] Worker ${worker.process.pid} died (${signal ?? code}). Restarting...`,
    );
    cluster.fork();
  });

} else {
  // Worker process — each runs a full NestJS app on the same port.
  // The OS kernel load-balances incoming TCP connections across all workers.
  bootstrap().catch((err) => {
    console.error('[Bootstrap] Fatal error in worker:', err);
    process.exit(1);
  });
}
