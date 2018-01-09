import {sortBy} from "~/lib/utils";
import Config   from "~/config";

import CacheService     from "~/services/cache";
import VaingloryService from "~/services/vainglory";

import {createPlayer} from "~/transforms/playerProfile.js";


class VGPlayerLookup {

  createCacheKey(playerName) {
    return `${Config.CACHE.PREFIXES.PLAYERNAME}:${playerName}`
  }

  async findPlayerAPI(playerName) {
    const foundRegions = [];
    const regionsCalls = [];
    // Add all the regions that we are going to search;
    Config.VAINGLORY.REGIONS.forEach(r => regionsCalls.push(VaingloryService.getPlayer({playerName, region: r})));
    
    const result = await Promise.all(regionsCalls);

    for (let i = 0; i < result.length; i++) {

      let players = result[i];
      // TODO: handle all other errors, maybe make a util function to handle all other errors except 404
      // https://github.com/seripap/vainglory/blob/master/src/Errors.js
      if (players.errors) continue;
      foundRegions.push(...players.player);
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

        if (!region) res = await this.findPlayerAPI(playerName);
        else res = await vainglory.getPlayer({playerName, region});
        if (!res || res.errors) return {};

        return createPlayer(res);
      }

    return await CacheService.preferCache(key, get, {expireSeconds: Config.CACHE.REDIS_LOOKUP_CACHE_EXPIRE});
    } catch (error) {
      console.log(error);
    }

  } 

}

export default new VGPlayerLookup();
