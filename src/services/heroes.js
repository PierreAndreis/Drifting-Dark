import { generateHeroesStats } from "~/transforms/global_heroes.js";

async function heroStats(match) {
  const heroes = {};

  for (const player of match.players) {
    const stats = generateHeroesStats(match, player);
    heroes[player.actor] = stats;
    heroes[player.actor].wonWith = [];
    heroes[player.actor].wonAgainst = [];
    heroes[player.actor].lostWith = [];
    heroes[player.actor].lostAgainst = [];
    if (stats.wins) {
      for (const winner of match.players) {
        if (winner === player) continue;
        if (winner.side === player.side) heroes[winner.actor].wonWith.push(winner.actor);
        if (winner.side !== player.side) heroes[winner.actor].wonAgainst.push(winner.actor);
      }
    } else {
      for (const loser of players) {
        if (loser === player) continue;
        if (loser.side === player.side) heroes[loser.actor].lostWith.push(loser.actor);
        if (loser.side !== player.side) heroes[loser.actor].lostAgainst.push(loser.actor);
      }
    }
  }
  return heroes;
}

export default heroStats;
