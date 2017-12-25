import CouchbaseService from "~/services/couchbase";
import BaseCouchbase from "~/lib/BaseCouchbase";

import Config from "~/config";

import CacheService     from "~/services/cache";
import VaingloryService from "~/services/vainglory";

const HEROESDB = new CouchbaseService("heroes");

const cacheKey = "HeroesStats";

class VGHeroes extends BaseCouchbase {

  callCouch(select, from, where, group, order, ascDesc) {
    console.log('inside coudh')
    if (!select) return this.query("SELECT patchVersion, actor, SUM(bans) as bans, SUM(games) as games FROM heroes WHERE patchVersion = '2.11' GROUP BY patchVersion, actor ORDER BY bans DESC");
    return this.query(`SELECT ${select} FROM ${from} WHERE ${where} GROUP BY ${group} ORDER BY ${order} ${ascDesc}"`);
  }

  getTotalGames(dbData) {
    return dbData.reduce((prev, now) => prev.games + now.games) / 6;
  }

  async bans() {
    const dbData = await this.callCouch();
    console.log(dbData)
    return dbData.map((hero) => {
      console.log('inside map')
      hero.banRate    = hero.bans / this.getTotalGames(dbData);
      console.log(hero.banRate)
      return hero;
    });
  }

  async picks() {
    const dbData = await this.callCouch();
    return dbData.map((hero) => {
      hero.pickRate   = (hero.games - hero.bans) / this.getTotalGames(dbData);
      return hero;
    });
  }

  async games() {
    const dbData = await this.callCouch();
    return dbData.map((hero) => {
      hero.gamesRate  = hero.games / this.getTotalGames(dbData);
      return hero;
    });
  }
}

export default new VGHeroes(HEROESDB);
