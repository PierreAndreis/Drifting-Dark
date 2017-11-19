import * as lodash from "lodash";

const ALLSEASONS = {
  spring07: ["2.2", "2.3", "2.4", "2.5"],
  summer07: ["2.6", "2.7"],
  autumn07: ["2.8", "2.9", "2.10"]
}

const findSeasonByPatch = (patchVersion) => {
  let season;

  lodash.forEach(ALLSEASONS, (s, name) => {
    if (s.includes(patchVersion)) {
      season = name;
      return false;
    }
  })


  return season;
}

export const createPlayer = (p) => {
  
  const player = {...p.raw};

  let patch = player.attributes.patchVersion;

  let season = findSeasonByPatch(patch);

  return {
    id:            player.id,
    name:          player.attributes.name,
    region:        player.attributes.shardId,
    lastPatch:     patch,
    lastSeason:    season,
  }
}