import { Cache } from 'cache-manager'
import { Redis } from 'ioredis'

import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common'


export type TCacheKey = string
export type TCacheResult<T> = Promise<T | undefined>

@Injectable()
export class CacheService {
  private cache!: Cache
  private logger = new Logger(CacheService.name)

  constructor(@Inject(CACHE_MANAGER) cache: Cache) {
    this.cache = cache
    this.redisClient.on('ready', () => {
      this.logger.log('Redis is ready!')
    })
  }

  private get redisClient(): Redis {
    // @ts-expect-error
    return this.cache.store.getClient()
  }

  public get<T>(key: TCacheKey): TCacheResult<T> {
    return this.cache.get(key)
  }

  public set<T>(
    key: TCacheKey,
    value: any,
    options?: { ttl: number },
  ): TCacheResult<T> {
    return this.cache.set(key, value, options)
  }

  public getClient() {
    return this.redisClient
  }
}
