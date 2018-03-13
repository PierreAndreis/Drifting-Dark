import lodash from "lodash";
import PlayerStatsTransform from "./playerStats";
import {sortBy} from "./../lib/utils";
import { latestSeason } from "~/resources/dictionaries";

let LATEST_SEASON = latestSeason;

const LeaderboardTypes = {
  "blitz": "Blitz",
  "ranked": "Ranked",
}

const LeaderboardPlayer = ([playerId, points], type, position, data) => {

  const {stats} = PlayerStatsTransform.output.json(data, {gameMode: LeaderboardTypes[type], season: LATEST_SEASON});

  const heroes = sortBy(lodash.get(stats, "Heroes", []), false, "games")
    .slice(0, 5)
    .map(hero => hero.name);

  return {
    playerId: playerId,
    name:     data.name,
    region:   data.region,
    tier:     data.tier,
    position: position + 1,
    points:   points,
    kda:      lodash.get(stats, "kda",        0),
    winRate:  lodash.get(stats, "winRate", "0%"),
    kp:       lodash.get(stats, "kp",      "0%"),
    games:    lodash.get(stats, "games",      0),
    wins:     lodash.get(stats, "wins",       0),
    topHeroes: heroes,
  }
}

export default {
  player: LeaderboardPlayer
}