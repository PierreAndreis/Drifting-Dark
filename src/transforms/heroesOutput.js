import * as lodash from "lodash";
import { merge } from "./../lib/utils";

import { getKDA, getRate, getAvg } from "~/lib/utils_stats";

import T3Items, {
  SITUATIONAL_BOOTS,
  SITUATIONAL_DEFENSES
} from "~/resources/items_t3";

const LIMIT_ITEMS = 4;

let transformAggregated = (obj, totalGames, raw) => {
  let res = [];

  if (!lodash.isArray(obj)) {
    for (let i in obj) {
      res.push({
        key: i,
        category: obj[i].category,
        wins: obj[i].wins || obj[i].win,
        games: obj[i].games,
        variants: obj[i].variants
      });
    }
  } else res = obj;

  if (raw) return res;

  return res.map((r, i, k) => ({
    key: r.key,
    category: r.category,
    winRate: getRate(r.wins || 1, r.games),
    pickRate: getRate(r.games, totalGames),
    variants: r.variants
  }));
};

let adjustSkills = order => {
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
};

const getSkills = (skillsPick, skillsWin, totalGames, getRaw) => {
  let res = {};

  // Merge them both together. We should do like that in the future for all. I'm stupid for not doing it first
  lodash.forEach(
    skillsPick,
    (games, i) =>
      (res[i] = merge(res[i], {
        key: i,
        category: adjustSkills(i),
        games
      }))
  );
  lodash.forEach(
    skillsWin,
    (wins, i) => (res[i] = merge(res[i], { wins }))
  );

  // Filter for only completed builds. 12 is the maximum level, so maximum of 12
  // Also, games should be higher than 50 games (??)
  const possibleRes = lodash.filter(
    res,
    (value, index) => index.split(",").length === 12 && value.games > 50
  );

  // only filter if it's a valid possibility
  if (possibleRes.length > 0) res = possibleRes;

  res = lodash.sortBy(res, ["games", "wins"]);
  res = res.slice(0, 5);
  res.reverse();

  return transformAggregated(res, totalGames, getRaw);
};

const mergeRelevant = builds => {
  let res = {};

  let groups = {};

  lodash.forEach(builds, items => {
    let itemsTranslated = items.key
      .split(",")
      .filter(item => item && item !== "0")
      .map(item => {
        const itemObj = T3Items.find(l => l.short === item);

        if (!itemObj) {
          console.log("ITEM MISSING=", item);
          return;
        }
        return itemObj;
      });

    let testItems = [];

    itemsTranslated.forEach((item, i) => {
      // to protect meta where defense item is always in the third item
      // if (i < 3) res.push(item);
      /**/ if (SITUATIONAL_DEFENSES.includes(item.name))
        testItems.push("*");
      else if (SITUATIONAL_BOOTS.includes(item.name)) testItems.push("**");
      else testItems.push(item.short);
    });

    const key = testItems.join(",");

    groups[key] = [...(groups[key] ? groups[key] : []), items];
  });

  lodash.forEach(groups, (items, key) => {
    let totalGames = items.reduce((prev, item) => prev + item.games, 0);
    let maiority = items.find(item => item.games > totalGames * 0.8);

    if (maiority) {
      res[maiority.key] = maiority;
    } else {
      let merged = items.reduce(
        (prev, next) => merge(prev, next),
        res[key]
      );
      merged.key = key;
      res[key] = merged;
    }
  });

  return res;
};

// Not being used atm
const clearVariants = initial => {
  let res = {};

  lodash.forEach(initial, (item, index) => {
    let variants = lodash.map(item.variants, (item, ability) => ({
      ...item,
      key: ability
    }));
    variants = lodash.sortBy(variants, ["games", "wins"]);
    variants.reverse();
    variants = variants.filter(
      variant => item.games * 0.05 < variant.games || variant.key !== ""
    );

    res[index] = {
      ...item,
      variants: transformAggregated(variants, item.games).map(variant => ({
        ...variant,
        items: variant.key
          .split(",")
          .filter(item => item && item !== "0")
          .map(item => T3Items.find(l => l.short === item).name)
      }))
    };
  });

  return res;
};

