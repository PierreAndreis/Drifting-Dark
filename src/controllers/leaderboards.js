import lodash from "lodash";

import Config from "~/config";
import logger from "~/lib/logger";

import CacheService from "~/services/cache";

import LeaderboardsService from "~/services/leaderboards";
import LeaderboardsTransform from "~/transforms/leaderboards";
import PlayerStatsModel from "~/models/vg_player_stats";
import PlayerLookupModel from "~/models/vg_player_lookup";

const LIMIT_PER_PAGE = 10;

let getPlayerIdsStats = async (playerIds = [], type, offset) => {
  const sorted = lodash.chunk(playerIds, 2);
  const arrayOfPlayerId = sorted.map(p => p[0]);

  if (!(arrayOfPlayerId.length > 0)) return [];

  const stats = await PlayerStatsModel.get(arrayOfPlayerId);
  if (!stats) throw Error({ result: stats, playerId: arrayOfPlayerId });

  const result = sorted.map((each, position) => {
    let data = stats[each[0]].value;

    return LeaderboardsTransform.player(each, type, (position + offset), data);
  });
  return result;
}

class LeaderboardsControllers {


  async getRange(type, region, { limit, offset }) {

    limit = limit && parseInt(limit, 10);
    offset = (offset && parseInt(offset, 10)) || 0;

    const startAt = offset;
    const endAt = limit && limit < LIMIT_PER_PAGE ? startAt + limit : startAt + LIMIT_PER_PAGE;

    const cacheKey = `LeaderboardCache:${type}:${region}:${startAt}:${endAt}`;

    const get = async () => {
      try {
        const Leaderboard = new LeaderboardsService(type, region);
        const getList = await Leaderboard.range(startAt, endAt - 1);

        let res = await getPlayerIdsStats(getList, type, offset);

        // Remove those with no games from the redis, but keep them on the response....
        // really bad way of doing
        res.forEach(r => r.games < 1 && Leaderboard.remove(r.playerId));

        return res;
        
      }
      catch (e) {
        logger.warn(`Error in Leadeboard: ${JSON.stringify(e)}`);
      }
    };

    return CacheService.preferCache(cacheKey, get, {
      expireSeconds: Config.CACHE.REDIS_LEADERBOARD_CACHE_EXPIRE
    });
  };

  async getPlayer(type, region, playerName) {

    let cacheKey = `LeaderboardCache:${type}:${region}:${playerName}`;
    const get = async () => {
      try {
        const Leaderboard = new LeaderboardsService(type, region);
        let player = await PlayerLookupModel.getByName(playerName);
        if (!player) return [];

        let playerRank = await Leaderboard.get(player.id);

        if (playerRank === null) return {};

        let startAt = playerRank - (LIMIT_PER_PAGE / 2);
        let endAt = playerRank + (LIMIT_PER_PAGE / 2);

        const getList = await Leaderboard.range(startAt > 1 ? startAt : 0, endAt > 1 ? endAt : 0);
        let res = await getPlayerIdsStats(getList, type, startAt > 1 ? startAt : 0);

        // Remove those with no games... really bad way of doing
        res.forEach(r => r.games < 1 && Leaderboard.remove(r.playerId));

        return res;
      }
      catch (e) {
        logger.warn(`Error in Leadeboard/SearchPlayer: ${JSON.stringify(e)}`);
      }
    }

    return CacheService.preferCache(cacheKey, get, {
      expireSeconds: Config.CACHE.REDIS_LEADERBOARD_CACHE_EXPIRE
    });
  }
}

export default new LeaderboardsControllers();