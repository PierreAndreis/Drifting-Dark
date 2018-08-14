import ABILITIES from "./abilities";
import GAMEMODES from "./gamemodes";
import SEASONS   from "./seasons";
import SkillTiers from "./tiers_numbers";

// Blitz => blitz_pvp_ranked
export const dirtyGameMode = (cleanGameMode) => {
  const info = GAMEMODES.find(gm => gm.name === cleanGameMode);
  return info && info.serverName || false;
}

export const getPatchesList = (season) => {
  const patches = SEASONS[season];
  return patches;
}

export const findSeasonByPatch = (patchVersion) => {
  let season;

  for (let name in SEASONS) {
    let s = SEASONS[name];
    if (s.includes(patchVersion)) {
      season = name;
      break;
    }
  };
  return season;
}

// export const getTier = (rankpoints) => {
//   let skillTier = -1;
//   rankpoints = Number(rankpoints);

//   // Lol at those with more than 3000
//   if (rankpoints > 3000) return 29;

//   for(let tier in SkillTiers[0]) {
//     let obj = SkillTiers[0][tier];
//     if ((obj.starts <= rankpoints) && (obj.ends >= rankpoints)) {
//       skillTier = tier;
//       break;
//     }
//   }


//   return skillTier;
// }

export const getTier = points => {
  points = Number(points);
  let tierInfo;

  for (let tier in SkillTiers) {
    let t = SkillTiers[tier];
    if (t.starts <= points && t.ends > points) {
      tierInfo = tier;

      break;
    }
  }

  if (!tierInfo) {
    if (points === -1) tierInfo = 0;
    if (points >= 3000) tierInfo = 30;
  }

  return tierInfo;

  // return {
  //   ...SkillTiers[tierInfo],
  //   tier: Math.ceil(tierInfo / 3), // Bronze, Silver, Gold
  // };
};

export const latestSeason = Object.keys(SEASONS)[Object.keys(SEASONS).length - 1];

export const cleanAbility = (ability) => {
  if (ability.includes("SILVERNAIL"), ABILITIES[ability]);

  if (!ABILITIES[ability]) console.warn(ability, "ability not found");
  return ABILITIES[ability] || null;
};

export const cleanActor = (actor) => {
  const badServerNames = [
    { token: '*Hero009*', name: 'Krul' },
    { token: '*Hero010*', name: 'Skaarf'},
    { token: '*Sayoc*', name: 'Taka'},
    { token: '*Hero016*', name: 'Rona'}
  ];
  const match = badServerNames.filter((item) => item.token === actor);

  if (match.length > 0) {
    return match[0].name;
  }

  return actor.replace(/\*/g, '');
}
