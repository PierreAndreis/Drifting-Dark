import * as lodash from "lodash";
import vg          from "vainglory";

import Config from "~/config";

const RESULT_PER_PAGE = 50;
/**
 * todoschema,
 * verify region
 */

const generateOpt = (options) => lodash.defaultsDeep(
    Config.VAINGLORY.DEFAULT_OPTION, 
    {filter: options, page: {limit: RESULT_PER_PAGE}}
  );

const vainglory = new vg(Config.VAINGLORY.API_KEY, Config.VAINGLORY.SETUP_CONFIG);

class VaingloryService {
  
  getStatus() {
    return vainglory.status();
  }
  
  queryMatches(region, options) {
    return vainglory.setRegion(region).matches.collection(options);
  }
  
  queryMatchesOlder(playerId, region, {lastMatch, patch, gameMode, page}) {

    let options = {
      playerIds: [playerId],
      "createdAt-end": lastMatch
    }

    if (gameMode) options.gameMode = gameMode;
    if (patch) options = options //todo. it should overwrite the createdAt-end and createdAt-start
    options = generateOpt(options);
    if (page) options.page = {offset: RESULT_PER_PAGE * page}

    return this.queryMatches(region, options);
  }

  queryMatchesPage(playerId, region, endAt = new Date().toISOString(), page = 0) {
    const offSet  = RESULT_PER_PAGE;


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