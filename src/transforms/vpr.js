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
      kda: (seasonStats.kills + seasonStats.assists) / seasonStats.deaths,
      kp: seasonStats.kp / 100,
      winRatio: seasonStats.wins / (seasonStats.losses + seasonStats.wins),
      averageKdaKpWr: (2.743333333 + 0.4454112848 + 13) / 3, // TODO: need this value
      averageGames: 1197, // TODO: need this value
      vst: 100, // TODO: need this value
    };
    const kdaKp = stats.kda * stats.kp;
    const kdaKpWr = kdaKp * stats.winRatio;
    const kdaKpWrRel = kdaKpWr / stats.averageKdaKpWr;

    const averageGameScale = kdaKpWrRel * ((seasonStats.wins + seasonStats.losses) / stats.averageGames);

    const antismurf = -1 * (1 - averageGameScale) * stats.vst;
    return ((seasonStats.tier - 1) * 100) + antismurf;
  }

  update(match) {
    // Kills, deaths, assists, teamKills, vst

    const getTRatio = (kills, deaths, assists, KP) => {
      const killsPlayer   = kills;
      const deathsPlayer  = Math.max(deaths, 1);
      const assistsPlayer = assists;
      return ((killsPlayer + assistsPlayer) / deathsPlayer) / (3 * KP);
    };

    const avgT = [];
    match.players = match.players.map(p => {

      //          "name":"FlashX",
      //          "tier":28,
      //          "actor":"Skaarf",
      //          "side":"right/red",
      //          "aces":0,
      //          "assists":3,
      //          "crystalMineCaptures":1,
      //          "deaths":5,
      //          "farm":51,
      //          "firstAfkTime":-1,
      //          "gold":13770.6640625,
      //          "goldMineCaptures":0,
      //          "jungleKills":4,
      //          "kills":3,
      //          "krakenCaptures":0,
      //          "level":30,
      //          "minionKills":22,
      //          "nonJungleMinionKills":18,
      //          "turretCaptures":0,
      //          "winner":false
      //   {
      //    "acesEarned":0,
      //    "gold":41633,
      //    "heroKills":13,
      //    "krakenCaptures":0,
      //    "side":"left/blue",
      //    "turretKills":1,
      //    "turretsRemaining":5
      // },
      const teamStats = match.rosters.find(r => r.side === p.side);
      const teamTotalKill = Math.max(teamStats.heroKills, 1);
      const KPPlayer = ((p.kills + p.assists) / teamTotalKill);

      const tRatioPlayer = getTRatio(p.kills, p.deaths, p.assists, KPPlayer);

    //   console.log(`${p.name} TrueRatio=`, tRatioPlayer);
      avgT.push(tRatioPlayer);

      return {
        ...p,
        tRatio: tRatioPlayer,
        kp: KPPlayer
      };
    });
    
    function getAvgtRatio() {
      let sum = 0;
      for (const player of avgT) {
        sum += player;
      }
      return sum / avgT.length;
    }

    //  relativeTRatioPlayerA = tRatioPlayerA / (average of (tRatioPlayerA, tRatioPlayerB, tRatioPlayerC, tRatioPlayerD, tRatioPlayerE, tRatioPlayerF));
    // const avgtRatio = avgT.reduce((c, p) => c += p);
    const avgtRatio = getAvgtRatio();
    // console.log("avg Team TrueRatio=", avgtRatio);

    let vstSumTeamBlue = 0;
    let vstSumTeamRed = 0;
    let scaleSumTeamBlue = 0;
    let scaleSumTeamRed = 0;
    match.players = match.players.map(p => {
      const relativeTRatio = p.tRatio / avgtRatio;

    //   console.log(`${p.name} - relative Team Ratio =`, relativeTRatio);
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

    match.players = match.players.map(p => {
      let scale;
      if (p.side === "right/red") {
        if (p.winner) {
          scale = eloScaleFactor / (vstSumTeamRed / vstSumTeamBlue) * p.kpScale;
          scaleSumTeamRed += scale;
        }
        else {
          scale = eloScaleFactor / (vstSumTeamBlue / vstSumTeamRed) * p.kpScale;
          scaleSumTeamRed += scale;
        }
      } else {
        if (p.winner) {
          scale = eloScaleFactor / (vstSumTeamBlue / vstSumTeamRed) * p.kpScale;
          scaleSumTeamBlue += scale;
        }
        else {
          scale = eloScaleFactor / (vstSumTeamRed / vstSumTeamBlue) * p.kpScale;
          scaleSumTeamBlue += scale;
        }
      }
      return {
        ...p,
        scale
      };
    });

    let eloGainLossTeamRed = 0, eloGainLossTeamBlue = 0;

    match.players = match.players.map(p => {
      let relativeKPScale, eloGainLoss, eloGainLossScaled;

      if (p.side === 'right/red') relativeKPScale = p.scale/scaleSumTeamRed;
      else relativeKPScale = p.scale/scaleSumTeamBlue;

      if (p.winner) eloGainLoss = eloScaleFactor * relativeKPScale;
      else eloGainLoss = eloScaleFactor / relativeKPScale;

      if (p.side === 'right/red') {
        if (p.winner) {
            eloGainLossScaled = eloGainLoss * (vstSumTeamRed/vstSumTeamBlue);
        }
        else {
            eloGainLossScaled = eloGainLoss * (vstSumTeamBlue/vstSumTeamRed);
        }
        eloGainLossTeamRed += eloGainLossScaled;
      } else {
        if (p.winner) eloGainLossScaled = eloGainLoss / (vstSumTeamBlue / vstSumTeamRed);
        else eloGainLossScaled = eloGainLoss / (vstSumTeamRed / vstSumTeamBlue);
        eloGainLossTeamBlue += eloGainLossScaled;
      }
      return {
        ...p,
        eloGainLossScaled
      };
    });

    match.players = match.players.map(p => {
      let finalScale, vpr;
      if (p.side === "right/red") finalScale = p.eloGainLossScaled / (eloGainLossTeamRed * eloScaleFactor * Math.ceil(match.players.length / 2));
      else finalScale = p.eloGainLossScaled / (eloGainLossTeamBlue * eloScaleFactor * Math.ceil(match.players.length / 2));

      if (p.side === "right/red") {
        if (p.winner) vpr = finalScale / (vstSumTeamRed / vstSumTeamBlue);
        else vpr = finalScale / (vstSumTeamBlue / vstSumTeamRed);
      } else {
        if (p.winner) vpr = finalScale / (vstSumTeamBlue / vstSumTeamRed);
        else vpr = finalScale / (vstSumTeamRed / vstSumTeamBlue);
      }
    console.log(`${p.name}: finalScale ${finalScale}`)
      return {
        ...p,
        vpr
      };
    });

    // relativeTRatioPlayerA = tRatioPlayerA / (average of (tRatioPlayerA, tRatioPlayerB, tRatioPlayerC, tRatioPlayerD, tRatioPlayerE, tRatioPlayerF))

    // console.log(avgT);

    // const tRatioPlayerA = ((killsPlayerA + assistsPlayerA) / deathsPlayerA) / (3 * killParticipationPlayerA)

    // const kpScale = relativeTRatio * (vstSumTeamRed)
  }

}

export default new VPRRating();