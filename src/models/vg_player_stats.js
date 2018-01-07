import moment       from "moment";

import BaseCouchbase from "~/lib/BaseCouchbase";

import CacheService      from "~/services/cache";
import CouchbaseService  from "~/services/couchbase";
import VaingloryService  from "~/services/vainglory";
import HeroesStats       from "~/services/heroes";

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

}

export default new VGPlayersStats(PLAYERDB);