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

  match (matchId) {
    return vainglory.matches.single(matchId);
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

  getMatches(playerId, region, { startMatch, lastMatch,  patch, gameMode, page }) {
    let options = {
      playerIds: [playerId]
    }

    if (lastMatch)  options["createdAt-end"] = lastMatch;
    if (startMatch) options["createdAt-start"] = startMatch;
    if (gameMode) options.gameMode = gameMode;

    // const patchData = [];
    /*if (patch) {
      patch = patch.sort((a, b) => {
        if (a > b) return 1;
        if (b < a) return -1;
        return 0;
      });
        const patches = Object.keys(Config.VAINGLORY.PATCH_DATES);
        patch.forEach((r) => {
          options["createdAt-start"] = new Date(Date.parse(Config.VAINGLORY.PATCH_DATES[r])).toISOString();
          const index = patches.indexOf(r) + 1;
          console.log(r)
          options["createdAt-end"] = new Date(Date.parse(Config.VAINGLORY.PATCH_DATES[patches[index]])).toISOString();
          options = generateOpt(options)
          if (page) options.page = { offset: RESULT_PER_PAGE * page };
          patchData.push(this.queryMatches(region, options))
        })
        return await Promise.all(patchData)
    }// todo. it should overwrite the createdAt-end and createdAt-start
    */
    options = generateOpt(options);
    if (page) options.page = {offset: RESULT_PER_PAGE * page};
    
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