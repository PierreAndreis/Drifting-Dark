import * as lodash    from "lodash";
import moment         from "moment";
import { merge }      from "~/lib/utils";
import Config from "~/config"
import MatchesTransform from "./matches";
import PlayerController from "~/controllers/vg_player";
import PlayerStats from "~/transforms/playerStats";

class VPRRating {

    async initial(playerName) {
        const averageKdaKpWr = // TODO: need this value
        const season = Config.VAINGLORY.SEASONS[Config.VAINGLORY.previousSeason];
        const seasonStats = PlayerStats.output.json(playerName, { season });

        return (stats.tier + 1) * (-1 * (1 - seasonStats.kda * seasonStats.kp * seasonStats.winRatio / averageKdaKpWr * seasonStats.averageValue * 100))
    }

    update() {
        const avgT = [];

        const getTRatio = (kills, deaths, assists, KP) => {
            const killsPlayer   = kills;
            const deathsPlayer  = Math.max(deaths, 1);
            const assistsPlayer = assists;

            return ((killsPlayer + assistsPlayer) / deathsPlayer) / (3 * KP);
        }

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

            console.log(`${p.name} TrueRatio=`, tRatioPlayer);
            avgT.push(tRatioPlayer);

            return {
                ...p,
                tRatio: tRatioPlayer,
                kp: KPPlayer
            }
        });
        // relativeTRatioPlayerA = tRatioPlayerA / (average of (tRatioPlayerA, tRatioPlayerB, tRatioPlayerC, tRatioPlayerD, tRatioPlayerE, tRatioPlayerF))
        const avgtRatio = avgT.reduce((c, p) => c += p);
        console.log("avg Team TrueRatio=", avgtRatio);

        match.players = match.players.map(p => {
            const relativeTRatio = (p.tRatio / avgtRatio);
            console.log(`${p.name} - relative Team Ratio =`, relativeTRatio);
            return {
                ...p,
                relativeTRatio
            }
        })

        // relativeTRatioPlayerA = tRatioPlayerA / (average of (tRatioPlayerA, tRatioPlayerB, tRatioPlayerC, tRatioPlayerD, tRatioPlayerE, tRatioPlayerF))

        // console.log(avgT);

        // const tRatioPlayerA = ((killsPlayerA + assistsPlayerA) / deathsPlayerA) / (3 * killParticipationPlayerA)
    }

}

export default new VPRRating();