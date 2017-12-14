import * as lodash from "lodash";

import { getKDA, getRate, getAvg, getMinutes } from "~/lib/utils_stats";

import VprTransforms                           from "~/transforms/vpr";

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

    let blueVstSum = 0, redVstTeam = 0;
    for (const rost of match.rosters) {
      for (const particp of rost.participants) {
        if (rost.stats.side === "right/red") redVstTeam += particp._stats.skillTier;
        else blueVstSum += particp._stats.skillTier;
      }

    }

    return {
      id:      match.data.id,
      shardId: match.shardId,
      gameMode,
      endGameReason: match.data.attributes.stats.endGameReason,
      createdAt:     match.createdAt,
      duration:      match.duration,
      patchVersion:  match.patchVersion,
      // We will generate Rosters + Players
              ...this.generateRosters(match.rosters, blueVstSum, redVstTeam),
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

  generateRosters(r, blueVstSum, redVstSum) {
    const rosters = [];
    const players = [];

    const names = {
      "left/blue": "Blue",
      "right/red": "Red",
    };
    // Let's separate the rosters
    lodash.forEach(r, (roster) => {

      rosters.push(roster.stats);

      // Now, lets create the players for this roster
      players.push(...this.generatePlayers(roster.participants, roster, blueVstSum, redVstSum));

    });

    return {
    players,
    rosters
    };
  }
  
  generatePlayers(players, roster, blueVstSum, redVstSum) {

    let p = [];

    const allVprChanges = VprTransforms.update(players, roster, blueVstSum, redVstSum);
    let vprChange = 0;

    lodash.forEach(players, (player) => {
      for (const vpr of allVprChanges) {
        if (vpr.data.id !== player.id) continue;
        vprChange = vpr.vpr.amount;
      }
      p.push({
        id:       player.player.id,
        name:     player.player.name,
        shardId:  player.player.shardId,
        tier:     player._stats.skillTier,
        actor:    player.actor,
        side:     roster.stats.side,
        aces:     roster.stats.acesEarned,
        role:     findRole(player.stats),
        vprChange,
          ...player.stats,
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
    }
  }

  generatePlayers(playerId, {match, rosters, players}) {

    let matchMinutes = (match.duration / 60);

    let res = players.map(player => {

      let roster = rosters.find(r => r.side === player.side);
      // console.log(player.vprChange)
      return {
        id: player.id,
        me: (playerId && player.id === playerId),
        side: player.side,
        name: player.name,
        region: player.shardId,
        tier: player.tier,
        skillTier: player.skillTier,
        winner: player.winner,
        
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
          vprChange: player.vprChange,
        
      }

    });

    return res;

  }
}

export default {
  input: new MatchInput(),
  output: new MatchOutput(),
};
