import moment       from "moment";

import BaseCouchbase from "~/lib/BaseCouchbase";

import CacheService      from "~/services/cache";
import CouchbaseService  from "~/services/couchbase";
import VaingloryService  from "~/services/vainglory";
import PlayerTransform   from "~/transforms/playerStats.js";

import MatchesModel   from "~/models/vg_matches";

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

  async update({id, region, lastMatch}, oldStats) {

    let stats;
    
    if (!oldStats) {
      // New Player in the system. We will query all last 28 days of matches :D
      const matches = await MatchesModel.getAllMatches(id, region);
      stats = PlayerTransform.create(matches, id);
    }
    else {
      // Old player in the system. Let's check if he has new matches then merge
      const matches = await VaingloryService.getMatches(id, region, {startMatch: lastMatch});
      const statsNew = PlayerTransform.create(matches, id);
      stats = merge(oldStats, statsNew);
    }
    
    return stats;
  }

  async checkAKA(matches) {
    for (let i = 0; i < matches.match.length; i++) {
      let match = matches.match[i]
      // For every match create a loop depending on how many players in that match
      for (let j = 0; j < match.matchRoster.length; j++) {
        match = match.matchRoster[j]
        for (let k = 0; k < match.rosterParticipants.length; k++) {
          match = match.rosterParticipants[k]
          // Get the data from the match
          const { data } = match.participantPlayer;
          const { id } = data;
          const { name } = data.attributes;
        // TODO: Check couchbase if this name exists for this player ID. If not add it to the db.
        }
      }
    }
  }
}

export default new VGPlayersStats(PLAYERDB);