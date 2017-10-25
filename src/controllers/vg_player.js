import * as lodash from 'lodash';
import PlayerLookupModel from './../models/vg_player_lookup';
import PlayerStatsModel from './../models/vg_player_stats';


class PlayerController {
  lookupName(playerName) {
    return PlayerLookupModel.getByName(playerName);
  }

  async getStats(playerName) {
    const player = await this.lookupName(playerName);
    // todo: 404 not found
    if (lodash.isEmpty(player)) return {};

    const playerOldStats = await PlayerStatsModel.get(player.id);

    const stats = await PlayerStatsModel.update(player, playerOldStats);

    PlayerStatsModel.upsert(player.id, stats);
    // todo: update redis player obj

    return stats;
  }
}

export default new PlayerController();
