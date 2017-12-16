import generateHeroesStats      from "~/transforms/global_heroes.js";
import {merge}                  from "~/lib/utils.js";
import Telemetry                from "~/transforms/telemetry.js";
import MatchesModel             from "~/models/vg_matches.js";
import HeroesModel              from "~/models/vg_heroes.js";

import logger                   from "~/lib/logger";

import CacheService     from "~/services/cache";

const cacheKeyUnique = "HeroesStatsMatchesID";
const cacheKeyStore = "HeroesStatsMatches";
const cacheKeyProcessed = "HeroesStats";


const MATCHES_PROCESS_BATCH = 50;
const MATCHES_SAVE_BATCH = 50;

const DEBUG = false;

class HeroesStats {

  async addMatch(match) {
    // Only support MatchesTransform.input jsons
    try {
      const duplicated = await CacheService.unique(cacheKeyUnique, match.id);
      if (!duplicated) {
        // return console.warn(`[HEROSTATS] Avoiding duplicates: ${match.id}`);
        return;
      }
      if (DEBUG) logger.info(`Adding Heroes Match ID ${match.id}`)
      return await CacheService.arrayAppend(cacheKeyStore, match, true);
    }
    catch(e) {
      logger.warn(`[HEROSTATS] ERROR ON ADD MATCH ${e}`);
      return false;
    }
  }

  addMatches(matches) {
    return matches.map(match => this.addMatch(match));
  }

  async retryMatch(key, match) {
    return await CacheService.arrayAppend(key, match, true);
  }

  async getMatches(store, qnty) {
    const res = [];
    for (let index = 0; index < qnty; index++) {
      const match = await CacheService.arrayPop(store, true);
      if (match === null) break;
      res.push(match);
    }
    return res;
  }

  async processMatches() {

    let res = [];

    const matches = await this.getMatches(cacheKeyStore, MATCHES_PROCESS_BATCH);
    for (let index = 0; index < matches.length; index++) {
      const match = matches[index];
      res.push(generateHeroesStats(match).catch(e => {
        if (e.message === "InvalidJSON") {
          return;
        }
        else throw Error(e);
      }));
    };

    try {
      let promiseRes = await Promise.all(res);
      promiseRes = promiseRes.filter((n) => n != undefined); 
      if (DEBUG) logger.info(`[HeroStats] Matches Processed=${promiseRes.length}`);

      // Organize better so we can merge
      let heroes = {};
      promiseRes.forEach((match) => {
        for (const hero in match) {
          let heroStats = match[hero];
          const key = `${hero}:${heroStats.patchVersion}:${heroStats.gameMode}:${heroStats.region}`
          heroes = merge(heroes, {[key]: heroStats});
        }
      });

      CacheService.arrayAppend(cacheKeyProcessed, heroes, true);

      return heroes;
    }
    catch(e) {
      logger.warn(`[HeroStats] Process Failed: ${e}`);
      matches.forEach(match => this.retryMatch(cacheKeyStore, match));
      return false;
    }
  }

  async saveMatches() {
    let promises = [];

    let matches = await this.getMatches(cacheKeyProcessed, MATCHES_SAVE_BATCH);
    // generate one big array in separate versions and gamemodes

    matches.forEach((payload) => {
      for (const key in payload) {
        let stats = payload[key];
        promises.push((async () => {
          try {
            let getRes = await HeroesModel.getAndLock(key);
            if (!getRes) throw Error(`Locked`);
            let res = merge(getRes.value, stats);
            const insert = await HeroesModel.upsert(key, res, {cas: getRes.cas});
            if (!insert) throw Error(`WrongKey`);
            return insert;
          }
          catch(e) {
            if (e.message === "Locked" || e.message === "WrongKey") {
              logger.warn(`[HEROSTATS] Saving Error Known: [${key}] ${e.message}`);
            } 
            logger.warn(`[HEROSTATS] Saving unknown error: [${key} ${e}`);
            this.retryMatch(cacheKeyProcessed, {[key]: stats});
          }
        })());
      }
    });

    try {
      const res = await Promise.all(promises);
      return res;
    }
    catch(e) {
      logger.warn(`[HEROSTATS] Saving Unknown Error: ${e}`);
      return false;
    }
  }


}

export default new HeroesStats();