const limitItems = items => {
  return items
    .split(",")
    .slice(0, LIMIT_ITEMS)
    .join(",");
};

const getBuilds = (buildsPick, buildsWin, totalGames) => {
  let res = {};

  // Merge them both together. We should do like that in the future for all. I'm stupid for not doing it first
  lodash.forEach(
    buildsPick,
    (games, i) =>
      (res[limitItems(i)] = merge(res[limitItems(i)], {
        key: limitItems(i),
        games,
        variants: { [i]: { games } }
      }))
  );
  lodash.forEach(
    buildsWin,
    (wins, i) =>
      (res[limitItems(i)] = merge(res[limitItems(i)], {
        wins,
        variants: { [i]: { wins } }
      }))
  );

  // res = lodash.filter(res, (value, index) => index.split(",").length > 3);

  res = mergeRelevant(res);
  // res = clearVariants(res);
  const possibleRes = lodash.filter(
    res,
    (value, index) => index.split(",").length > 3 && value.games > 10
  );
  // only filter if it's a valid possibility
  if (possibleRes.length > 0) res = possibleRes;

  res = lodash.sortBy(res, ["games", "wins"]);
  res.reverse();
  res = res.slice(0, 15);
  res = transformAggregated(res, totalGames);
  console.log(res);

  return res.map(r => ({
    ...r,
    items: r.key
      .split(",")
      .map(translateItemShortToName)
      .filter(Boolean)
  }));
};

const translateItemShortToName = shortName => {
  const itemObj = T3Items.find(l => l.short === shortName);
  if (!shortName) {
    console.warn("Missing item:", shortName);
    return false;
  }

  return itemObj.name;
};
const rankedStats = payload => {
  return [
    {
      name: "goldPerMin",
      stats: getAvg(payload.gold, payload.duration / 60)
    },
    {
      name: "killsPerGame",
      stats: getAvg(payload.kills, payload.games)
    },
    {
      name: "deathsPerGame",
      stats: getAvg(payload.deaths, payload.games)
    },
    {
      name: "assistsPerGame",
      stats: getAvg(payload.assists, payload.games)
    },
    {
      name: "farmPerGame",
      stats: getAvg(payload.farm, payload.games)
    },
    {
      name: "damagePerGame",
      stats: getAvg(payload.totaldamage, payload.games)
    },
    {
      name: "healingPerGame",
      stats: getAvg(payload.totalhealed, payload.games)
    },
    {
      name: "kda",
      stats: getKDA(payload.kills, payload.deaths, payload.assists)
    }
  ];
};

const getCategoriesRate = (skills, totalGames) => {
  let categories = Array.from(new Set(skills.map(f => f.category)));

  return transformAggregated(
    categories.map(category => {
      let wins = 0;
      let games = 0;

      skills.forEach(s => {
        if (s.category !== category) return;
        wins += s.wins;
        games += s.games;
      });

      return {
        key: category,
        wins: wins,
        games: games
      };
    }),
    totalGames
  );
};

export default payload => {
  let categorySkills = getCategoriesRate(
    getSkills(
      payload.abilitypicks,
      payload.abilitywins,
      payload.games,
      true
    ),
    payload.games
  );

  return {
    name: payload.actor,
    winRate: getRate(payload.wins, payload.games),
    pickRate: getRate(payload.games, payload.totalGames),
    banRate: getRate(payload.bans, payload.totalGames),

    stats: rankedStats(payload),

    roles: transformAggregated(payload.role, payload.games),
    durations: transformAggregated(payload.durations, payload.games),
    playingAgainst: transformAggregated(payload.enemies, payload.games),
    playingWith: transformAggregated(payload.teammates, payload.games),

    categorySkills: lodash.sortBy(categorySkills, "pickRate").reverse(),
    builds: getBuilds(payload.itemspicks, payload.itemswin, payload.games),
    skills: getSkills(
      payload.abilitypicks,
      payload.abilitywins,
      payload.games
    )
  };
};
