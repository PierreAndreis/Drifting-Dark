import moment       from "moment";

import Config from "~/config";

import CacheService     from "~/services/cache";
import vainglory        from "~/services/vainglory";

import {createPlayer} from "~/transforms/playerProfile.js";


class VGPlayerLookup {

  createCacheKey(playerName) {
    return `${Config.CACHE.PREFIXES.PLAYERNAME}:${playerName}`
  }

  async findPlayerAPI(playerName) {
    const foundRegions = [];
    const regionsCalls = [];
    // Add all the regions that we are going to search;
    Config.VAINGLORY.REGIONS.forEach(r => regionsCalls.push(vainglory.queryPlayerByName(playerName, r)));
    
    const result = await Promise.all(regionsCalls);

    for (let i = 0; i < result.length; i++) {

      let players = result[i];
      // TODO: handle all other errors, maybe make a util function to handle all other errors except 404
      // https://github.com/seripap/vainglory/blob/master/src/Errors.js
      if (players.errors) continue;
      foundRegions.push(players);
      // players.player.forEach(player => {
      //   foundRegions.push(createPlayer(player));
      // });

    }

    
    if (foundRegions.length === 1) return foundRegions[0];
    else {

      const sorted = foundRegions.sort((a, b) => {
        var date = moment(a.player.createdAt);
        var now  = moment(b.player.createdAt);
        
        if (now > date) return 1;
        if (date < now) return -1;
        return 0;
      });
      return sorted[0];
    }
  }

  async getByName(playerName, region) {
    try {
      const key = this.createCacheKey(playerName);

      const get = async () => {
        let res;

        if (!region) res = await this.findPlayerAPI(playerName);
        else res = await vainglory.queryPlayerByName(playerName, region);
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
