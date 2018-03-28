import * as lodash from "lodash";

import { getKDA, getRate, getAvg, getMinutes } from "~/lib/utils_stats";
import TIER3_NAMES from "~/resources/tiers_name";
import T3_ITEMS from "~/resources/items_t3";
import GAMEMODE from "~/resources/gamemodes";

import VPRService from "~/services/vpr";

import MVP from "~/lib/mvp";

const VPR_ENABLED = false;

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

    // ===== ROLE ALGORITHM BY VYZEOX =====
    let captain;

    // To find the captain, we will first check for whoever has fountain.
    // The assumption here is that captain WILL buy fountains. 
    let fountainHolders = players.filter(p => p._stats.items.includes("Fountain of Renewal"));
    
    // If there is someone with fountain,
    if (fountainHolders.length > 0) {
      // we will set them as captain
      captain = fountainHolders[0];

      // In case there are more than just 1 with founta
      if (fountainHolders.length > 1) {
        // we will set as captain whoever has the lowest farm from those with fountain
        captain = fountainHolders.reduce((current, next) => {
          if (!current) return next;

          if (current._stats.farm > next._stats.farm) return next;
          else return current;
        }, false);
      }
    }
    else {
      // In case no one has fountain, captain will be those with the least on (GOLD/(CS)^2) ratio
      captain = players.reduce((current, next) => {
        if (!current) return next;

        let currentRatio = Math.pow((current._stats.farm / current._stats.gold), 2);
        let newRatio = Math.pow((next._stats.farm / next._stats.gold), 2);
        // Lowest ratio
        if (currentRatio < newRatio) return current;
        else return next;
      }, false)

    };
    
    // With the captain found, jungler will be the one with the lowest lane minions / jungle camps ratio
    /**
     * XXX: Vyzeox explanation
     * lane minions / jungle camps should work because every laner should get the highest ratios - they should get the lowest amount of jungle * cs and highest amount of lane cs normally, which makes their lane minions / jungle camps ratio really high. Meanwhile, junglers take a * lot of jungle camps and a lot less lane minions. This means that you have a ratio that is a lot lower than the carries. 
     * Numerator is low (low lane minion kills), denominator is high (high jungle camp kills) = low ratio.  Vice-versa = high ratio
     * Lowest ratio = jungler
     */
    let jungler = players.reduce((current, next) => {

      if (!current) return next;
      // Sometimes we skip straight to the captain... if we do that, we will go straight to next then
      if (current.player.id === captain.player.id) return next;

      let currentRatio = (current._stats.nonJungleMinionKills / current._stats.jungleKills);
      let newRatio     = (next._stats.nonJungleMinionKills / next._stats.jungleKills);

      // Lowest ratio and not the jungler
      if (newRatio < currentRatio && next.player.id !== captain.player.id) return next;
      else return current;

    }, false);

    // ===== END OF ROLE ALGORITHM BY VYZEOX =====

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
