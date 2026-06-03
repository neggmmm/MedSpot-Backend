import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * @Global() means you only import this once (in AppModule) and
 * RedisService is available everywhere without re-importing.
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
