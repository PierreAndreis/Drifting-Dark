import * as lodash from "lodash";
import {performance} from "perf_hooks";
import Analysis from "../lib/analysis";
import vg          from "vainglory";

import Config from "~/config";

const RESULT_PER_PAGE = 50;
const TIMEOUT_REQUEST_MS = 8000;
/**
 * todoschema,
 * verify region
 */

let timeout = (ms, rejectFn) => new Promise((resolve, reject) => {
  let id = setTimeout(() => {
    clearTimeout(id);
    const message = rejectFn();
    resolve(message);
  }, ms)
});

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
    return Promise.race([
      new Promise((resolve, reject) => {
        const t0 = performance.now();
        return vainglory.setRegion(region).matches.collection(options).then(res => {
          const t1 = performance.now();
          Analysis.timing(`api.matches.request.${region}.timing`, t1 - t0);
          Analysis.increment(`api.matches.request.${region}.success`);
          resolve(res);
        });
      }),
      timeout(TIMEOUT_REQUEST_MS, () => {
        Analysis.increment(`api.matches.requests.${region}.timeout`);
        return {errors: true}
      })
    ]);
  }

  match (matchId, region) {
    return vainglory.region(region).matches.single(matchId);
  }

  getPlayer({playerId, playerName, region}) {

    const vg = vainglory;

    if (region) vg.setRegion(region);

    if (playerName) {
      if (typeof playerName !== "object") playerName = [playerName];
      const t0 = performance.now();

      return new Promise((resolve, reject) => {
        const t0 = performance.now();
        return vg.players.getByName(playerName).then(res => {
          const t1 = performance.now();
          Analysis.timing(`api.players.name.request.${region}.timing`, t1 - t0);
          resolve(res);
        })
      });
    };

    return new Promise((resolve, reject) => {
      const t0 = performance.now();
      return vg.players.getById(playerId).then(res => {
        const t1 = performance.now();
        Analysis.timing(`api.players.id.request.${region}.timing`, t1 - t0);
        resolve(res);
      })
    });
  }

  getMatches(playerId, region, { startMatch, lastMatch, gameMode, page, patches, limit }) {
    let options = {
      playerIds: [playerId]
    }

    let resultPerPage = limit || RESULT_PER_PAGE;

    if (!patches) {
      if (lastMatch)  options["createdAt-end"] = lastMatch;
      if (startMatch) options["createdAt-start"] = startMatch;
    }
    else {
      options["patchVersion"] = patches;
    }
    
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