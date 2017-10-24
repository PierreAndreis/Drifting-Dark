import moment       from "moment";

import BaseCouchbase from "src/lib/BaseCouchbase";

import CacheService      from "src/services/cache";
import CouchbaseService  from "src/services/couchbase";
import VaingloryService  from "src/services/vainglory";
import PlayerTransform   from "src/transforms/playerStats.js";

import MatchesModel   from "src/models/vg_matches";

import { merge } from "src/lib/utils";

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

  async update({id, region, lastMatch}, oldStats) {

    let stats;
    
    if (!oldStats) {
      // New Player in the system. We will query all last 28 days of matches :D
      const matches = await MatchesModel.getAllMatches(id, region);
      stats = PlayerTransform.create(matches, id);
    }
    else {
      // Old player in the system. Let's check if he has new matches then merge
      const matches = await VaingloryService.queryMatchesNewer(id, region, lastMatch);
      const statsNew = PlayerTransform.create(matches, id);
      stats = merge(oldStats, statsNew);
    }

    return stats;

  }



}

export default new VGPlayersStats(PLAYERDB);