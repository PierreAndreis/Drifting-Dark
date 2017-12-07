import { generateHeroesStats } from "~/transforms/global_heroes.js";

async function heroStats(match) {
  const heroes = {};

  for (const player of match.players) {
    const stats = generateHeroesStats(match, player);
    heroes[player.actor] = stats;
  }

  // TODO: wonWith, lostWith, wonAgainst, lostAgainst to make synergy and counter stats
  // if (heroes[actor].wins) {
  //   for (const winner of players) {
  //     if (winner === players[i]) continue;
  //     if (winner.side === players[i].side) heroes[winner.actor].wonWith.push(winner.actor);
  //     if (winner.side !== players[i].side) heroes[winner.actor].wonAgainst.push(winner.actor);
  //   }
  // } else {
  //   for (const loser of players) {
  //     if (loser === players[i]) continue;
  //     if (loser.side === players[i].side) heroes[loser.actor].lostWith.push(loser.actor);
  //     if (loser.side !== players[i].side) heroes[loser.actor].lostAgainst.push(loser.actor);
  //   }
  // }
  return heroes;
}

export default heroStats;
