import {performance} from "perf_hooks";
import * as lodash   from "lodash";

import logger     from "~/lib/logger";
import { merge }  from "~/lib/utils";

import LeaderboardService from "~/services/leaderboards";
import VaingloryService   from "~/services/vainglory";
import HeroesStats        from "~/services/heroes";
import VPRService         from "~/services/vpr";

import PlayerLookupModel from "~/models/vg_player_lookup";
import PlayerStatsModel  from "~/models/vg_player_stats";

import PlayerStatsTransform from "~/transforms/playerStats";
import MatchTransform       from "~/transforms/matches.js";

import MatchesController   from "~/controllers/vg_matches";


class PlayerController {

  /*
  migrate(stats) {
    // Removing bad name on gameModes
    
    if (stats.patches && stats.patches["2.12"] && stats.patches["2.12"]["gameModes"] && stats.patches["2.12"]["gameModes"]["private_party_vg_5v5"]) {
      stats.patches["2.12"]["gameModes"]["Private 5v5"] = merge(stats.patches["2.12"]["gameModes"]["Private 5v5"], lodash.cloneDeep(stats.patches["2.12"]["gameModes"]["private_party_vg_5v5"]));
      delete stats.patches["2.12"]["gameModes"]["private_party_vg_5v5"];
    } 

    return stats;
  }
  */

  lookupName(playerName, region) {
    if (!playerName) return {};
    if (!region) return PlayerLookupModel.getByName(playerName);
    return PlayerLookupModel.getByName(playerName, region);
  }

  async update({id, region}, oldStats) {

    let stats;
    let matches;

    if (!oldStats) {
      // New Player in the system. We will query all last 28 days of matches :D
      // todo: increase to 120 days
      matches = await MatchesController.getAllPages(id, region);
      stats = PlayerStatsTransform.input.json(matches, id);
    }
    else {

      // Old player in the system. Let's check if he has new matches then merge

      // check if the last match is set on OldStats, if it is, check if last match was less than 28 days ago
      // if it is, we will use it. otheriwse, use the day from 28 days ago.
      // This is due we need to be in the range of 28 days
      // This is also bad, because we will be skipping matches.
      let oldestDate = new Date();
      oldestDate.setDate(oldestDate.getDate() - 28);
      let lastMatch;

      if (oldStats.lastMatch && new Date(oldStats.lastMatch) > oldestDate ) {
        lastMatch = oldStats.lastMatch;
      } else lastMatch = oldestDate;

      matches = await VaingloryService.getMatches(id, region, {startMatch: lastMatch});

      if (matches.errors) matches = []; // todo: error handler
      else matches = matches.match.map(m => MatchTransform.input.json(m));
      
      const statsNew = PlayerStatsTransform.input.json(matches, id);
      stats = merge(oldStats, statsNew);
    }

    // Heroes Stats
    if (matches !== [] && matches) HeroesStats.addMatches(matches);
    
    return stats;
  }

  async rankUpdate(type, playerId, region, points) {

    let res = {
      global:   -1,
      regional: -1,
      points: points,
    }

    if (parseInt(points, 10) < 1) return res;
    
    const LeaderboardGlobal   = new LeaderboardService(type, "all");
    const LeaderboardRegional = new LeaderboardService(type, region);

    const promises = [
      LeaderboardGlobal.updateAndGet(playerId, points).then(rank => res.global = rank),
      LeaderboardRegional.updateAndGet(playerId, points).then(rank => res.regional = rank)
    ]

    await Promise.all(promises);

    return res;
  }

  async getStats(playerName, opts) {
    const player = await this.lookupName(playerName);
    // todo: 404 not found
    if (lodash.isEmpty(player)) return {};
    let stats = await PlayerStatsModel.get(player.id);

    // if there is no stats, or if the next cache is older than the current date
    // we will fetch new stats and merge with old stats 
    // or create if there is no stats

    // opts.raw is a way to force to refresh
    if (!stats || new Date(stats.nextCache) < new Date() || opts.raw) {
      logger.silly(`updating ${playerName}`);
      const t0 = performance.now();

      stats = await this.update(player, stats);
      
      // If this player exists... and has played a match recently...
      if (stats.region) {

        // todo: find a way of making sure the player has at least 10 wins on recent season
        const promises = [
          this.rankUpdate("ranked", player.id, stats.region, stats.rankVst).then(res => stats.rankedRanking = res),
          this.rankUpdate("blitz", player.id, stats.region, stats.blitzVst).then(res => stats.blitzRanking = res),
        ];

        await Promise.all(promises);
      }

      // stats = VPRService.update(stats);


      // Saving on database
      PlayerStatsModel.upsert(player.id, stats);

      const result = performance.now() - t0;

      (
        result > 1000 &&
        logger.warn(`updated ${playerName} in ${result.toFixed(0)}ms`)
      ) || logger.silly(`updated ${playerName} in ${result.toFixed(0)}ms`);
    }

    return (opts.raw) ? stats : PlayerStatsTransform.output.json(stats, opts);
  }
}

export default new PlayerController();
