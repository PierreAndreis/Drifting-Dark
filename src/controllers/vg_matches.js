import * as lodash from "lodash";
import MatchesModel from "~/models/vg_matches";
import PlayerController from "./vg_player";

import { dirtyGameMode, getPatchesList } from "~/resources/dictionaries";


class MatchesController {
  async getPlayerId(playerName) {
    const player = await PlayerController.lookupName(playerName);
    // todo: 404 not found
    if (lodash.isEmpty(player)) return {};
    return player;
  }

  async getMatchesByPlayerId({ id, region, lastMatch }, context) {
    const matches = await MatchesModel.getMatches(id, region, lastMatch, context);
    return matches;
  }

  async getMatchByMatchId(matchId, region) {
    return MatchesModel.getMatchByMatchId(matchId, region);
  }

  async getMatchesByName(playerName, context) {
    const playerObj = await this.getPlayerId(playerName);

    // Transform clean GameMode into server name
    // Blitz => blitz_pvp_ranked
    if (typeof context.gameMode == "object") {
      context.gameMode = context.gameMode
        .map(gameMode => dirtyGameMode(gameMode) || "")
        .join(",");
    }
    else if (context.gameMode) {
      context.gameMode = dirtyGameMode(context.gameMode) || "";
    }

    if (context.season) {
      const patches = getPatchesList(context.season);
      context.patches = patches || "";
    }

    return this.getMatchesByPlayerId(playerObj, context);
    
  }

  async getMatchTelemetry(matchId, region) {
    const match = await this.getMatchByMatchId(matchId, region);
    const telemetry = await MatchesModel.getMatchTelemetry(match.telemetry.URL, matchId);

    return telemetry;
  }

  async getMatchDetails(matchId, region) {
    return await MatchesModel.getMatchByMatchId(matchId, region, true);
  }

  async getAllPages(playerName) {
    const { id, region } = await this.getPlayerId(playerName);

    const matches = await MatchesModel.getAllMatches(id, region);
    return matches;
  }

  async ProMatches() {
    return await MatchesModel.getProHistory();
  }
}

export default new MatchesController();
