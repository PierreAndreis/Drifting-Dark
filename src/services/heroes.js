import transformHeroesStats     from "~/transforms/heroesStats.js";
import {merge, sortBy}          from "~/lib/utils.js";
import Telemetry                from "~/transforms/telemetry.js";
import HeroesModel              from "~/models/vg_heroes.js";

import logger                   from "~/lib/logger";
import CacheService             from "~/services/cache";

const cacheKeyUnique = (gameMode, patchVersion) => `HeroesStatsMatchesID:${patchVersion}:${gameMode}`;

const cacheKeyStore = "HeroesStatsMatches";
const cacheKeyProcessed = "HeroesStats";

const MATCHES_PROCESS_BATCH = 150;
const MATCHES_SAVE_BATCH = 100; // `MATCHES_PROCESS_BATCH` matches in each batch
const REGIONS = ["", "na", "eu", "sa", "ea", "sg", "cn"];

const DEBUG = false;

const gameModesAllowed = ["Ranked", "Casual 5v5"];

class HeroesStats {

  async addMatch(match) {
    // Only support MatchesTransform.input jsons
    try {
      if (!gameModesAllowed.includes(match.gameMode)) return;

      const unique = await CacheService.unique(cacheKeyUnique(match.gameMode, match.patchVersion), match.id);
      if (!unique) {
        if (DEBUG) console.warn(`[HEROSTATS] Avoiding duplicates: ${match.id}`);
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

      res.push(transformHeroesStats(match).catch(err => {
        if (err.message === "InvalidJSON") {
          return;
        }
        logger.warn(err);
        err.matchId = match.id;
        throw err;
      }));
    };

    try {
      let promiseRes = await Promise.all(res);
      promiseRes = promiseRes.filter((n) => n != undefined); 
      if (DEBUG) logger.info(`[HeroStats] Matches Processed = ${promiseRes.length}`);

      // Organize better so we can merge
      let heroes = {};
      promiseRes.forEach((match) => {
        for (const hero in match) {
          let heroStats = match[hero];
          const key = `${hero}:${heroStats.patchVersion}:${heroStats.gameMode}:${heroStats.region}:${heroStats.tier}`
          heroes = merge(heroes, {[key]: heroStats});
        }
      });

      CacheService.arrayAppend(cacheKeyProcessed, heroes, true);
      return heroes;
    }
    catch(e) {
      logger.warn(`[HeroStats] Process Failed: on matchId [${e.matchId}] ${e}`);
      matches.forEach(match => match.id !== e.matchId && this.retryMatch(cacheKeyStore, match));
      return false;
    }
  }

  async saveMatches() {
    let promises = [];

    let matches = await this.getMatches(cacheKeyProcessed, MATCHES_SAVE_BATCH);
    // generate one big array in separate versions and gamemodes
    let merged = {};

    matches.forEach((payload) => {
      for (const key in payload) {
        let stats = payload[key];
        merged[key] = merge(merged[key], payload[key]);
      }
    });

    for (const key in merged) {
      let stats = merged[key];
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

    try {
      const res = await Promise.all(promises);
      return res;
    }
    catch(e) {
      console.warn(e);
      logger.warn(`[HEROSTATS] Saving Unknown Error: ${e}`);
      return false;
    }
  }

  async cacheStats() {

    const sortStats = (stats, type) => {
      const sorted = sortBy(stats, false, type, n => parseFloat(n));
      return sorted.map(m => ({name: m.actor, [type]: m[type]}));
    }

    for (let region of REGIONS) {
      const stats = await HeroesModel.heroStats(region);
      if (!region) region = "all";
      HeroesModel.saveStats("raw",      region, stats);
      HeroesModel.saveStats("pickrate", region, sortStats(stats, "pickRate"));
      HeroesModel.saveStats("banrate",  region, sortStats(stats, "banRate"));
      HeroesModel.saveStats("winrate",  region, sortStats(stats, "winRate"));
    };
  }

}

export default new HeroesStats();
