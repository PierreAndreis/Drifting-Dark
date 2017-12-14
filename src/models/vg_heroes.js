import CouchbaseService from "~/services/couchbase";
import BaseCouchbase from "~/lib/BaseCouchbase";

import Config from "~/config";

import CacheService     from "~/services/cache";
import VaingloryService from "~/services/vainglory";

const HEROESDB = new CouchbaseService("heroes");

const cacheKey = "HeroesStats";

class VGHeroes extends BaseCouchbase {

}


export default new VGHeroes(HEROESDB);
