import * as lodash from "lodash";
import {merge}     from "./../lib/utils";

import { getKDA, getRate, getAvg }  from "~/lib/utils_stats";

import logger from "./../lib/logger";

import Leaderboard from "./../services/leaderboards";

import T3Items, {SITUATIONAL_BOOTS, SITUATIONAL_DEFENSES} from "~/resources/items_t3";

const LIMIT_ITEMS = 4;

let transformAggregated = (obj, totalGames) => {
  let res = [];

  if (!lodash.isArray(obj)) {
    for (let i in obj) {
      res.push({
        key: i,
        category: obj[i].category,
        wins: obj[i].wins || obj[i].win,
        games: obj[i].games,
        variants: obj[i].variants,
      });
    }
  }

  else res = obj;

  return res.map((r, i, k) => ({
    key: r.key,
    category: r.category,
    winRate: getRate(r.wins || 1, r.games),
    pickRate: getRate(r.games, totalGames),
    variants: r.variants
  }));
}

let adjustSkills = (order) => {
  let arrOrder = order.split(",");

  let abilityFinal = "";

  let _tmpA = 0;
  let _tmpB = 0;
  let _tmpC = 0;
  for (let ability of arrOrder) {
    if (ability === "a") _tmpA++;
    if (ability === "b") _tmpB++;
    if (ability === "c") _tmpC++;

    if (_tmpA === 5) {
      abilityFinal += "a";
      _tmpA = 0;
    }
    if (_tmpB === 5) {
      abilityFinal += "b";
      _tmpB = 0;
    }
    if (_tmpC === 3) {
      abilityFinal += "c";
      _tmpC = 0;
    }
  }

  if (!abilityFinal.includes("a")) abilityFinal += "a";
  if (!abilityFinal.includes("b")) abilityFinal += "b";
  if (!abilityFinal.includes("c")) abilityFinal += "c";

  return abilityFinal;
}



const getSkills = (skillsPick, skillsWin, totalGames) => {
  let res = {};

  // Merge them both together. We should do like that in the future for all. I'm stupid for not doing it first
  lodash.forEach(skillsPick, (games, i) => res[i] = merge(res[i], {key: i, category: adjustSkills(i), games}));
  lodash.forEach(skillsWin, (wins, i) => res[i] = merge(res[i], {wins}));

  // Filter for only completed builds. 12 is the maximum level, so maximum of 12
  // Also, games should be higher than 50 games (??)
  res = lodash.filter(res, (value, index) => index.split(",").length === 12 && value.games > 50);
  res = lodash.sortBy(res, ['games', 'wins']);
  res.reverse();

  return transformAggregated(res, totalGames);
}

const mergeRelevant = (builds) => {

  let res = {};

  let groups = {};

  lodash.forEach(builds, items => {
    let itemsTranslated = items.key
    .split(",")
    .filter(item => item && item !== "0")
    .map(item => T3Items.find(l => l.short === item));


    let testItems = [];

    itemsTranslated.forEach((item, i) => {
      // to protect meta where defense item is always in the third item
      // if (i < 3) res.push(item);
      /**/ if (SITUATIONAL_DEFENSES.includes(item.name)) testItems.push("*");
      else if (SITUATIONAL_BOOTS.includes(item.name))    testItems.push("**");
      else testItems.push(item.short);
    });

    const key = testItems.join(",");

    groups[key] = [
      ...(groups[key] ? groups[key] : []),
      items
    ];

  });

  lodash.forEach(groups, (items, key) => {
    let totalGames = items.reduce((prev, item) => prev + item.games, 0);
    let maiority = items.find(item => item.games > (totalGames * 0.8));

    if (maiority) {
      res[maiority.key] = maiority;
    }
    else {
      let merged = items.reduce((prev, next) => merge(prev, next), res[key]);
      merged.key = key;
      res[key] = merged;
    }
  })

  return res;
}

const limitItems = (items) => {
  return items.split(",").slice(0, LIMIT_ITEMS).join(",");
}

const getBuilds = (buildsPick, buildsWin, totalGames) => {
  let res = {};


  // Merge them both together. We should do like that in the future for all. I'm stupid for not doing it first
  lodash.forEach(buildsPick, (games, i) => res[limitItems(i)] = merge(res[limitItems(i)], {key: limitItems(i), games, variants: [i]}));
  lodash.forEach(buildsWin, (wins, i) => res[limitItems(i)] = merge(res[limitItems(i)], {wins}));

  // res = lodash.filter(res, (value, index) => index.split(",").length > 3);

  res = mergeRelevant(res);
  res = lodash.filter(res, (value, index) => index.split(",").length > 3 && value.games > 10);
  // return res;
  res = lodash.sortBy(res, ['games', 'wins']);
  res.reverse();
  res = transformAggregated(res, totalGames);

  return res.map(r => ({
    ...r,
    items: r.key.split(",").map(item => T3Items.find(l => l.short === item).name)
  }))
}

const rankedStats = (payload) => {
  return [
    {
      name: "goldPerMin",
      stats: getAvg(payload.gold, (payload.duration / 60)),
    },
    {
      name: "killsPerGame",
      stats: getAvg(payload.kills, payload.games),
    },
    {
      name: "deathsPerGame",
      stats: getAvg(payload.deaths, payload.games),
    },
    {
      name: "assistsPerGame",
      stats: getAvg(payload.assists, payload.games),
    },
    {
      name: "farmPerGame",
      stats: getAvg(payload.farm, payload.games),
    },
    {
      name: "damagePerGame",
      stats: getAvg(payload.totaldamage, payload.games),
    },
    {
      name: "healingPerGame",
      stats: getAvg(payload.totalhealed, payload.games)
    },
    {
      name: "kda",
      stats: getKDA(payload.kills, payload.deaths, payload.assists),
    }
  ];
};  

export default (payload) => {
  
  return {

    name          : payload.actor,
    winRate       : getRate(payload.wins, payload.games),
    pickRate      : getRate(payload.games, payload.totalGames),
    banRate       : getRate(payload.bans, payload.totalGames),

    stats         : rankedStats(payload),

    roles         : transformAggregated(payload.role, payload.games),
    durations     : transformAggregated(payload.durations, payload.games),
    playingAgainst: transformAggregated(payload.enemies, payload.games),
    playingWith   : transformAggregated(payload.teammates, payload.games),

    builds        : getBuilds(payload.itemspicks, payload.itemswin, payload.games),
    skills        : getSkills(payload.abilitypicks, payload.abilitywins, payload.games),

  }
}