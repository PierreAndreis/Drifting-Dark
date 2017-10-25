import RedisService from './redis';

const DEFAULT_CACHE_EXPIRE_SECONDS = 3600 * 24 * 30; // 30 days
const DEFAULT_LOCK_EXPIRE_SECONDS = 3600 * 24 * 40000; // 100+ years

const REDIS = { PREFIX: 'VGPRO' };

const ONE_HOUR_SECONDS = 3600;

class CacheService {
  static arrayAppend(key, value) {
    key = `${REDIS.PREFIX}:${key}`;
    return RedisService.rpush(key, value);
  }

  static arrayGet(key, value) {
    key = `${REDIS.PREFIX}:${key}`;
    return RedisService.lrange(key, 0, -1);
  }

  static set(key, value, { expireSeconds } = {}) {
    key = `${REDIS.PREFIX}:${key}`;
    return RedisService.set(key, JSON.stringify(value)).then(() => {
      if (expireSeconds) return RedisService.expire(key, expireSeconds);
    });
  }

  static get(key) {
    key = `${REDIS.PREFIX}:${key}`;
    return RedisService.get(key).then((value) => {
      try {
        return JSON.parse(value);
      } catch (error) {
        console.warn(error);
        return value;
      }
    });
  }

  static deleteByKey(key) {
    key = `${REDIS.PREFIX}:${key}`;
    return RedisService.del(key);
  }

  async preferCache(key, fn, { expireSeconds, ignoreNull, category } = {}) {
    const rawKey = key;
    key = `${REDIS.PREFIX}:${key}`;

    if (expireSeconds == null) {
      expireSeconds = DEFAULT_CACHE_EXPIRE_SECONDS;
    }

    if (category) {
      const categoryKey = `category:${category}`;

      this.arrayGet(categoryKey).then((categoryKeys) => {
        if (categoryKeys.indexOf(key) === -1) {
          return this.arrayAppend(categoryKey, rawKey);
        }
      });
    }

    const cacheValue = await RedisService.get(key);

    if (cacheValue != null) {
      try {
        return JSON.parse(cacheValue);
      } catch (error) {
        console.log('error parsing', key, cacheValue);
        return null;
      }
    }

    const value = await fn();

    if ((value !== null && value !== void 0) || !ignoreNull) {
      RedisService.set(key, JSON.stringify(value)).then(() => RedisService.expire(key, expireSeconds));
    }
    return value;
  }

  // // for locking
  // runOnce(key, fn, {expireSeconds, lockedFn} = {}) {
  //   var setVal;
  //   key = REDIS.PREFIX + ':' + key;
  //   if (expireSeconds == null) {
  //     expireSeconds = DEFAULT_LOCK_EXPIRE_SECONDS;
  //   }

  //   setVal = '1';
  //   return RedisService.set(key, setVal, 'NX', 'EX', expireSeconds).then(function(value) {
  //     if (value !== null) {
  //       return fn();
  //     } else {
  //       return typeof lockedFn === "function" ? lockedFn() : void 0;
  //     }
  //   });
  // }

  // lock(key, fn, {expireSeconds, unlockWhenCompleted} = {}) {
  //   key = REDIS.PREFIX + ':' + key;
  //   if (expireSeconds == null) {
  //     expireSeconds = DEFAULT_REDLOCK_EXPIRE_SECONDS;
  //   }
  //   return this.redlock.lock(key, expireSeconds * 1000).then(function(lock) {
  //     var ref;
  //     return (ref = fn(lock)) != null ? typeof ref.tap === "function" ? ref.tap(function() {
  //       if (unlockWhenCompleted) {
  //         return lock.unlock();
  //       }
  //     }) : void 0 : void 0;
  //   }).catch(function(err) {
  //     // console.log 'redlock err', err
  //     return null;
  //   });
  // }

  // deleteByCategory(category) {
  //   var categoryKey;
  //   categoryKey = 'category:' + category;
  //   return this.arrayGet(categoryKey).then((categoryKeys) => {
  //     return Promise.map(categoryKeys, this.deleteByKey);
  //   }).then(() => {
  //     return this.deleteByKey(categoryKey);
  //   });
  // }
}


export default new CacheService();
