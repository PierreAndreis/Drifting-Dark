import { generateHeroesStats } from "~/transformers/global_heroes";

class HeroStats {
  async update(match) {
    const heroes = [];

    for (const p of match.included) {
      if (p.type !== "participant") continue;
      const stats = await generateHeroesStats.update(match, p);
      heroes.push(stats);
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
}

export default HeroStats;
