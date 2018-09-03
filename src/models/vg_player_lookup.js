import {sortBy} from "~/lib/utils";
import logger from "~/lib/logger";
import Config   from "~/config";

import CacheService     from "~/services/cache";
import VaingloryService from "~/services/vainglory";

import {createPlayer} from "~/transforms/playerProfile.js";

const DEBUG = true;

class VGPlayerLookup {

  createCacheKey(playerName) {
    return `${Config.CACHE.PREFIXES.PLAYERNAME}:${playerName}`
  }

  async findPlayerAPI({playerName, playerId}) {
    const foundRegions = [];
    const regionsCalls = [];

    // Add all the regions that we are going to search;
    Config.VAINGLORY.REGIONS.forEach(r => regionsCalls.push(VaingloryService.getPlayer({playerId, playerName, region: r})));
    
    const result = await Promise.all(regionsCalls);

    for (let i = 0; i < result.length; i++) {

      let players = result[i];
      // TODO: handle all other errors, maybe make a util function to handle all other errors except 404
      // https://github.com/seripap/vainglory/blob/master/src/Errors.js
      if (players.errors) {
        if (players.message === Config.VAINGLORY.RESPONSES.REPLY_429_MSG) {
          logger.warn("API ERROR!", players.errors);
        }
        continue;
      }

      const player = players && (players.player || [players])
      player && foundRegions.push(...player);
    }
    if (foundRegions.length === 1) return foundRegions[0];
    else {
      const sorted = sortBy(foundRegions, false, "createdAt", (a) => new Date(a));
      
      return sorted[0];
    }
  }

  async getByName(playerName, region) {
    try {
      const key = this.createCacheKey(playerName);

      const get = async () => {
        let res;

        if (DEBUG) logger.debug(`[LOOKUP] SEARCHING FOR ${playerName}`);

        if (!region) res = await this.findPlayerAPI({playerName});
        else res = await vainglory.getPlayer({playerName, region});
        if (!res || res.errors) {
          if (DEBUG) logger.debug(`[LOOKUP] NOT FOUND ${playerName}`);
          return {};
        }

        if (DEBUG) logger.debug(`[LOOKUP] FOUND ${playerName} AT ${res.raw.attributes.shardId}`)

        return createPlayer(res);
      };

      return await CacheService.preferCache(key, get, {
        expireSeconds: Config.CACHE.REDIS_LOOKUP_CACHE_EXPIRE, 
        expireSecondsEmpty: Config.CACHE.REDIS_LOOKUP_MISS_CACHE_EXPIRE
      });
    } catch (error) {
      console.log(error);
    }

  } 

  async getById(playerId, region) {
    try {
      const key = this.createCacheKey(playerId);

      const get = async () => {
        let res = await this.findPlayerAPI({playerId});

        if (DEBUG) logger.debug(`[LOOKUP] SEARCHING FOR ${playerId}`);
        console.log("res=", res);

        if (!res || res.errors) {
          if (DEBUG) logger.debug(`[LOOKUP] NOT FOUND ${playerId}`);
          return {};
        }

        if (DEBUG) logger.debug(`[LOOKUP] FOUND ${playerId} AT ${res.raw.attributes.shardId}`)

        return createPlayer(res);
      };
      // return get();

      return await CacheService.preferCache(key, get, {
        expireSeconds: Config.CACHE.REDIS_LOOKUP_CACHE_EXPIRE, 
        expireSecondsEmpty: Config.CACHE.REDIS_LOOKUP_MISS_CACHE_EXPIRE
      });
    } catch (error) {
      console.log(error);
    }

  } 

}

export default new VGPlayerLookup();
