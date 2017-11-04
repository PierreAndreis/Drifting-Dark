import lodash from "lodash";

import Pros from "../resources/pro";

import MatchController from "../controllers/vg_matches";
import MatchModel from "../models/vg_matches";

import ProTransform from "../transforms/prohistory";

const PROS_PER_QUEUE = 10;
// const PROS_QUEUE_TIME = 30000 // 30 seconds
const PROS_QUEUE_TIME =10000; // 10 seconds for development
const PROS_LIMIT_HISTORY = 50;


class ProHistory {
  constructor() {
    this.counter = 0;

    this.started = false;
    this.loop = null;
  }

  async fetch() {

    let proHistory = await MatchModel.getProHistory();
    const player = Pros[this.counter];

    // Reset the counter before searching, so if we run this function in parallel it won't search same user
    this.counter++;
    if (this.counter === Pros.length) this.counter = 0;

    // todo: after commiting filters, only search for ranked matches
    const matches = await MatchController.getMatchesByName(player.name, {gameMode: "ranked"});

    console.log(`ProHistory: Found ${matches.length} matches from ${player.name} `)

    for (let i = 0; i < matches.length; i++) {
      let m = matches[i];

      const thisMatch = proHistory.find(({matchId, proInfo}) => (matchId === m.id && proInfo.name === player.name));
      if (!!thisMatch) continue;

      // Add this match to the beginning of the array
      const match = ProTransform.create(m, player);
      // Somehow some matches are coming without the user we want.. Maybe name change?
      if (match) proHistory.push(match);
    }
    // After the loop resort everything.
    proHistory = lodash.sortBy(proHistory, ({createdAt}) => { return Date.parse(createdAt) });
    proHistory.reverse();

    // Cut down the array to how many matches we want
    proHistory = proHistory.slice(0, PROS_LIMIT_HISTORY);

    MatchModel.setProHistory(proHistory);
    // create new loop
    this.loop = (this.started) ? setTimeout(() => this.fetch(), PROS_QUEUE_TIME) : null;
  }

  start() {
    this.started = true;
    this.loop = setTimeout(() => this.fetch(), PROS_QUEUE_TIME)
  }

  stop() {
    this.started = false;
    clearTimeout(this.loop);
    this.loop = null;
  }


}

export default new ProHistory();