import CouchbaseService from "~/services/couchbase";
import BaseCouchbase from "~/lib/BaseCouchbase";

import { getRate } from "~/lib/utils_stats";

import Config from "~/config";

import CacheService     from "~/services/cache";
import VaingloryService from "~/services/vainglory";

const HEROESDB = new CouchbaseService("heroes");

const cacheKey = "HeroesStats";

const QUERY_GET_LATEST = (region) => `
SELECT actor, SUM(bans) as bans, SUM(games) as games, SUM(wins) as wins
FROM heroes 
WHERE patchVersion = '2.11' 
AND TONUMBER(tier) > 24
AND gameMode = 'Ranked'
${region && `AND region = '${region}'`}
GROUP BY actor 
ORDER BY bans DESC
`;


class VGHeroes extends BaseCouchbase {

  async heroStats(region) {
    const payload = await this.query(QUERY_GET_LATEST(region));

    let sumGames = payload.reduce((total, now) => {
      return total + now.games
    }, 0);
    
    const totalGames = sumGames / 6

    const heroes = payload.map(hero => {
      return {
        ...hero,
        totalGames,
        winRate:  getRate(hero.wins,  hero.games),
        banRate:  getRate(hero.bans,  totalGames),
        pickRate: getRate(hero.games, totalGames),
      }
    })

    return heroes;
  }

  cacheKey(type, region) {
    return `HeroesStats:${type.toLowerCase()}:${region}`
  }

  saveStats(type, region, payload) {
    return CacheService.set(this.cacheKey(type, region), payload);
  }

  getStats(type, region) {
    return CacheService.get(this.cacheKey(type, region));
  }
}

export default new VGHeroes(HEROESDB);
