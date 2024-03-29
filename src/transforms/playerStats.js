import * as lodash    from "lodash";

import { merge,                   } from "~/lib/utils";
import { getKDA, getRate, getAvg }  from "~/lib/utils_stats";

import { findSeasonByPatch } from "~/resources/dictionaries";

import MatchTransform from "./matches";

const nowTime = () => new Date();

const addMinutes = (date, minutes) => {
  date.setMinutes(date.getMinutes() + minutes);
  return date;
}

class PlayerStatsInput {

  json(matches, playerId) {

    let res = {
      id: playerId,
      lastCache: nowTime(),
      nextCache: addMinutes(nowTime(), 5),
    }

    if (lodash.isEmpty(matches) || matches.errors) return res;
    
    // const matches = (m.match) ? m.match.map(m => MatchTransform.input.json(m)) : m;
    const lastMatch = matches[0];

    const player = lastMatch.players.find(p => p.id === playerId);
    
    const stats = this.generateStats(matches, playerId);

    return {
      ...res,
      name:      player.name,
      region:    player.shardId,
      tier:       "" + player.tier,
      rankVst:    "" + player.rankvst,
      blitzVst:   "" + player.blitzvst,
      rank5v5Vst: "" + player.rank5v5vst,
      // we add 1 minute to the lastMatch so if we search using createdAt-start, 
      // the last match won't show... the last match is already calculated.
      lastMatch: addMinutes(new Date(lastMatch.createdAt), 1),
      aka:       stats.aka,
      vpr:       stats.vpr,
      patches:   stats.patches,
      info:      stats.info,
    }
    
  }

  // Distribute the matches
  generateStats(matches, playerId) {
    let patches = {};
    let aka     = [];
    let info    = {};
    let vpr     = {};

    lodash.forEach(matches, (match) => {
      const pv = match.patchVersion;

      const player  = match.players.find(p => p.id === playerId);
      const roster  = match.rosters.find(r => r.side === player.side);

      const _gameModes = this.generateGameModes(match, player, roster);
      const _roles     = this.generateRoles    (match, player, roster);
      const _heroes    = this.generateHeroes   (match, player, roster);
      const _total     = this.generateTotal    ("total", match, player, roster);
      const _friends   = this.generateFriends  (match, player, roster)
      
      patches[pv] = patches[pv] || {};

      patches[pv]               = merge(patches[pv],     _total    );   
      patches[pv]["gameModes"]  = merge(patches[pv]["gameModes"], _gameModes);
      patches[pv]["gameModes"]  = merge(patches[pv]["gameModes"], _roles    );
      patches[pv]["gameModes"]  = merge(patches[pv]["gameModes"], _heroes   );
      patches[pv]["gameModes"]  = merge(patches[pv]["gameModes"], _friends  );
      aka  = merge(aka, [player.name]);
      info = merge(info, this.generateInfo(match, player, roster))
      vpr[pv]  = merge(vpr[pv], this.generateVPR(match, player))

    });

    return {patches, aka, info};
  }

  generateVPR(match, player) {
    return {
      change: player.vprDiff || 0
    }
  }

  generateTotal(type, match, player, roster) {

    const winner = (player.winner             ) ? 1 : 0;
    const afk    = (player.firstAfkTime !== -1) ? 1 : 0;

    const redSide = (player.side !== "left/blue") ? 1 : 0;

    const wasThereAnAfk = match.players.find(p => p.side === player.side && p.wentAfk);

    if (!afk && (wasThereAnAfk && !winner)) {
      // If there was an afk, and this player wasn't the afk and lost the game,
      // we will not count stats.
      return {
        gamesWithAfk: 1
      };
    }

    return {
      type:           type,
      wins:           winner,
      afk:            afk,
      games:          1,
      redWins:        (redSide)  ? winner : 0,
      redGames:       (redSide)  ? 1      : 0,
      blueWins:       (!redSide) ? winner : 0,
      blueGames:      (!redSide) ? 1      : 0,
      teamKills:      roster.heroKills,
      kills:          player.kills,
      deaths:         player.deaths,
      assists:        player.assists,
      farm:           player.farm,
      gold:           player.gold,
      minionKills:    player.minionKills,
      campCSKills:    player.jungleKills,
      laneCSKills:    player.nonJungleMinionKills,
      aces:           player.aces,
      crystalSentry:  player.crystalMineCaptures,
      turretCaptures: player.turretCaptures,
      duration:       match.duration,
    }
  }

  generateInfo(match, player, roster) {
    return {
      skins:      [player.skinKey],
      itemGrants: player.itemGrants,
      itemUses:   player.itemUses 
    }
  }

  generateRoles(match, player, roster) {

    const role = player.role;

    // Role shouldn't be a thing on anything not Ranked or Casual 
    if (match.gameMode !== "Ranked" && 
        match.gameMode !== "Casual" && 
        match.gameMode !== "Casual 5v5" && 
        match.gameMode !== "Ranked 5v5") return false;

    return {
      [match.gameMode]: {
        Roles: { 
          [role]: this.generateTotal("role", match, player, roster)
        }
      }
    }

  }

