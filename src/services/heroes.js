import { generateHeroesStats } from "~/transforms/global_heroes.js";
import 

async function heroStats(match) {
  const heroes = {};

  for (const player of match.players) {
    heroes[player.actor] = [generateHeroesStats(match, player)];
  }
  const telem =
  return heroes;
}

export default heroStats;
