import * as lodash from "lodash";

import { getKDA, getRate, getAvg, getMinutes } from "~/lib/utils_stats";
import TIER3_NAMES from "~/resources/tiers_name";

import VPRService from "~/services/vpr";

const VPR_ENABLED = false;

const findRole = (player) => {
  let role = "Captain";

  const laneCS   = player.nonJungleMinionKills;
  const jungleCS = player.jungleKills;
  const farm     = player.minionKills;

  if (laneCS > jungleCS && farm > 45) role = "Carry";
  if (laneCS < jungleCS && farm > 45) role = "Jungler";

  return role;
}

const addSeconds = (date, seconds) => {
  date.setSeconds(date.getSeconds() + seconds);
  return date;
}

class MatchInput {
  json(match) {
    const gameMode = (match.gameMode === "Battle Royal" || match.gameMode === "Private Battle Royal") ? `${match.gameMode}e` : match.gameMode;

    return {
      id:      match.data.id,
      shardId: match.shardId,
      gameMode,
      endGameReason: match.data.attributes.stats.endGameReason,
      createdAt:     match.createdAt,
      duration:      match.duration,
      patchVersion:  match.patchVersion,
      // We will generate Rosters + Players
              ...this.generateRosters(gameMode, match.rosters),
      telemetry: this.generateTelemetry(match.assets[0]),
    };
  }

  generateTelemetry(telemetry) {

    if (!telemetry || !telemetry.URL) return {}

    return {
      name:       "telemetry",
      URL:        telemetry.URL,
    };
  }

  generateRosters(gameMode, r) {
    let rosters = [];
    let players = [];

    const names = {
      "left/blue": "Blue",
      "right/red": "Red",
    };

    // Let's separate the rosters
    lodash.forEach(r, (roster) => {

      rosters.push(roster.stats);

      // Now, lets create the players for this roster
      players.push(...this.generatePlayers(roster.participants, roster));

    });
    
    if (gameMode === "Ranked" && VPR_ENABLED) {
      players = VPRService.implementVPRChanges(players, rosters);
    }

    return {
    players,
    rosters
    };
  }
  
  generatePlayers(players, roster, blueVstSum, redVstSum) {

    let p = [];
    
    players = players.sort((a, b) => {
      /**/ if (a.stats.nonJungleMinionKills > b.stats.nonJungleMinionKills) return 1;
      else if (a.stats.nonJungleMinionKills < b.stats.nonJungleMinionKills) return -1;
      else return 0;
    });

    const rolesToPick = ["Carry", "Jungler", "Captain"];

    lodash.forEach(players, (player) => {

      const role = rolesToPick.pop();

      const rankvst = lodash.get(player, "player.stats.rankPoints.ranked", 0);
      const tierN = TIER3_NAMES.find(t => t.name === player._stats.skillTier);
      const tier = tierN && tierN.serverName ? tierN.serverName : -1;

      p.push({
        id:       player.player.id,
        name:     player.player.name,
        shardId:  player.player.shardId,
        rankvst:  lodash.get(player, "player.stats.rankPoints.ranked", 0),
        blitzvst: lodash.get(player, "player.stats.rankPoints.blitz", 0),
        actor:    player.actor,
        side:     roster.stats.side,
        aces:     roster.stats.acesEarned,
        role:     role,
          ...player.stats,
        tier:     tier,
      });

    });
    return p;
  }
}

class MatchOutput {
  json(playerId, match) {

    const {
      id,
      shardId,
      gameMode,
      createdAt,
      duration,
      patchVersion,
      players,
      rosters,
    } = match;

    return {
      id,
      shardId,
      gameMode,
      createdAt,
      ended: addSeconds(new Date(createdAt), duration),
      duration,
      minutes: getMinutes(duration),
      patchVersion,
      players: this.generatePlayers(playerId, {match, rosters, players}),
      rosters: rosters,
    }
  }

  generatePlayers(playerId, {match, rosters, players}) {

    let matchMinutes = (match.duration / 60);

    let res = players.map(player => {

      let roster = rosters.find(r => r.side === player.side);

      return {    
        id:        player.id,
        me:        (playerId && player.id === playerId),
        side:      player.side,
        name:      player.name,
        region:    player.shardId,
        tier:      player.tier,
        
        skillTier: player.skillTier,
        winner:    player.winner,

        rankvst:  player.rankvst,
        blitzvst: player.blitzvst,
        
        hero: player.actor,
        role: player.role,
        aces: player.aces, 
        turretCaptures: player.turretCaptures,

        kp: getRate((player.kills + player.assists), roster.heroKills),

        kills: player.kills,
        deaths: player.deaths,
        assists: player.assists,
        kda: getKDA(player.kills, player.deaths, player.assists),

        cs: parseInt(player.farm, 10),
        csMin: getAvg(player.farm, matchMinutes),

        afk: (player.firstAfkTime !== -1 || player.wentAfk),

        gold: parseInt(player.gold, 10),
        goldMin: getAvg(player.gold, matchMinutes),
        goldShare: getRate(player.gold, roster.gold),

        items: player.items,
        vprChange: player.vprDiff || 0,
        
      }

    });

    return res;

  }
}

export default {
  input: new MatchInput(),
  output: new MatchOutput(),
};