  generateFriends(match, player, roster) {

    const playedWith = {};
    const side = roster.side;
    const friends = match.players.filter(p => p.side === side);

    friends.forEach((p) => {
      if (p.name === player.name) return;
      playedWith[p.id] = {
        name: p.name,
        lastMatch: match.createdAt,
        wins: (p.winner) ? 1 : 0,
        games: 1,
      }
    });

    return {[match.gameMode]: {playedWith}};
  }

  // Run once per match
  generateHeroes(match, player, roster) {

    let stats = {
      [match.gameMode]: {
        "Heroes": {
          [player.actor]: this.generateTotal("hero", match, player, roster)
        },
      },
    };

    return stats;
  }

  // Run once per match
  generateGameModes(match, player, roster) {

    return {
      [match.gameMode]: this.generateTotal("gameMode", match, player, roster)
    };
  }
}

class PlayerStatsOutput {

  json(playerStats, opts = []) {

    const seasonsAvailable = new Set();
    const gameModesAvailable = new Set();
    let stats;

    const {season} = opts;


    const {
      id, 
      name, 
      lastCache, 
      region, 
      tier, 
      aka, 
      patches, 
      info, 
      rankVst, 
      rank5v5Vst,
      blitzVst,
      rankedRanking,
      ranked5v5Ranking,
      blitzRanking
    } = playerStats;

    // first we will merge all in one structure that we will always know
    lodash.forEach(patches, (data, patch) => {

      const thisSeason = findSeasonByPatch(patch);
      seasonsAvailable.add(thisSeason);

      Object.keys(data.gameModes).forEach((name) => {
        // We need to filter those game modes out that there is no match played,
        // this is possible because of afk matches not being counted
        if (!data.gameModes[name].games) return;
        gameModesAvailable.add(name);
      });

      if (!lodash.isEmpty(season) && !season.includes(thisSeason)) return;

      stats = merge(stats,  this.extractData(data, opts));

    });

    return {
      id,
      name,
      region,
      lastCache,
      tier, 
      aka,
      rankVst,
      blitzVst,
      rank5v5Vst,
      rankedRanking,
      ranked5v5Ranking,
      blitzRanking,
      seasonsAvailable,
      gameModesAvailable,
      filters: opts,
      stats: this.outputStats(stats, opts),
    }
  }

  extractData(data, {gameMode}) {
    // if there is no gameMode, we will just merge all the heroes and roles then delete GameMode
    if (!gameMode) {
      let res = data;

      lodash.forEach(res.gameModes, (gameModeStats, name) => {
        res.Heroes     = merge(res.Heroes, gameModeStats.Heroes);
        res.Roles      = merge(res.Roles, gameModeStats.Roles);
        res.playedWith = merge(res.playedWith, gameModeStats.playedWith);
      });

      delete res.gameModes;
      return res;
    }

    // if there is a gameMode, lets grab the stats from that gameMode and Heroes and Roles

    return (data.gameModes && data.gameModes[gameMode]) || {};
  }


  outputStats(stats, {gameMode}) {
    let data = stats;
    if (lodash.isEmpty(stats)) return { errors: "Not found" }; //todo better response error handling

    const heroes = [];
    lodash.forEach(data.Heroes, (heroStats, heroName) => {
      const r = this.translateStats(heroStats, heroName);
      if (r) heroes.push(r);
    });

    const roles = [];
    lodash.forEach(data.Roles, (roleStats, roleName) => {
      const r = this.translateStats(roleStats, roleName);
      if (r) roles.push(r);
    });

    const playedWith = [];
    lodash.forEach(data.playedWith, (playerWithData, playerId) => {
      if (playerWithData.games > 3) {
        playedWith.push(playerWithData);
      }
    });

    return {
      ...this.translateStats(data, gameMode),
      Heroes: heroes,
      Roles:  roles,
      PlayedWith: playedWith,
    }
  }


  translateStats(stats, name) {
    const {
      type,
      kills,
      deaths,
      assists,
      wins,
      games,
      farm,
      teamKills,
      duration,
      gold,
      blueGames,
      blueWins,
      redGames,
      redWins,
      vprChange,
    } = stats;

    const thisKP = kills + assists;

    if (!games) {
      // If there is an AFK and he hasn't played any other match but with an AFK
      return false;
    }

    return {
      name,
      type,
      kda:             getKDA(kills, deaths, assists),
      games,
      wins,
      duration,
      vprChange,
      loss:            games - wins,
      winRate:         getRate(wins, games),
      kp:              getRate(thisKP, teamKills),
      avgKills:        getAvg(kills, games),
      totalKills:      kills,
      avgDeaths:       getAvg(deaths, games),
      totalDeaths:     deaths,
      avgAssists:      getAvg(assists, games),
      totalAssists:    assists,
      avgCS:           getAvg(farm, games),
      totalCS:         farm,
      blueGames,
      blueWins,
      blueWinRate:     getRate(blueWins, blueGames),
      redGames,
      redWins,
      redWinRate:      getRate(redWins, redGames),
    }
  }
}




export default {
  input: new PlayerStatsInput(),
  output: new PlayerStatsOutput()
}
