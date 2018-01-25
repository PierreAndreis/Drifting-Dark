import moment       from "moment";

import BaseCouchbase from "~/lib/BaseCouchbase";

import CacheService      from "~/services/cache";
import CouchbaseService  from "~/services/couchbase";

import { merge } from "~/lib/utils";

const PLAYERDB = new CouchbaseService("players");

class VGPlayersStats extends BaseCouchbase {
  async get(playerId) {
    const key = playerId;
    return await this.find(key);
  }
}

export default new VGPlayersStats(PLAYERDB);