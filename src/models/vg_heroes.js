
import lodash from "lodash";

import CouchbaseService from "~/services/couchbase";
import BaseCouchbase from "~/lib/BaseCouchbase";

import {merge, sortBy} from "~/lib/utils";

import { getRate } from "~/lib/utils_stats";

import Config from "~/config";

import CacheService     from "~/services/cache";
import VaingloryService from "~/services/vainglory";

import HeroesOutputTransform from "~/transforms/heroesOutput";
import logger from "../lib/logger";

const HEROESDB = new CouchbaseService("heroes");

const cacheKey = "HeroesStats";

let MAX_HEROES_PER_TEAM = 10;
const PATCH = "3.1";
const GAME_MODE = "Ranked 5v5";

const QUERY_GET_LATEST = (region) => `
SELECT actor, 
SUM(bans) as bans, 
SUM(games) as games, 
SUM(wins) as wins,
SUM(\`role\`.Jungler.games) as junglerGames,
SUM(\`role\`.Carry.games) as carryGames,
SUM(\`role\`.Captain.games) as captainGames
FROM heroes 
WHERE patchVersion = '${PATCH}' 
AND TONUMBER(tier) > 15
AND gameMode = '${GAME_MODE}'
${(region && `AND region = '${region}'`) || ""}
GROUP BY actor 
ORDER BY bans DESC
`;

const query_test = (heroName) => `
SELECT *, totalGames
FROM heroes
WHERE actor = '${heroName}'
AND gameMode = '${GAME_MODE}'
AND patchVersion = '${PATCH}'
AND TONUMBER(tier) > 15
`;

const QUERY_GET_ALL_MATCHES_COUNT = (region) => `
SELECT (sum(games) / ${MAX_HEROES_PER_TEAM}) as totalGames 
FROM heroes
WHERE patchVersion = '${PATCH}' 
AND TONUMBER(tier) > 15
${(region && `AND region = '${region}'`) || ""}
AND gameMode = '${GAME_MODE}'
`;

const calculateTier = (heroes) => {

  let winRateAvg = heroes.reduce((prev, next) => prev + next.winRate, 0) / heroes.length;
  let banRateAvg = heroes.reduce((prev, next) => prev + next.banRate, 0) / heroes.length;
  let pickRateAvg = heroes.reduce((prev, next) => prev + next.pickRate, 0) / heroes.length;

  let scores = {};

  return heroes.map(h => {

    let relative = {
      winRate: h.winRate / winRateAvg,
      banRate: h.banRate / banRateAvg,
      pickRate: h.pickRate / pickRateAvg,
    }

    /**
     * Tiers:
     * 4 - OP
     * 3 - Average good
     * 2 - Average
     * 1 - Average bad
     * 0 - bad
     */
    
    // default is average
    let tier = 2;

    // if win rate is more than average and (ban rate is more than double the average or pick rate more than 1/4 of the average)
    // or win rate is more than 1.1 and pick rate more than 1/8 of the average
    // then it is tier 3 (average good)
    if ((relative.winRate > 1 && (relative.banRate >= 2 || relative.pickRate >= 1.25) )
    || (relative.winRate > 1.1 && relative.pickRate > 0.8)) {
      tier = 3;
    }

    // if winrate is less than average and ban rate is less than half of the average
    // if win rate is less than half of the average and (pick rate or ban rate is higher than 0.1)
    // then it is bad
    if ((relative.winRate <= 1 && relative.banRate <= 0.5)
     || (relative.winRate <= 0.5 && (relative.banRate > 0.1 || relative.pickRate > 0.1))) {
      tier = 0;
    }

    // now detect op and average bad
    if (tier === 3 && (relative.winRate >= 1.08 || relative.banRate >= 4)) tier = 4; // OP!

    // win rate is more than 1/9 and pick rate more than 1/4
    // or win rate is more than 1/4
    if (tier === 0 && ((relative.winRate >= 0.9) && (relative.pickRate >= 0.4))) tier = 1; // not so bad...

    return {
      ...h,
      tier
    }
  });

  return heroes;

}

class VGHeroes extends BaseCouchbase {

  async heroListStats(region) {

    const payload = await this.query(QUERY_GET_LATEST(region));

    let sumGames = payload.reduce((total, now) => {
      return total + now.games
    }, 0);

    const totalGames = sumGames / MAX_HEROES_PER_TEAM;

    let heroes = payload.map(hero => {

      let roles = [];

      // Find those roles where 1/3 of the games played where on 
      if ((hero.junglerGames / hero.games) > 0.33) roles.push("Jungler");
      if ((hero.captainGames / hero.games) > 0.33) roles.push("Captain");
      if ((hero.carryGames / hero.games) > 0.33) roles.push("Carry");

      let dict = {
        "Carry": hero.carryGames,
        "Captain": hero.captainGames,
        "Jungler": hero.junglerGames
      };

      // Sort by games of the roles
      roles.sort((a, b) => {
        if (dict[a] > dict[b]) return -1;
        if (dict[a] < dict[b]) return 1;
        return 0;
      })

      return {
        name    : hero.actor,
        roles   : roles,
        winRate : getRate(hero.wins, hero.games),
        banRate : getRate(hero.bans, totalGames),
        pickRate: getRate(hero.games, totalGames),
      }
    });

    ["winRate", "banRate", "pickRate"].forEach(property => {
      const sorted = sortBy(heroes, false, property);
      heroes = heroes.map((h, index) => ({...h, rank: {...h.rank, [property]: index + 1}}));
    });

    heroes = calculateTier(heroes, totalGames);
    let today = new Date().toLocaleDateString();

    // Saving daily for historical
    CacheService.hashSet(`Heroes:History:${region || "all"}`, today, {date: new Date().toString(), heroes: heroes}, true);

    return heroes;
  }

  async getHeroStats(heroName, region) {
    
    const [list, [{totalGames}]] = await Promise.all([
      this.query(query_test(heroName)),
      this.query(QUERY_GET_ALL_MATCHES_COUNT())
    ]);

    if (lodash.isEmpty(list)) throw Error("Hero not found");

    let merged = list.reduce((p, now) => merge(p, now.heroes), {totalGames});

    let transformed = HeroesOutputTransform(merged);
    
    return transformed;
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
