import moment       from "moment";

import Config from "src/config";

import CacheService     from "src/services/cache";
import vainglory        from "src/services/vainglory";

import {createPlayer} from "src/transforms/playerProfile.js";


class VGPlayerLookup {

  createCacheKey(playerName) {
    return `${Config.CACHE.PREFIXES.PLAYERNAME}:${playerName}`
  }

  async findPlayerAPI(playerName) {
    
    const foundRegions = [];
    const regionsCalls = [];
  
    // Add all the regions that we are going to search;
    Config.VAINGLORY.REGIONS.forEach(r => regionsCalls.push(vainglory.queryPlayerByName(r, playerName)));
  
    const result = await Promise.all(regionsCalls);
    
    for (let i = 0; i < result.length; i++) {
      let players = result[i];
      // TODO: handle all other errors, maybe make a util function to handle all other errors except 404
      // https://github.com/seripap/vainglory/blob/master/src/Errors.js
      if (players.errors && players.messages === Config.VAINGLORY.RESPONSES.REPLY_404_MSG) continue;
      players.player.forEach(player => {
        foundRegions.push(createPlayer(player));
      });
    }
  
    if (foundRegions.length == 1) return foundRegions[0];
    else {
  
      const sorted = foundRegions.sort((a, b) => {
        var date = moment(a.lastMatch)
        var now  = moment(b.lastMatch);
        
        if (now > date) return 1;
        if (date < now) return -1;
        return 0;
      });
  
      return sorted[0];
    }
  }

  async getByName(playerName) {
    try {
          const key = this.createCacheKey(playerName);
    const get = async () => {
      const res = await this.findPlayerAPI(playerName);
      if (!res) return {};
      return res;
    }

    return await CacheService.preferCache(key, get, {expireSeconds: Config.CACHE.REDIS_LOOKUP_CACHE_EXPIRE});
    } catch (error) {
      console.log(error);
    }

  } 

}

export default new VGPlayerLookup();