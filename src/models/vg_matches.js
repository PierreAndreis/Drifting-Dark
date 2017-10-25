import moment from 'moment';

import Config from '../config';

import CacheService from '../services/cache';
import VaingloryService from '../services/vainglory';

import MatchTransform from '../transforms/matches';

const BATCHAPI_PAGES_PER_TRY = 3;
const BATCHAPI_DATE_DEEP_TRY = 2; // We will try 3 dates deep down (28 * 2 = 56 days worth of data)

class VGMatches {
  createCacheKey(playerId, region, lastMatch) {
    return `matches:${playerId}:${region}:${lastMatch}`;
  }

  async getAllMatches(playerId, region, lastCreatedAt, endAt) {
    // Convert lastCreatedAt to ms
    const milliseconds = Date.parse(lastCreatedAt);
    // determine amount of 28 days to loop
    const necessaryLoops = Math.ceil((new Date() - milliseconds) / 1000 / 60 / 60 / 24 / 28);
    const ms28Days = 2419200000;
    let newDate = milliseconds + ms28Days;
    // The first call should be from lastCreatedAt
    const dates = {
      0: lastCreatedAt,
    };
    for (let i = 1; i < necessaryLoops + 1; i++) {
      // New key value for every loop
      dates[i] = newDate.toISOString();
      // add 28 days for the next loop
      newDate += ms28Days;
    }

    const get = async (initialPages = 0, endAt) => {
      const queries = [];

      for (let i = 0; i < BATCHAPI_PAGES_PER_TRY; i++) {
        const page = initialPages + i;
        queries.push(VaingloryService.queryMatchesPage(playerId, region, endAt, page));
      }

      return Promise.all(queries);
    };

    let done = false;
    let pages = 0;
    const res = [];

    while (!done) {
      const pagesRes = await get(pages);
      pagesRes.forEach((pg) => {
        if (pg.errors) done = true;
        else res.push(...pg.match.map(match => MatchTransform(match)));
      });
      pages++;
    }

    return res;
  }

  async getMatches(playerId, region, lastMatch) {
    const key = this.createCacheKey(playerId, region, lastMatch);

    const get = async () => {
      const matches = await VaingloryService.queryMatchesTimed(playerId, region, null, lastMatch);
      if (!matches) return {};
      return matches;
      const res = matches.match.map(match => MatchTransform(match));
      return res;
    };

    return await CacheService.preferCache(key, get, { expireSeconds: Config.CACHE.REDIS_MATCHES_CACHE_EXPIRE, category: 'matches' });
  }
}

export default new VGMatches();
