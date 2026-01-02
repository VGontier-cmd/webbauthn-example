/**
 * Redis module
 *
 * Provides Redis service for storing WebAuthn challenges.
 *
 * @module redis/redis.module
 */
import { Global, Module } from "@nestjs/common";
import { RedisService } from "./redis.service";

@Global() // Makes RedisService available to all modules
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
