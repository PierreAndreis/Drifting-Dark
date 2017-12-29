import ABILITIES from "./abilities";
import GAMEMODES from "./gamemodes";
import SEASONS   from "./seasons";
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

export const cleanAbility = (ability) => {
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
