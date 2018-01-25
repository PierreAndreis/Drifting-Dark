import * as lodash from "lodash";

import Config from "~/config";
import PlayerController from "./vg_player";

import CacheService     from "~/services/cache";
import VaingloryService from "~/services/vainglory";

import MatchTransform from "~/transforms/matches.js";
import TelemetryTransform from "~/transforms/telemetry.js";

const BATCHAPI_PAGES_PER_TRY = 3;

import { dirtyGameMode, getPatchesList } from "~/resources/dictionaries";

const createCacheKey = (playerId, region, {lastMatch, patches, gameMode, page, limit}) => {

  let key = `matches:${playerId}:${region}`;
  if (lastMatch) key += `:${lastMatch}`;
  if (patches)   key += `:${patches}`;
  if (gameMode)  key += `:${gameMode}`;
  if (limit)     key += `:${limit}`;
  if (page)      key += `:${page}`;

  return key;
}

const getPlayerId = async (playerName) => {
  const player = await PlayerController.lookupName(playerName);
    // todo: 404 not found
    if (lodash.isEmpty(player)) return {};
    return player;
}

class MatchesController {

  async getMatchesByName(playerName, context) {
    const playerObj = await getPlayerId(playerName);

    // Transform clean GameMode into server name
    // Blitz => blitz_pvp_ranked
    if (typeof context.gameMode == "object") {
      context.gameMode = context.gameMode
        .map(gameMode => dirtyGameMode(gameMode) || "")
        .join(",");
    }
    else if (context.gameMode) {
      context.gameMode = dirtyGameMode(context.gameMode) || "";
    }

    if (context.season) {
      const patches = getPatchesList(context.season);
      context.patches = patches || "";
    }
    
    return this.getMatches(playerObj.id, playerObj.region, playerObj.lastMatch, context);
    
  }

  // To get a specific match
  async getMatchByMatchId(matchId, region, output) {
    const match = await VaingloryService.match(id, region);
    if (match.errors) return {errors: match.messages}; // todo error handler
    let m = MatchTransform.input.json(match);
    if (output) m = MatchTransform.output.json(id, m);
    return m;
  }

  async getMatchTelemetry(matchId, region) {
    const match = await this.getMatchByMatchId(matchId, region);
    const key = `telemetry:${telemetryUrl}`;

    const get = async () => {
      const telemetry = await TelemetryTransform(telemetryUrl, matchId);
      return telemetry;
    };

    return CacheService.preferCache(key, get, { 
      expireSeconds: Config.CACHE.REDIS_MATCHES_CACHE_EXPIRE,
    });
  }

  async getMatchDetails(matchId, region) {
    return await this.getMatchByMatchId(matchId, region, true);
  }

  // Normally used to get a specific match page with filters
  // context can be: 
  // lastMatch: Date, '
  // patches: Object, 
  // gameMode: String, 
  // page: Number, 
  // limit: Number (up to 50)
  getMatches(playerId, region, lastMatch, context) {
    const key = createCacheKey(playerId, region, {lastMatch, ...context});

    const get = async () => {
      
      const matches = await VaingloryService.getMatches(playerId, region, {lastMatch, ...context});
      if (!matches || matches.errors) return []; // todo: error handler
      
      let m = matches.match.map(match => MatchTransform.input.json(match));
      m = m.map(match => MatchTransform.output.json(playerId, match));
      return m;
    };

    return CacheService.preferCache(key, get, { 
      expireSeconds: Config.CACHE.REDIS_MATCHES_CACHE_EXPIRE,
      expireSecondsEmpty: Config.CACHE.REDIS_EMPTY
    });
  }

  // Loop over all possible pages in the last 28 days to get those matches
  // In the future, we should expand to 120 days (which is the limit of API)
  async getAllPages(playerId, region) {
    const res = [];

    let currentPage = 0;

    const get = async (batch = 0, endDate) => {
      const queries = [];

      let pageToEnd = currentPage + BATCHAPI_PAGES_PER_TRY;
      for (let i = 0; i <= BATCHAPI_PAGES_PER_TRY; i++) {
        let page = currentPage++;
        queries.push(VaingloryService.getMatches(playerId, region, {lastMatch: endDate, page}));
      }
      return Promise.all(queries);
    }


    let done  = false;
    let pages = 0;

    // todo: handle 429 API REQUEST LIMIT
    // handle api being down :< (timeout?)

    while (!done) {
      const pagesRes = await get(pages);
      pagesRes.forEach((pg) => {
        if (pg.errors) done = true;
        else res.push(...pg.match.map(match => MatchTransform.input.json(match)));
      });
      pages++;
    };

    const matchesId = new Set([]);

    const removeDuplicatedMatches = res.filter(match => {
      const test = matchesId.has(match.id);
      matchesId.add(match.id);
      return !test;
    });

    return removeDuplicatedMatches;
  }
}

export default new MatchesController();
