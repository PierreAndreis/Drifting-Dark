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

const findRole = (player) => {
  let role = "Captain";

  const laneCS   = player.nonJungleMinionKills;
  const jungleCS = player.jungleKills;
  const farm     = player.minionKills;

  if (laneCS > jungleCS && farm > 45) role = "Carry";
  if (laneCS < jungleCS && farm > 45) role = "Jungler";

  return role;
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
    
    const stats = this.generateStats(matches, playerId);

    return {
      ...res,
      name:      player.name,
      region:    player.shardId,
      tier:      "" + player.tier,
      // we add 1 minute to the lastMatch so if we search using createdAt-start, 
      // the last match won't show... we already calculated that.
      lastMatch: addMinutes(new Date(lastMatch.createdAt), 1),
      aka:       stats.aka,
      patches:   stats.patches,
      info:      stats.info,
    }
    
  }

  // Distribute the matches
  generateStats(matches, playerId) {
    let patches = {};
    let aka     = [];
    let info    = {};

    lodash.forEach(matches, (match) => {
      const pv = match.patchVersion;

      const player  = match.players.find(p => p.id === playerId);
      const roster  = match.rosters.find(r => r.side === player.side);

      const _gameModes = this.generateGameModes(match, player, roster);
      const _roles     = this.generateRoles    (match, player, roster);
      const _heroes    = this.generateHeroes   (match, player, roster);
      const _total     = this.generateTotal    (match, player, roster);
      const _friends   = this.generateFriends  (match, player, roster)
      
      patches[pv] = merge(patches[pv], _total    );
      patches[pv] = merge(patches[pv], _gameModes);
      patches[pv] = merge(patches[pv], _roles    );
      patches[pv] = merge(patches[pv], _heroes   );
      patches[pv] = merge(patches[pv], _friends  );

      aka = merge(aka, [player.name]);
      
      info = merge(info, this.generateInfo(match, player, roster))

    });

    return {patches, aka, info};
  }

  generateTotal(match, player, roster) {

    const winner = (player.winner             ) ? 1 : 0;
    const afk    = (player.firstAfkTime !== -1) ? 1 : 0;

    const redSide = (player.side !== "left/blue") ? 1 : 0;

    return {
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

    const role = findRole(player);

    return {
      [match.gameMode]: {
        Roles: { 
          [role]: this.generateTotal(match, player, roster)
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
        name: [p.name],
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
          [player.actor]: this.generateTotal(match, player, roster)
        },
      },
    };

    return stats;
  }

  // Run once per match
  generateGameModes(match, player, roster) {

    // Small fix for 1.2.0-beta version of Vainglory Package
    // Where there is a misstype on Battle Royale
    // Also being used on models/matches.js
    const gameMode = (       match.gameMode == "Battle Royal"
                      ||     match.gameMode == "Private Battle Royal"
                      ) ? `${match.gameMode}e` : match.gameMode;

    return {
      [gameMode]: this.generateTotal(match, player, roster)
    };
  }
}

export default new PlayerStats();