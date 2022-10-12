// import redisStore from 'cache-manager-redis-store'
import redisStore from 'cache-manager-ioredis'

import { CacheModuleOptions, CacheOptionsFactory , Injectable } from '@nestjs/common'

import { REDIS } from '~/app.config'

@Injectable()
export class CacheConfigService implements CacheOptionsFactory {
  public createCacheOptions(): CacheModuleOptions {
    const redisOptions: any = {
      host: REDIS.host as string,
      port: REDIS.port as number,
    }
    if (REDIS.password) {
      redisOptions.password = REDIS.password
    }
    return {
      store: redisStore,
      ttl: REDIS.ttl,
      is_cacheable_value: () => true,
      max: REDIS.max,
      ...redisOptions,
    }
  }
}
