import * as lodash from "lodash";
import vg          from "vainglory";

import Config from "~/config";

/**
 * todoschema,
 * verify region
 */

const vainglory = new vg(Config.VAINGLORY.API_KEY, Config.VAINGLORY.SETUP_CONFIG);

class VaingloryService {
  
  getStatus() {
    return vainglory.status();
  }
  
  queryMatches(region, options) {
    return vainglory.setRegion(region).matches.collection(options);
  }
  
  queryMatchesOlder(playerId, region, lastMatch) {
    return this.queryMatches(region, lodash.defaultsDeep(Config.VAINGLORY.DEFAULT_OPTIONS, {
      filter: {
        "createdAt-end": lastMatch,
        playerIds: [playerId],
      },
    }));
  }

  queryMatchesPage(playerId, region, endAt = new Date().toISOString(), page = 0) {
    const offSet  = 50;


    const options = lodash.defaultsDeep({
      filter: {
        "createdAt-end": endAt,
        playerIds: [playerId],
      },
      page: {
        offset: offSet * page
      }
    }, Config.VAINGLORY.DEFAULT_OPTIONS);

    return this.queryMatches(region, options);

  }
  
  queryMatchesNewer(playerId, region, lastMatch) {
    return this.queryMatches(region, lodash.defaults(Config.VAINGLORY.DEFAULT_OPTION, {
      filter: {
        "createdAt-start": lastMatch, 
        playerIds: [playerId],
      },
    }));
  }
  
  queryMatch(matchId) {
    return vainglory.matches.single(matchId);
  }
  
  queryPlayerById(playerId) {
    return vainglory.players.getById(playerId);
  }
  
  queryPlayerByName(playerNames, region) {
    // It requires it to be in an array
    if (typeof playerNames !== "object") playerNames = [playerNames];

    return vainglory.setRegion(region).players.getByName(playerNames);
  }

}

export default new VaingloryService();