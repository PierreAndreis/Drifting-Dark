import lodash from "lodash";

import Pros from "../resources/pro";

import MatchController from "../controllers/vg_matches";
import MatchModel from "../models/vg_matches";

import ProTransform from "../transforms/prohistory";

const PROS_PER_QUEUE = 10;
// const PROS_QUEUE_TIME = 60000 // 1 minute.
const PROS_QUEUE_TIME = 2000; // 2 seconds for development
const PROS_LIMIT_HISTORY = 50;


class ProHistory {
  constructor() {
    this.counter = 0;
    this.oldest = 0;

    this.started = false;
    this.loop = null;
  }

  async fetch() {

    let proHistory = await MatchModel.getProHistory();
    const player = Pros[this.counter];
    // Create a date for the oldest match if none exists or else give it the value of the oldest match in the array
    if (proHistory.length === 0) this.oldest = null;
    else this.oldest = Date.parse(proHistory[proHistory.length - 1].createdAt);

    // todo: after commiting filters, only search for ranked matches
    const matches = await MatchController.getMatchesByName(player.name, {gameMode: "ranked"});
    
    for (let i = 0; i < matches.length; i++) {

      let m = matches[i];
      // Turn the date into the ms number
      const matchTime = Date.parse(m.createdAt);

      // If the createdAt is older then the oldest match in the array skip to next loop
      // and if 
      const thisMatch = proHistory.find(m => m.matchId === m.id);
      if (matchTime < this.oldest || !!thisMatch) continue;
        
      // Remove the oldest if 50 matches
      if (proHistory.length === 50) proHistory.pop();

      // Add this match to the beginning of the array
      const match = ProTransform.create(m, player);

      // Somehow some matches are coming without the user we want.. Maybe name change?
      if (match) proHistory.unshift(match);
    }

    // After the loop resort everything.
    proHistory = lodash.sortBy(proHistory, ({createdAt}) => { return Date.parse(createdAt) });
    proHistory.reverse();


    MatchModel.setProHistory(proHistory);


    // Reset counter so it goes back to the first loop
    this.counter++;
    if (this.counter === Pros.length) this.counter = 0;
  }

  start() {
    this.started = true;
    this.loop = setInterval(() => this.fetch(), PROS_QUEUE_TIME)
  }

  stop() {
    this.started = false;
    clearInterval(this.loop);
    this.loop = null;
  }


}

export default new ProHistory();