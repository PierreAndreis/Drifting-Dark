import MatchesModel from "~/models/vg_matches";
import * as lodash from "lodash";
import PlayerController from "./vg_player";


class MatchesController {
  async getPlayerId(playerName) {
    const player = await PlayerController.lookupName(playerName);
    // todo: 404 not found
    if (lodash.isEmpty(player)) return {};
    return player;
  }

  async getMatchesById({ id, region, lastMatch }, context) {
    const matches = await MatchesModel.getMatches(id, region, lastMatch, context);
    return matches;
  }

  async getMatchByMatchId(matchId) {
    return MatchesModel.getMatchByMatchId(matchId)
  }

  async getMatchesByName(playerName, context) {
    const playerObj = await this.getPlayerId(playerName);
    // TODO: Add playerID to pros.js in resources IF this function is called by prohistory loop
    // if it's a array, let's join with comma
    if (typeof context.gameMode == "object") context.gameMode = context.gameMode.join(",");

    return this.getMatchesById(playerObj, context);
    
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
