import * as lodash    from "lodash";
import Config         from "../config";
import SeasonResource from "~/resources/seasons";

const findSeasonByPatch = (patchVersion) => {
  let season;

  lodash.forEach(SeasonResource, (s, name) => {
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