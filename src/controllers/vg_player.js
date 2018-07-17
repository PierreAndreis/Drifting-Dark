import {performance} from "perf_hooks";
import lodash from "lodash";

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

import { latestSeason } from "../resources/dictionaries";
import Seasons from "../resources/seasons";
import SendToVGPRIME from "../services/vgprime";

let CURRENT_SEASON = Seasons[latestSeason];
let MINIMUM_MATCHES_LEADERBOARD = 5;

class PlayerController {

  migrate(stats) {
    // Removing bad name on gameModes
    
    // if (stats.patches && stats.patches["3.1"] && stats.patches["3.1"]["gameModes"] && stats.patches["3.1"]["gameModes"]["5v5_pvp_ranked"]) {
    //   stats.patches["3.1"]["gameModes"]["Ranked 5v5"] = merge(stats.patches["3.1"]["gameModes"]["Ranked 5v5"], lodash.cloneDeep(stats.patches["3.1"]["gameModes"]["5v5_pvp_ranked"]));
    //   delete stats.patches["3.1"]["gameModes"]["5v5_pvp_ranked"];
    // } 

    // return stats;
    return stats;
  }

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
    // VGPRIME
    if (matches && matches.length > 0) {
      HeroesStats.addMatches(matches);
      // SendToVGPRIME(matches);
    }
    
    return stats;
  }

  async rankUpdate(type, playerId, region, points) {

    let res = {
      global:   -1,
      regional: -1,
      points: points,
    }
    
    const LeaderboardGlobal   = new LeaderboardService(type, "all");
    const LeaderboardRegional = new LeaderboardService(type, region);

    if (parseInt(points, 10) < 1) {
      LeaderboardGlobal.remove(playerId);
      LeaderboardRegional.remove(playerId);
      return res;
    }

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
      
      // If this player exists...
      if (stats.region) {

        let rankedGames = 0;
        let blitzGames = 0;
        let ranked5v5Games = 0;

        // Look for matches on the current seasons
        CURRENT_SEASON.forEach(patch => {
          rankedGames += lodash.get(stats, `patches[${patch}].gameModes.Ranked.games`, 0);
          blitzGames += lodash.get(stats, `patches[${patch}].gameModes.Blitz.games`, 0);
          ranked5v5Games += lodash.get(stats, `patches[${patch}].gameModes.Ranked 5v5.games`, 0);
        });

        // and has X amount of matches this season...
        let rankedPoints = rankedGames > MINIMUM_MATCHES_LEADERBOARD ? stats.rankVst  : -1;
        let blitzPoints  = blitzGames  > MINIMUM_MATCHES_LEADERBOARD ? stats.blitzVst : -1;
        let ranked5v5Points  = ranked5v5Games  > MINIMUM_MATCHES_LEADERBOARD ? stats.rank5v5Vst : -1;

        const promises = [
          this.rankUpdate("ranked", player.id, stats.region, rankedPoints).then(res => stats.rankedRanking = res),
          this.rankUpdate("blitz", player.id, stats.region, blitzPoints).then(res => stats.blitzRanking = res),
          this.rankUpdate("ranked5v5", player.id, stats.region, ranked5v5Points).then(res => stats.ranked5v5Ranking = res)
        ];

        await Promise.all(promises);
      }

      // stats = VPRService.update(stats);
      // stats = this.migrate(stats);

      // Saving on database
      if (player.name) {
        // XX Somehow couchbase is failing and player stats are getting replaced.
        // as a small hack, not really effective, avoid saving if the player doesn't exist
        
        PlayerStatsModel.upsert(player.id, stats);
      }

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
