import lodash from "lodash";

import ProHistory   from "./../controllers/prohistory";
import ProTransform from "./../transforms/prohistory";

import MatchesController from "./../controllers/vg_matches";

import CacheService from "./cache";
import {sortBy}     from "./../lib/utils";
import logger       from "./../lib/logger";

import Pros from "./../resources/pro";

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

  let proHistory = await ProHistory.get();
  const counter = await getCounter();
  const player = Pros[counter];

  const matches = await MatchesController.getMatchesByName(player.name, {gameMode: "Ranked"});

  for (let i = 0; i < matches.length; i++) {
    let m = matches[i];

    const thisMatch = proHistory.filter(({matchId, proInfo}) => (matchId === m.id && proInfo.name === player.name));
    if (proHistory.length > 1) continue;

    // Add this match to the beginning of the array
    // Somehow some matches are coming without the user we want.. Maybe name change?
    
    const match = ProTransform.create(m, player);
    if (match) proHistory.push(match);
  }
  // After the loop resort everything.
  proHistory = sortBy(proHistory, false, "createdAt", (a) => Date.parse(a));

  // Cut down the array to how many matches we want
  proHistory = proHistory.slice(0, PROS_LIMIT_HISTORY);

  ProHistory.set(proHistory);
};