import * as lodash from "lodash";
import vg          from "vainglory";

import Config from "~/config";

const RESULT_PER_PAGE = 50;
/**
 * todoschema,
 * verify region
 */

const generateOpt = (options) => {
  return {
    filter: options,
    ...Config.VAINGLORY.DEFAULT_OPTION, 
  };
}

const vainglory = new vg(Config.VAINGLORY.API_KEY, Config.VAINGLORY.SETUP_CONFIG);

class VaingloryService {
  
  status() {
    return vainglory.status();
  }
  
  matches (region, options) {
    return vainglory.setRegion(region).matches.collection(options);
  }

  match (matchId, region) {
    return vainglory.region(region).matches.single(matchId);
  }

  getPlayer({playerId, playerName, region}) {

    const vg = vainglory;

    if (region) vg.setRegion(region);

    if (playerName) {
      if (typeof playerName !== "object") playerName = [playerName];
      return vg.players.getByName(playerName);
    }

    return vg.players.getById(playerId);
  }

  getMatches(playerId, region, { startMatch, lastMatch, gameMode, page, limit }) {
    let options = {
      playerIds: [playerId]
    }

    let resultPerPage = limit || RESULT_PER_PAGE;

    
    if (lastMatch)  options["createdAt-end"] = lastMatch;
    if (startMatch) options["createdAt-start"] = startMatch;
    if (gameMode) options.gameMode = gameMode;

    options = generateOpt(options);
    if (page) options.page = {offset: resultPerPage * page};
    options.page = {...options.page, limit: resultPerPage};
    
    return this.matches(region, options);
  }

  get(method, ...args) {
    switch (method){
      case "matches":
        return this.getMatches(...args);
      case "match":
        return this.getMatch(...args);

      case "playerByName":
        return this.getPlayerByName(...args);
      case "playerById":
        return this.getPlayerById(...args);

      default:
        throw new Error("Sorry, wrong method")

    }
  }

  
  
  
  queryPlayerByName(playerNames, region) {
    // It requires it to be in an array

    return vainglory.setRegion(region).players.getByName(playerNames);
  }

}

export default new VaingloryService();