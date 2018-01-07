import moment       from "moment";

import Config from "~/config";

import CacheService     from "~/services/cache";
import VaingloryService from "~/services/vainglory";

import MatchTransform from "~/transforms/matches.js";
import TelemetryTransform from "~/transforms/telemetry.js";

const BATCHAPI_PAGES_PER_TRY = 3;
// const BATCHAPI_DATE_DEEP_TRY = 2; // We will try 3 dates deep down (28 * 2 = 56 days worth of data)

class VGMatches {

  createCacheKey(playerId, region, {lastMatch, patches, gameMode, page, limit}) {

    let key = `matches:${playerId}:${region}`;
    if (lastMatch) key += `:${lastMatch}`;
    if (patches)   key += `:${patches}`;
    if (gameMode)  key += `:${gameMode}`;
    if (limit)     key += `:${limit}`;
    if (page)      key += `:${page}`;

    return key;
  }

  async getAllMatches(playerId, region, endAt) {
    /**
     * notes:
     * I gave up trying to make it batch more than just last 28 days
     * and I don't think this data will be important.
     * for now, it will just try to fetch all the data from that page
     */
    const res = [];

    let currentPage = 0;

    const get = async (batch = 0, endDate) => {
      const queries = [];

      let pageToEnd = currentPage + BATCHAPI_PAGES_PER_TRY;
      for (let i = 0; i <= BATCHAPI_PAGES_PER_TRY; i++) {
        let page = currentPage++;
        queries.push(VaingloryService.getMatches(playerId, region, {lastMatch: endDate, page}));
      }
      return Promise.all(queries);
    }


    let done  = false;
    let pages = 0;

    while (!done) {
      const pagesRes = await get(pages);
      pagesRes.forEach((pg) => {
        if (pg.errors) done = true;
        else res.push(...pg.match.map(match => MatchTransform.input.json(match)));
      });
      pages++;
    }

    // Remove duplicates.
    // There is a bug that is causing this
    // Most likely Madglory End

    const matchesId = new Set([]);

    const removeDuplicatedMatches = res.filter(match => {
      const test = matchesId.has(match.id);
      matchesId.add(match.id);
      return !test;
    })

    return removeDuplicatedMatches;
  }

  async getMatchByMatchId(id, region, output) {
    const match = await VaingloryService.match(id, region);
    if (match.errors) return {errors: match.messages}; // todo error handler
    let m = MatchTransform.input.json(match);
    if (output) m = MatchTransform.output.json(id, m);
    return m
  }
  
  async getMatches(playerId, region, lastMatch, context) {
    const key = this.createCacheKey(playerId, region, {lastMatch, ...context});

    const get = async () => {
      
      const matches = await VaingloryService.getMatches(playerId, region, {lastMatch, ...context});
      if (!matches || matches.errors) return [];
      // Transform it in a nice way
      let m = matches.match.map(match => MatchTransform.input.json(match));
      m = m.map(match => MatchTransform.output.json(playerId, match));
      return m;
    };

    return get();
    return CacheService.preferCache(key, get, { 
      expireSeconds: Config.CACHE.REDIS_MATCHES_CACHE_EXPIRE
    });

  }

  getMatchTelemetry(telemetryUrl, matchId) {
    
    const key = `telemetry:${telemetryUrl}`;

    const get = async () => {
      const telemetry = await TelemetryTransform(telemetryUrl, matchId);
      return telemetry;
    };

    return CacheService.preferCache(key, get, { 
      expireSeconds: Config.CACHE.REDIS_MATCHES_CACHE_EXPIRE
    });
  }

  getProHistory() {
    const key = `prohistory`;

    return CacheService.get(key) || [];
  }

  setProHistory(value) {
    const key = `prohistory`;

    return CacheService.set(key, value);
  }

}

export default new VGMatches();
