import moment       from "moment";

import BaseCouchbase from "~/lib/BaseCouchbase";

import CacheService      from "~/services/cache";
import CouchbaseService  from "~/services/couchbase";
import VaingloryService  from "~/services/vainglory";
import HeroesStats       from "~/services/heroes";

import PlayerTransform   from "~/transforms/playerStats.js";

import MatchesModel   from "~/models/vg_matches";
import MatchTransform from "~/transforms/matches.js";

import { merge } from "~/lib/utils";

const PLAYERDB = new CouchbaseService("players");

class VGPlayersStats extends BaseCouchbase {

  createKey(playerId) {
    return `${playerId}`;
  }

  async get(playerId) {
    const key = this.createKey(playerId);

    const stats = await this.find(key);
    return stats;

  }

  async create(playerId, doc) {
    const key = this.createKey(playerId);

    return this.insert(key, doc);
  }

  async update({id, region}, oldStats) {

    let stats;

    let matches;

    if (!oldStats) {
      // New Player in the system. We will query all last 28 days of matches :D
      matches = await MatchesModel.getAllMatches(id, region);
      stats = PlayerTransform.input.json(matches, id);
    }
    else {
      // Old player in the system. Let's check if he has new matches then merge
      let oldestDate = new Date();
      oldestDate.setDate(oldestDate.getDate() - 28);

      // check if the last match is set on OldStats, if it is, check if last match was less than 28 days ago
      let lastMatch;

      if (oldStats.lastMatch && new Date(oldStats.lastMatch) > oldestDate ) {
        lastMatch = oldStats.lastMatch;
      } else lastMatch = oldestDate;
      matches = await VaingloryService.getMatches(id, region, {startMatch: lastMatch});
      if (matches.errors) matches = [];
      else matches = matches.match.map(m => MatchTransform.input.json(m));
      
      const statsNew = PlayerTransform.input.json(matches, id);
      stats = merge(oldStats, statsNew);
    }

    // Heroes Stats
    if (matches !== [] && matches) HeroesStats.addMatches(matches);
    
    return stats;
  }
}

export default new VGPlayersStats(PLAYERDB);