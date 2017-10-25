import * as lodash from 'lodash';
import Vg from 'vainglory';

import Config from '../config';

/**
 * todoschema,
 * verify region
 */

const vainglory = new Vg(Config.VAINGLORY.API_KEY, Config.VAINGLORY.SETUP_CONFIG);

class VaingloryService {
  getStatus() {
    return vainglory.status();
  }

  async getRegion(playerName) {
    // TODO: Check if playername is in redis and get region
    // TODO: Check if playername is in COUCHBASE and get region
    const regions = ['na', 'eu', 'ea', 'sg', 'cn', 'sg'];
    for (let i = 0; i < regions.length; i++) {
      const data = await queryPlayerByName(regions[i], playerName);
      if (data.errors) continue;
      return regions[i];
    }
  }

  queryMatches(region, options) {
    return vainglory.setRegion(region).matches.collection(options);
  }

  queryMatchesPage(playerId, region, endAt = new Date().toISOString(), page = 0) {
    const offSet = 50;
    const options = lodash.defaultsDeep({
      filter: {
        'createdAt-end': endAt,
        playerIds: [playerId],
      },
      page: {
        offset: offSet * page,
      },
    }, Config.VAINGLORY.DEFAULT_OPTIONS);

    return this.queryMatches(region, options);
  }

  queryMatchesTimed(playerId, region, start, end) {
    const searchFilter = {
      filter: {
        playerIds: [playerId],
      },
    };
    if (start) searchFilter.filter['createdAt-start'] = start;
    if (end) searchFilter.filter['createdAt-end'] = end;
    return this.queryMatches(region, lodash.defaults(Config.VAINGLORY.DEFAULT_OPTION, searchFilter));
  }

  queryMatch(matchId) {
    return vainglory.matches.single(matchId);
  }

  queryPlayerById(playerId) {
    return vainglory.players.getById(playerId);
  }

  queryPlayerByName(region, players) {
    let playerNames;
    // It requires it to be in an array
    if (typeof players !== 'object') playerNames = [players];
    return vainglory.setRegion(region).players.getByName(playerNames);
  }
}

export default new VaingloryService();
