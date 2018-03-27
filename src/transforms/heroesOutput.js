import * as lodash from "lodash";
import {merge}     from "./../lib/utils";

import { getKDA, getRate, getAvg }  from "~/lib/utils_stats";

import logger from "./../lib/logger";

import T3Items from "~/resources/items_t3";

let transformAggregated = (obj, totalGames) => {
  let res = [];

  if (!lodash.isArray(obj)) {
    for (let i in obj) {
      res.push({
        key: i,
        category: obj[i].category,
        wins: obj[i].wins || obj[i].win,
        games: obj[i].games,
      });
    }
  }

  else res = obj;

  return res.map((r, i, k) => ({
    key: r.key,
    category: r.category,
    winRate: getRate(r.wins, r.games),
    pickRate: getRate(r.games, totalGames),
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

const only3Relevant = (items) => {
  
}

const getBuilds = (buildsPick, buildsWin, totalGames) => {
  let res = {};


    // Merge them both together. We should do like that in the future for all. I'm stupid for not doing it first
  lodash.forEach(buildsPick, (games, i) => res[i] = merge(res[i], {key: i, category: only3Relevant(i), games}));
  lodash.forEach(buildsWin, (wins, i) => res[i] = merge(res[i], {wins}));

  
  res = lodash.filter(res, (value, index) => index.split(",").length > 3 && value.games > 10);
  res = lodash.sortBy(res, ['games', 'wins']);
  res.reverse();
  res = transformAggregated(res, totalGames);

  return res.map(r => ({
    ...r,
    items: r.key.split(",").map(item => T3Items.find(l => l.short === item).name)
  }))
}

export default (payload) => {

  // return payload;
// 
  // let roles = lodash.filter(payload.role, (r) => r.games / payload.games >= 0.33);

  return {
    name          : payload.actor,
    winRate       : getRate(payload.wins, payload.games),
    pickRate      : getRate(payload.games, payload.totalGames),
    banRate       : getRate(payload.bans, payload.totalGames),

    roles         : transformAggregated(payload.role, payload.games),
    durations     : transformAggregated(payload.durations, payload.games),
    playingAgainst: transformAggregated(payload.enemies, payload.games),
    playingWith   : transformAggregated(payload.teammates, payload.games),

    builds        : getBuilds(payload.itemspicks, payload.itemswin, payload.games),

    skills        : getSkills(payload.abilitypicks, payload.abilitywins, payload.games),

    goldPerMin    : getAvg(payload.gold, (payload.duration / 60)),
    killsPerGame  : getAvg(payload.kills, payload.games),
    deathsPerGame : getAvg(payload.deaths, payload.games),
    assistsPerGame: getAvg(payload.assists, payload.games),
  }
}