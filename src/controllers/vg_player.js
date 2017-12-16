import * as lodash from "lodash";
import logger from "~/lib/logger";

import PlayerLookupModel from "~/models/vg_player_lookup";
import PlayerStatsModel from "~/models/vg_player_stats";

import PlayerStatsTransform from "~/transforms/playerStats";

class PlayerController {
  lookupName(playerName, region) {
    if (!region) return PlayerLookupModel.getByName(playerName);
    return PlayerLookupModel.getByName(playerName, region);
  }

  async getStats(playerName, opts) {
    const player = await this.lookupName(playerName);
    // todo: 404 not found
    if (lodash.isEmpty(player)) return {};

    const playerOldStats = await PlayerStatsModel.get(player.id);

    let stats = playerOldStats;

    // if there is no stats, or if the next cache is older than the current date
    // we will fetch new stats and merge with old stats 
    // or create if there is no stats
    if (!playerOldStats || new Date(playerOldStats.nextCache) < new Date()) {

      logger.silly(`new cache for ${playerName}`);

      stats = await PlayerStatsModel.update(player, playerOldStats);
      PlayerStatsModel.upsert(player.id, stats);
    }

    // return stats;
    return (opts.raw) ? stats : PlayerStatsTransform.output.json(stats, opts);
  }
}

export default new PlayerController();
