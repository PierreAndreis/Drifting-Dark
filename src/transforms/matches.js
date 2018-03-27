import * as lodash from "lodash";

import { getKDA, getRate, getAvg, getMinutes } from "~/lib/utils_stats";
import TIER3_NAMES from "~/resources/tiers_name";
import T3_ITEMS from "~/resources/items_t3";
import GAMEMODE from "~/resources/gamemodes";

import VPRService from "~/services/vpr";

import MVP from "~/lib/mvp";

const VPR_ENABLED = false;

const findRole = (player) => {
  let role = "Captain";

  const laneCS   = player.nonJungleMinionKills;
  const jungleCS = player.jungleKills;
  const farm     = player.minionKills;
  
  if (jungleCS > 20) role = "Jungler";
  else if (farm > 25) role = "Carry";

  return role;
}

const addSeconds = (date, seconds) => {
  date.setSeconds(date.getSeconds() + seconds);
  return date;
}

class MatchInput {
  json(match) {

    let gameMode = match.gameMode;

    let unfilteredGameMode = GAMEMODE.find(g => g.serverName === match.gameMode);
    if (unfilteredGameMode) gameMode = unfilteredGameMode.name;

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

    // Insert score property to each participant
    players = MVP(players, rosters, gameMode);

    return {
      players,
      rosters
    };
  }
  
  generatePlayers(players, roster, blueVstSum, redVstSum) {

    let p = [];

    // To prevent those that have highest non jungle farm to be a jungler. LOL
    let highestFarm = players.reduce((current, next) => Math.max(current, next._stats.farm), 0);

    // Most jungler camp kills is the jungler
    let jungler = players.reduce((current, next) => {
      if (next._stats.jungleKills > current._stats.jungleKills && highestFarm !== next._stats.farm) return next;
      else return current;
    }, {_stats: {jungleKills: -1}}); // Small hack on default reduce so its value is never met


    // Least farm is the captain, as long as it is not the jungler
    let captain = players.reduce((current, next) => {
      if (next._stats.farm < current._stats.farm && jungler.player.id !== next.player.id) {
        return next;
      } else return current;
    }, {_stats: {farm: 999999}}); // Small hack on default reduce so its value is never met


    let junglerId = (jungler.player) ? jungler.player.id : "";
    let captainId = (captain.player) ? captain.player.id : "";

    lodash.forEach(players, (player) => {

      // const rankvst = lodash.get(player, "player.stats.rankPoints.ranked", 0);
      let tier = player._stats.skillTier;
      let role = "Carry";
      if (junglerId === player.player.id) role = "Jungler";
      else if (captainId === player.player.id) role = "Captain";
      // const role = jungler.player.name === player.player.name ? "Jungler" : detectRoleBasedOnItems(player.stats.items);

      if (typeof tier !== "number") {
        const tierN = TIER3_NAMES.find(t => t.name === player._stats.skillTier);
        tier = tierN && tierN.serverName ? tierN.serverName : tier;
      }

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
};

class MatchOutput {
  json(playerId, match) {

    const {
      id,
      shardId,
      createdAt,
      gameMode,
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

    let mvpScore = players.reduce((n, p) => Math.max(n, p.score), 0);
    // In private mode, everyone will have a mvp score of 1; 
    // So to not have an MVP, we will set higher as 1
    if (match.gameMode.toLowerCase().includes("private")) mvpScore = 1;

    let res = players.map(player => {

      let roster = rosters.find(r => r.side === player.side);

      

      return {    
        id            : player.id,
        me            : (playerId && player.id === playerId),
        mvp           : (player.score === mvpScore),
        score         : player.score,
        side          : player.side,
        name          : player.name,
        region        : player.shardId,
        tier          : player.tier,
        skillTier     : player.skillTier,
        winner        : player.winner,
        rankvst       : player.rankvst,
        blitzvst      : player.blitzvst,
        hero          : player.actor,
        role          : player.role,
        aces          : player.aces,
        turretCaptures: player.turretCaptures,
        kp            : getRate((player.kills + player.assists), roster.heroKills),
        kills         : player.kills,
        deaths        : player.deaths,
        assists       : player.assists,
        kda           : getKDA(player.kills, player.deaths, player.assists),
        cs            : parseInt(player.farm, 10),
        nonJungle     : parseInt(player.nonJungleMinionKills, 10),
        minionKills   : parseInt(player.minionKills, 10),
        jungleCs      : parseInt(player.jungleKills, 10),
        csMin         : getAvg(player.farm, matchMinutes),
        afk           : (player.firstAfkTime !== -1 || player.wentAfk),
        gold          : parseInt(player.gold, 10),
        goldMin       : getAvg(player.gold, matchMinutes),
        goldShare     : getRate(player.gold, roster.gold),
        items         : player.items,
        vprChange     : player.vprDiff || 0,
        
      }

    });

    return res;

  }
};

export default {
  input: new MatchInput(),
  output: new MatchOutput(),
};
