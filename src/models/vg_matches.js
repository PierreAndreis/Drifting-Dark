import moment       from "moment";

import Config from "~/config";

import CacheService     from "~/services/cache";
import VaingloryService from "~/services/vainglory";

import MatchTransform from "~/transforms/matches.js";

const BATCHAPI_PAGES_PER_TRY = 3;
// const BATCHAPI_DATE_DEEP_TRY = 2; // We will try 3 dates deep down (28 * 2 = 56 days worth of data)

class VGMatches {

  createCacheKey(playerId, region, {lastMatch, patch, gameMode, page}) {

    let key = `matches:${playerId}:${region}`;
    if (lastMatch) key += `:${lastMatch}`;
    if (patch)     key += `:${patch}`;
    if (gameMode)  key += `:${gameMode}`;
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

    const get = async (initialPages = 0, endDate) => {
      const queries = [];

      for (let i = 0; i < BATCHAPI_PAGES_PER_TRY; i++) {
        const page = initialPages + i;
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
        else res.push(...pg.match.map(match => MatchTransform(match)));
      });
      pages++;
    }

    return res;
  }

  async getMatchByMatchId(id, region) {
    const match = await VaingloryService.match(id, region)
    console.log(match)
    const res = MatchTransform(match)
    return res
  }
  
  async getMatches(playerId, region, lastMatch, context) {
    const key = this.createCacheKey(playerId, region, {lastMatch, ...context});
    // todo: verify if gameMode is valid using /resources/gamemodes.js
    // also limit the max page

    const get = async () => {
      
      const matches = await VaingloryService.getMatches(playerId, region, {lastMatch, ...context});
      if (!matches || matches.errors) return [];

      /* for (let i = 0; i < matches.match.length; i++) {
        // For every match create a loop depending on how many players in that match
        for (let j = 0; i < matches.match[i].matchRoster.length; i++) {
          // Get the data from the match
          const { data } = matches.match[i].matchRoster[i].rosterParticipants[j].participantPlayer;
          const { id } = data;
          const { name } = data.attributes;
          // TODO: Check couchbase if this name exists for this player ID. If not add it to the db.
        }
      }*/
      const res = matches.match.map(match => MatchTransform(match));
      
      return res;
    };

    return CacheService.preferCache(key, get, { 
      expireSeconds: Config.CACHE.REDIS_MATCHES_CACHE_EXPIRE,
      category: "matches"
    });

  }

  getProHistory() {
    const key = `prohistory`;

    return CacheService.get(key) || {};
  }

  setProHistory(value) {
    const key = `prohistory`;

    return CacheService.set(key, value);
  }

}

export default new VGMatches();
