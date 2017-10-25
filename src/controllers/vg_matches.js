import * as lodash from 'lodash';
import PlayerController from './vg_player';

import MatchesModel from '../models/vg_matches';

class MatchesController {
  static async getPlayerId(playerName) {
    const player = await PlayerController.lookupName(playerName);
    // todo: 404 not found
    if (lodash.isEmpty(player)) return {};
    return player;
  }

  static async getMatchesById({ id, region, lastMatch }) {
    const matches = await MatchesModel.getMatches(id, region, lastMatch);

    return matches;
  }

  async getMatchesByName(playerName, page) {
    const playerObj = await this.getPlayerId(playerName);
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
