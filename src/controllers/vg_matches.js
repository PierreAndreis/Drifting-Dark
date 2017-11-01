import MatchesModel from "src/models/vg_matches";
import * as lodash from "lodash";
import PlayerController from "./vg_player";


class MatchesController {
  async getPlayerId(playerName) {
    const player = await PlayerController.lookupName(playerName);
    // todo: 404 not found
    if (lodash.isEmpty(player)) return {};
    return player;
  }

  async getMatchesById({ id, region, lastMatch }) {
    const matches = await MatchesModel.getMatches(id, region, lastMatch);
    return matches;
  }

  async getMatchesByName(playerName, page) {
    const playerObj = await this.getPlayerId(playerName);
    // TODO: Add playerID to pros.js in resources IF this function is called by prohistory loop
    const matches = await this.getMatchesById(playerObj);
    
    return matches;
  }

  async getAllPages(playerName) {
    const { id, region } = await this.getPlayerId(playerName);

    const matches = await MatchesModel.getAllMatches(id, region);
    return matches;
  }
}

export default new MatchesController();
