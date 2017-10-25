import moment from 'moment';
import Config from '../config';
import CacheService from '../services/cache';
import VaingloryService from '../services/vainglory';
import MatchTransform from '../transforms/matches';

const BATCHAPI_PAGES_PER_TRY = 3;
const BATCHAPI_DATE_DEEP_TRY = 2; // We will try 3 dates deep down (28 * 2 = 56 days worth of data)

class VGMatches {
  static createCacheKey(playerId, region, lastMatch) {
    return `matches:${playerId}:${region}:${lastMatch}`;
  }

  static async getAllMatches(playerId, region, endAt) {
    /**
     * notes:
     * I gave up trying to make it batch more than just last 28 days
     * and I don't think this data will be important.
     * for now, it will just try to fetch all the data from that page
     */
    const res = [];

    const get = async (initialPages = 0) => {
      const queries = [];

      for (let i = 0; i < BATCHAPI_PAGES_PER_TRY; i += 1) {
        const page = initialPages + i;
        queries.push(VaingloryService.queryMatchesPage(playerId, region, endAt, page));
      }

      return Promise.all(queries);
    };


    let done = false;
    let pages = 0;

    while (!done) {
      const pagesRes = get(pages);
      pagesRes.forEach((pg) => {
        if (pg.errors) done = true;
        else res.push(...pg.match.map(match => MatchTransform(match)));
      });
      pages += 1;
    }

    return res;
  }

  async getMatches(playerId, region, lastMatch) {
    const key = this.createCacheKey(playerId, region, lastMatch);

    const get = async () => {
      const matches = await VaingloryService.queryMatchesOlder(playerId, region, lastMatch);
      if (!matches) return {};
      return matches;
      const res = matches.match.map(match => MatchTransform(match));
      return res;
    };
    return CacheService.preferCache(key, get, { expireSeconds: Config.CACHE.REDIS_MATCHES_CACHE_EXPIRE, category: 'matches' });
  }
}

export default new VGMatches();
