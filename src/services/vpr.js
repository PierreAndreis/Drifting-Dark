import * as lodash                  from "lodash";
import { merge, findSeasonByPatch } from "~/lib/utils";
import Config                       from "~/config";

import MatchesTransform from "~/transforms/matches";
import PlayerController from "~/controllers/vg_player";
import PlayerStats      from "~/transforms/playerStats";

const ELOSCALE_FACTOR = 5;
const ALLOWED_GAME_MODES = ["Ranked"];

class VPRRating {

  initial(seasonStats, tier) {


    const {
      kills, 
      assists,
      deaths,
      teamKills,
      wins,
      games,
    } = seasonStats;

    const loss = games - wins;

    const stats = {
      kda:              (kills + assists) / deaths,
      kp:               (kills + assists) / teamKills,
      winRatio:         wins / (games),
      averageKdaKpWr:   (2.743333333 + 0.4454112848 + 13) / 3, // TODO: need this value
      averageGames:     1197, // TODO: need this value
      vst:              100, // TODO: need this value
      tier:             tier,
    };

    const kdaKp             = stats.kda * stats.kp;
    const kdaKpWr           = kdaKp * stats.winRatio;
    const kdaKpWrRel        = kdaKpWr / stats.averageKdaKpWr;
    const averageGameScale  = kdaKpWrRel * ((wins + loss) / stats.averageGames);
    const antismurf         = -1 * (1 - averageGameScale) * stats.vst;
    const baseVPR           = ((stats.tier - 1) * 100) + antismurf;

    return baseVPR;
  }

  update(playerStats) {
    // if (!playerStats.vpr) return playerStats;
    for (let patch in playerStats.vpr) {
      const seasonStats = playerStats.patches[patch] && playerStats.patches[patch]["gameModes"]["Ranked"] || [];
      playerStats.vpr[patch]["initial"] = this.initial(seasonStats, playerStats.tier);
      
    }

    return playerStats;

  }

  getTRatio(kills, deaths, assists, KP) {
    const killsPlayer       = kills;
    const deathsPlayer      = Math.max(deaths, 1);
    const assistsPlayer     = assists;
    return ((killsPlayer + assistsPlayer) / deathsPlayer) / (3 * KP);
  };

  getAvg(array) {
    let sum = 0;
    for (const value of array) {
      sum += value;
    }
    return sum / array.length;
  }

  implementVPRChanges(players, rosters) {

    let inverseTeam = {
      "right/red": "left/blue",
      "left/blue": "right/red"
    }
    
    const avgT = [];
    const kpPlayers = {};

    // First step: Get True Ratio and KP of every player
    players = players.map(p => {

      let teamKills = rosters.find(r => r.side === p.side);
      
      const teamTotalKill = Math.max(teamKills.heroKills, 1);
      const KPPlayer      = ((p.kills + p.assists) / teamTotalKill);
      const tRatioPlayer  = this.getTRatio(p.kills, p.deaths, p.assists, KPPlayer);

      avgT.push(tRatioPlayer);
      kpPlayers[p.id] = KPPlayer;

      return {
        ...p,
        kp: KPPlayer,
        tRatio: tRatioPlayer,
      };
    });
    
    // Second step: Calculate average True Ratio  and with that, 
    //              Relative True Ratio and KP Scale of every player
    //              Also summing up the VST 
    const avgtRatio       = this.getAvg(avgT);
    let SkillTierSumTeam = {
      "right/red": 0,
      "left/blue": 0
    }
    let scaleSumTeam = {
      "right/red": 0,
      "left/blue": 0
    }

    players = players.map(p => {
      const relativeTRatio = p.tRatio / avgtRatio;
      const kpScale = relativeTRatio * p.kp;

      SkillTierSumTeam[p.side] += p.tier;

      return {
        ...p,
        relativeTRatio,
        kpScale
      };
    });


    // Third step: We will use the KP Scale and calculate the scale of every player
    //             based on the the hardcoded Elo Scale Factor and their own KP Scale
    players = players.map(p => {
      let scale = 0;

      let enemyTeam = inverseTeam[p.side];
      let enemyVSTSUM = SkillTierSumTeam[enemyTeam];
      let teamVSTSUM = SkillTierSumTeam[p.side];

      if (p.winner) {
        scale = ELOSCALE_FACTOR / (teamVSTSUM / enemyVSTSUM) * p.kpScale;
      }
      else {
        scale = ELOSCALE_FACTOR / (enemyVSTSUM / teamVSTSUM) * p.kpScale;
      }

      scaleSumTeam[p.side] += scale;

      return {
        ...p,
        scale
      };
    });

    // Fourth Step: Get the GainLoss Scale, using the relative KP Scale
    //              Also we will aggregate the Elo Gain/Loss per team
    let eloGainLossTeams = {
      "right/red": 0,
      "left/blue": 0,
    }

    players = players.map(p => {
      let gainLossScaled = 0;
      let eloGainLoss = 0;

      let enemyTeam = inverseTeam[p.side];

      let scaleTeam = scaleSumTeam[p.side];
      let scaleEnemy = scaleSumTeam[enemyTeam];

      let relativeKPScale = p.scale / scaleTeam;

      if (p.winner) {
        eloGainLoss = ELOSCALE_FACTOR * relativeKPScale;
        gainLossScaled = eloGainLoss * (scaleTeam / scaleEnemy);
      }
      else {
        eloGainLoss = ELOSCALE_FACTOR / relativeKPScale;
        gainLossScaled = eloGainLoss * (scaleEnemy / scaleTeam);
      }

      eloGainLossTeams[p.side] += gainLossScaled;

      return {
        ...p,
        relativeKPScale,
        eloGainLoss,
        gainLossScaled,
      };
    });


    // Fifthy step: We will now calculate the VPR Gain/Loss (VPR DIFF)
    players = players.map(p => {

      let vprDiff = 0;

      let enemySide = inverseTeam[p.side]
      let TeamEloGainLoss = eloGainLossTeams[p.side];
      let EnemyEloGain = eloGainLossTeams[enemySide];

      let finalScale = ((p.gainLossScaled / TeamEloGainLoss) * ELOSCALE_FACTOR) * Math.ceil(players.length / 2);

      // if (p.winner) vprDiff = finalScale / (TeamEloGainLoss / EnemyEloGain);
      // else vprDiff = (finalScale / (EnemyEloGain / TeamEloGainLoss)) * -1
      if (p.winner) vprDiff = finalScale;
      else vprDiff = (finalScale) * -1


      return {
        ...p,
        vprDiff,
      };
    });

    return players;
  }

}

export default new VPRRating();