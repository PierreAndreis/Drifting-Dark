import { generateHeroesStats } from "~/transforms/global_heroes.js";

async function heroStats(match) {
  const heroes = {};

  for (const player of match.players) {
    heroes[player.actor] = [generateHeroesStats(match, player)];
  }
  return heroes;
}

export default heroStats;
