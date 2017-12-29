import * as lodash    from "lodash";
import Config         from "../config";
import { findSeasonbyPatch } from "~/resources/dictionaries";

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