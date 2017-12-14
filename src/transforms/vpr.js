import * as lodash      from "lodash";
import moment           from "moment";
import { merge }        from "~/lib/utils";
import Config           from "~/config";
import MatchesTransform from "./matches";
import PlayerController from "~/controllers/vg_player";
import PlayerStats      from "~/transforms/playerStats";

class VPRRating {

  async initial(seasonStats) {

    const stats = {
      kda:              (seasonStats.kills + seasonStats.assists) / seasonStats.deaths,
      kp:               seasonStats.kp / 100,
      winRatio:         seasonStats.wins / (seasonStats.losses + seasonStats.wins),
      averageKdaKpWr:   (2.743333333 + 0.4454112848 + 13) / 3, // TODO: need this value
      averageGames:     1197, // TODO: need this value
    vst:                100, // TODO: need this value
    };

    const kdaKp             = stats.kda * stats.kp;
    const kdaKpWr           = kdaKp * stats.winRatio;
    const kdaKpWrRel        = kdaKpWr / stats.averageKdaKpWr;
    const averageGameScale  = kdaKpWrRel * ((seasonStats.wins + seasonStats.losses) / stats.averageGames);
    const antismurf         = -1 * (1 - averageGameScale) * stats.vst;

    return ((seasonStats.tier - 1) * 100) + antismurf;
  }

  update(players, roster, blueVstSum, redVstSum) {
    // Need these 4 for each player to make update work: Kills, deaths, assists, teamKills, vst

    const getTRatio = (kills, deaths, assists, KP) => {
      const killsPlayer       = kills;
      const deathsPlayer      = Math.max(deaths, 1);
      const assistsPlayer     = assists;
      // console.log(`kills: ${kills}, deaths: ${deaths}, assists: ${assists}, kp: ${KP}`)
      return ((killsPlayer + assistsPlayer) / deathsPlayer) / (3 * KP);
    };

    const avgT = [];

    players = players.map(p => {
      const { stats }     = p.data.attributes;
      const teamTotalKill = Math.max(roster.data.attributes.stats.heroKills, 1);
      const KPPlayer      = ((stats.kills + stats.assists) / teamTotalKill);
      const tRatioPlayer  = getTRatio(stats.kills, stats.deaths, stats.assists, KPPlayer);

      avgT.push(tRatioPlayer);

      return {
        ...p,
        tRatio: tRatioPlayer,
        kp:     KPPlayer
      };
    });
    
    function getAvgtRatio() {

      let sum = 0;

      for (const player of avgT) {

        sum += player;

      }

      return sum / avgT.length;

    }

    const avgtRatio       = getAvgtRatio();
    let vstSumTeamBlue    = 0;
    let vstSumTeamRed     = 0;
    let scaleSumTeamBlue  = 0;
    let scaleSumTeamRed   = 0;

    players = players.map(p => {
      const relativeTRatio = p.tRatio / avgtRatio;
      const kpScale = relativeTRatio * p.kp;

      if (p.side === "right/red") vstSumTeamRed += p.tier;
      else vstSumTeamBlue += p.tier;

      return {
        ...p,
        relativeTRatio,
        kpScale
      };
    });

    const eloScaleFactor = 5;
    const  winner     = roster.data.attributes.won;
    const { side }    = roster.data.attributes.stats;

    players = players.map(p => {
      let scale;

      if (side === "right/red") {
        if (winner) {
          scale             = eloScaleFactor / (redVstSum / blueVstSum) * p.kpScale;
          scaleSumTeamRed   += scale;
        }
        else {
          scale             = eloScaleFactor / (blueVstSum / redVstSum) * p.kpScale;
          scaleSumTeamRed   += scale;
        }
      } else {
        if (winner) {
          scale             = eloScaleFactor / (blueVstSum / redVstSum) * p.kpScale;
          scaleSumTeamBlue  += scale;
        }
        else {
          scale             = eloScaleFactor / (redVstSum / blueVstSum) * p.kpScale;
          scaleSumTeamBlue  += scale;
        }
      }
      return {
        ...p,
        scale
      };
    });

    let eloGainLossTeamRed = 0, eloGainLossTeamBlue = 0;

    players = players.map(p => {
      let relativeKPScale, eloGainLoss, gainLossScaled;

      if (side === 'right/red') relativeKPScale = p.scale/scaleSumTeamRed;
      else relativeKPScale = p.scale/scaleSumTeamBlue;

      if (winner) eloGainLoss = eloScaleFactor * relativeKPScale;
      else eloGainLoss = eloScaleFactor / relativeKPScale;

      if (side === 'right/red') {
        if (winner) gainLossScaled = eloGainLoss * (redVstSum / blueVstSum);
        else gainLossScaled = eloGainLoss * (blueVstSum / redVstSum);
        eloGainLossTeamRed += gainLossScaled;
      } else {
        if (winner) gainLossScaled = eloGainLoss / (blueVstSum / redVstSum);
        else gainLossScaled = eloGainLoss / (redVstSum / blueVstSum);
        eloGainLossTeamBlue += gainLossScaled;
      }
      return {
        ...p,
        gainLossScaled,
      };
    });

    players = players.map(p => {
      let finalScale;
      const vpr = {
        won: winner
      };

      if (side === "right/red") finalScale = ((p.gainLossScaled / eloGainLossTeamRed) * eloScaleFactor) * Math.ceil(players.length / 2);
      else finalScale = ((p.gainLossScaled / eloGainLossTeamBlue) * eloScaleFactor) * Math.ceil(players.length / 2);

      if (side === "right/red") {
        if (winner) vpr.amount = finalScale / (redVstSum / blueVstSum);
        else vpr.amount = finalScale / (blueVstSum / redVstSum);
      } else {
        if (winner) vpr.amount = finalScale / (blueVstSum / redVstSum);
        else vpr.amount = finalScale / (redVstSum / blueVstSum);
      }
      return {
        ...p,
        vpr,
      };
    });

    return players;
  }

}

export default new VPRRating();