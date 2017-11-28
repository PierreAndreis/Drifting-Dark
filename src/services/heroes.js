import MatchController from "../controllers/vg_matches";

const MATCHES_PER_QUEUE = 10;
const HEROES_QUEUE_TIME = 10000; // 10 seconds for development


class HeroStats {
  constructor() {
    this.counter = 0;

    this.started = false;
    this.loop = null;
  }

  async fetch() {
    const allMatches = ""; // TODO: Get all match ids and region from redis { id: xxx, region: 'na' }
    const player = allMatches[this.counter];

    // Reset the counter before searching, so if we run this function in parallel it won't search same user
    this.counter++;
    if (this.counter === allMatches.length) this.counter = 0;

    for (let j = 0; j < MATCHES_PER_QUEUE; j++) {
      const data = MatchController.getMatchByMatchId(allMatches[j].id, allMatches[j].region);

      const heroes = {};
      const { players } = data;
      const playerLength = players.length;

      for (let i = 0; i < playerLength; i++) {
        const actor = players.actor.toLowerCase();
        heroes[actor] = {
          tier: players[i].tier,
          kills: players[i].kills,
          deaths: players[i].deaths,
          assists: players[i].assists,
          matches: 1,
          gold: players[i].gold,
          farm: players[i].farm,
          lane: players[i].nonJungleMinionKills,
          jungle: players[i].minionKills,
          wonWith: [],
          lostWith: [],
          wonAgainst: [],
          lostAgainst: [],
        };

        if (players[i].winner) heroes[actor].wins = 1;
        else heroes[actor].lost = 1;

        if (heroes[actor].wins) {
          for (const winner of players) {
            if (winner === players[i]) continue;
            if (winner.side === players[i].side) heroes[winner.actor].wonWith.push(winner.actor);
            if (winner.side !== players[i].side) heroes[winner.actor].wonAgainst.push(winner.actor);
          }
        } else {
          for (const loser of players) {
            if (loser === players[i]) continue;
            if (loser.side === players[i].side) heroes[loser.actor].lostWith.push(loser.actor);
            if (loser.side !== players[i].side) heroes[loser.actor].lostAgainst.push(loser.actor);
          }
        }
      }
    }
    // TODO: edit the couchbase with the data above for the hero stats
    // TODO: remove the matchId from redis queue list
    // create new loop
    this.loop = (this.started) ? setTimeout(() => this.fetch(), HEROES_QUEUE_TIME) : null;
  }

  start() {
    this.started = true;
    this.loop = setTimeout(() => this.fetch(), HEROES_QUEUE_TIME);
  }

  stop() {
    this.started = false;
    clearTimeout(this.loop);
    this.loop = null;
  }
}

export default new HeroStats();
