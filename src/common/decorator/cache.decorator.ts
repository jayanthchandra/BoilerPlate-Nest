import { CacheKey, CacheTTL, SetMetadata } from '@nestjs/common'

import * as META from '~/constants/meta.constant'

// 缓存器配置
interface ICacheOption {
  ttl?: number
  key?: string
  disable?: boolean
}

export function HttpCache(option: ICacheOption): MethodDecorator {
  const { disable, key, ttl = 60 } = option
  return (_, __, descriptor: PropertyDescriptor) => {
    if (disable) {
      SetMetadata(META.HTTP_CACHE_DISABLE, true)(descriptor.value)
      return descriptor
    }
    if (key) {
      CacheKey(key)(descriptor.value)
    }
    if (typeof ttl === 'number' && !isNaN(ttl)) {
      CacheTTL(ttl)(descriptor.value)
    }
    return descriptor
  }
}

HttpCache.disable = (_, __, descriptor) => {
  SetMetadata(META.HTTP_CACHE_DISABLE, true)(descriptor.value)
}
