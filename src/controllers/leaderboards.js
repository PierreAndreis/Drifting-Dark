import lodash from "lodash";

import Config from "~/config";

import CacheService from "~/services/cache";

import LeaderboardsService   from "~/services/leaderboards";
import LeaderboardsTransform from "~/transforms/leaderboards";
import PlayerStatsModel      from "~/models/vg_player_stats";

const LIMIT_PER_PAGE = 10;

class LeaderboardsControllers {


  async getRange(type, region, {limit, offset}) {

    const startAt = offset || 0;
    const endAt = limit && limit < LIMIT_PER_PAGE ? startAt + limit : startAt + LIMIT_PER_PAGE;

    const cacheKey = `LeaderboardCache:${type}:${region}:${limit}:${offset}`;
    
    const get = async () => {
      const Leaderboard = new LeaderboardsService(type, region);
      const getList = await Leaderboard.range(startAt, endAt);
      const sorted = lodash.chunk(getList, 2);

      const arrayOfPlayerId = sorted.map(p => p[0]);

      if (!(arrayOfPlayerId > 0)) return [];
      
      const stats = await PlayerStatsModel.get(arrayOfPlayerId);
      if (!stats) throw Error("Leaderboard error.");

      const result = sorted.map((each, position) => {
        let data = stats[each[0]].value;

        return LeaderboardsTransform.player(each, type, position, data);
      });
      return result;
    };

    return CacheService.preferCache(cacheKey, get, { 
      expireSeconds: Config.CACHE.REDIS_LEADERBOARD_CACHE_EXPIRE
    });
  };
}

export default new LeaderboardsControllers();