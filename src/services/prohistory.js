import lodash from "lodash";

import MatchController from "../controllers/vg_matches";
import MatchModel      from "../models/vg_matches";

import prohistory   from "../transforms/prohistory";
import ProTransform from "../transforms/prohistory";

import CacheService from "./cache";
import {sortBy}     from "../lib/utils";
import logger       from "../lib/logger";

import Pros from "../resources/pro";

const PROS_PER_QUEUE = 10;
const PROS_LIMIT_HISTORY = 50;
const PROS_COUNTER_KEY = "PRO_HISTORY_COUNTER";

const getCounter = async () => {
  await CacheService.inc(PROS_COUNTER_KEY);
  let c = await CacheService.get(PROS_COUNTER_KEY);
  if (c === Pros.length) {
    CacheService.set(PROS_COUNTER_KEY, 0);
    c = 0;
  }
  return c;
}

export default async () => {

  let proHistory = await MatchModel.getProHistory();
  const counter = await getCounter();
  const player = Pros[counter];

  const matches = await MatchController.getMatchesByName(player.name, {gameMode: "ranked"});

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
  proHistory = sortBy(proHistory, false, "createdAt", (a) => Date.parse(a));

  // Cut down the array to how many matches we want
  proHistory = proHistory.slice(0, PROS_LIMIT_HISTORY);

  MatchModel.setProHistory(proHistory);
};