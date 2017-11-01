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

  async getMatchesById({ id, region, lastMatch }) {
    const matches = await MatchesModel.getMatches(id, region, lastMatch);
    return matches;
  }

  async getMatchesByName(playerName, page) {
    const playerObj = await this.getPlayerId(playerName);
    // TODO: Add playerID to pros.js in resources IF this function is called by prohistory loop
    const matches = await this.getMatchesById(playerObj);
    // If a filter is provided run this
    if (!page) return matches;

    const filteredMatches = [];

    for (let i = 0; i < matches.length; i++) {
      // For each match if the gameMode is not requested in the filters skip
      if (!page.includes(matches[i].data.attributes.gameMode)) continue;
      // If this gameMode is requested add it to the filtered matches
      filteredMatches.push(matches[i]);
    }
    return filteredMatches;
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
