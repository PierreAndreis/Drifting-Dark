import * as lodash    from "lodash";
import moment         from "moment";
import { merge}      from "~/lib/utils";

import MatchesTransform from "./matches";

const API_CACHE_TIME = moment().add(5, "m").format("X");

const nowTime = () => new Date();

const addMinutes = (date, minutes) => {
  date.setMinutes(date.getMinutes() + minutes);
  return date;
}


class PlayerStats {

  create(m, playerId) {

    let res = {
      id: playerId,
      lastCache: nowTime(),
      nextCache: addMinutes(nowTime(), 5),
    }

    if (lodash.isEmpty(m) || m.errors) return res;
    
    const matches = (m.match) ? m.match.map(m => MatchesTransform(m)) : m;
    const lastMatch = matches[0];

    const player = lastMatch.players.find(p => p.id === playerId);
    
    return {
      ...res,
      name:      player.name,
      region:    player.shardId,
      tier:      "" + player.tier,
      lastMatch: lastMatch.createdAt,
      aka:       this.generateAKA(matches, playerId),
      stats:     this.generateStats(matches, playerId),
    }
    
  }

  generateAKA(matches, playerId) {
    let aka = new Set();
    
    lodash.forEach(matches, (match) => {
      const player = match.players.find(p => p.id === playerId);
      aka.add(player.name);

    });

    return [...aka];

  }

  // Distribute the matches
  generateStats(matches, playerId) {
    let allStats = {};
    
    lodash.forEach(matches, (match) => {
      const pv = match.patchVersion;

      const thismatch = {}

      const _gameModes = this.generateGameModes(match, playerId);
      const _heroes    = this.generateHeroes   (match, playerId);
      const _total     = this.generateTotal    (match, playerId);
      
      allStats[pv] = merge(allStats[pv], _total    )
      allStats[pv] = merge(allStats[pv], _gameModes);
      allStats[pv] = merge(allStats[pv], _heroes   );

    });

    return allStats;
  }

  generateTotal(match, playerId) {
    const p      = match.players.filter(p => p.id === playerId);
    const winner = (p.winner             ) ? 1 : 0;
    const afk    = (p.firstAfkTime !== -1) ? 1 : 0;

    return {
      wins:           winner,
      afk:            afk,
      games:          1,
      kills:          p.kills,
      deaths:         p.deaths,
      assists:        p.assists,
      farm:           p.farm,
      turretCaptures: p.turretCaptures,
      duration:       match.duration,
    }
  }

  // Run once per match
  generateHeroes(match, playerId) {

    const p = match.players.find(p => p.id === playerId);

    const winner = (p.winner             ) ? 1 : 0;
    const afk    = (p.firstAfkTime !== -1) ? 1 : 0;

    let stats = {
      [match.gameMode]: {
        "Heroes": {
          [p.actor]: {
            hero:           p.actor,
            wins:           winner, 
            krakencap:      p.krakenCaptures,
            aces:           p.aces,
            games:          1,
            afk:            afk,
            kills:          p.kills,
            deaths:         p.deaths,
            assists:        p.assists,
            farm:           p.farm,
            turretCaptures: p.turretCaptures,
            duration:       match.duration,
            gold:           p.gold,
          },
        },
      },
    };

    return stats;
  }

  // Run once per match
  generateGameModes(match, playerId) {

    const p      = match.players.find(p => p.id === playerId);
    const winner = (p.winner             ) ? 1 : 0;
    const afk    = (p.firstAfkTime !== -1) ? 1 : 0;

    // Small fix for 1.2.0-beta version of Vainglory Package
    // Where there is a misstype on Battle Royale
    // Also being used on models/matches.js
    const gameMode = (       match.gameMode == "Battle Royal"
                      ||     match.gameMode == "Private Battle Royal"
                      ) ? `${match.gameMode}e` : match.gameMode;

    return {
      [gameMode]: {
        wins:           winner,
        afk:            afk,
        games:          1,
        kills:          p.kills,
        deaths:         p.deaths,
        assists:        p.assists,
        farm:           p.farm,
        turretCaptures: p.turretCaptures,
        duration:       match.duration,
      }
    };
  }
}

export default new PlayerStats();