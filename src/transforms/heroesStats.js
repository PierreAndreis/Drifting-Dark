import * as lodash from "lodash";
import Analysis from "~/lib/analysis";
import { merge } from "./../lib/utils";

import MatchesController from "./../controllers/vg_matches.js";

import logger from "./../lib/logger";

import T3Items from "~/resources/items_t3";
import { getTier } from "../resources/dictionaries";

const translateSkillPath = skillPath => {
  return skillPath.map(skill => /_(.+)/.exec(skill)[1]);
};

const translateItemPath = itemPath => {
  if (!itemPath) return [0];
  const res = [];

  for (const tItem of itemPath) {
    const item = T3Items.find(t => t.name === tItem.Item);
    if (item && item !== []) {
      res.push(item.short);
    }
  }

  return res.join(",");
};

const generateHeroesStats = (match, player) => {
  const winner = player.winner ? 1 : 0;
  const afkOrNo = player.firstAfkTime !== -1 ? 1 : 0;

  let minutesRounded = Math.ceil(match.duration / 60 / 10) * 10;

  const stats = {
    gameMode: match.gameMode,
    matchId: match.id,
    patchVersion: match.patchVersion,
    region: match.shardId,
    duration: match.duration,
    tier: "" + match.averageTier,
    durations: { [minutesRounded]: { games: 1, wins: winner } },
    actor: player.actor,
    wins: winner,
    krakenCap: player.krakenCaptures,
    crystalSentry: player.crystalMineCaptures,
    goldMiner: player.goldMineCaptures,
    aces: player.aces,
    games: 1,
    side: { [player.side]: { games: 1, wins: winner } },
    role: { [player.role]: { games: 1, wins: winner } },
    afk: afkOrNo,
    kills: player.kills,
    deaths: player.deaths,
    assists: player.assists,
    farm: player.farm,
    gold: player.gold,
    lane: player.nonJungleMinionKills,
    jungle: player.minionKills,
    turretCaptures: player.turretCaptures,
    teammates: {},
    enemies: {}
  };

  for (const p of match.players) {
    if (p.id === player.id) continue;

    const toAdd = {
      win: winner,
      games: 1
    };

    if (p.side === player.side) stats.teammates[p.actor] = toAdd;
    if (p.side !== player.side) stats.enemies[p.actor] = toAdd;
  }

  return stats;
};

const getTelemetryStats = async match => {
  let heroes = {};

  if (!match.telemetry && !match.telemetry.URL) {
    logger.warn(`No Telemetry: ${match.id}`);
    throw Error("InvalidJSON");
  }

  const telem = await MatchesController.getMatchTelemetry({
    telemetryLink: match.telemetry.URL,
    matchId: match.id
  });

  for (const pick of telem.draft) {
    if (pick.Type !== "HeroBan") continue;
    heroes[pick.Hero] = merge(heroes[pick.Hero], {
      actor: pick.Hero,
      tier: "" + match.averageTier,
      patchVersion: match.patchVersion,
      gameMode: match.gameMode,
      region: match.shardId,
      bans: 1
    });
  }

  const facts = telem.facts;

  lodash.forEach(facts, teams =>
    lodash.forEach(teams, (actor, name) => {
      if (name.includes("*KindredSocial")) return;
      const skillPath = translateSkillPath(actor.skill);
      const itemPath = translateItemPath(actor.items);
      const player = match.players.find(p => name === p.actor);

      if (!player) {
        console.log(
          "looking for ",
          [name, actor],
          " got ",
          match.players.filter(p => p.actor)
        );
      }

      heroes[name] = merge(heroes[name], {
        totalhealed: actor.healed,
        totaldamage: actor.damage,
        abilitypicks: {
          [skillPath]: 1
        },
        abilitywins: {
          [skillPath]: player.winner ? 1 : 0
        },
        itemspicks: {
          [itemPath]: 1
        },
        itemswin: {
          [itemPath]: player.winner ? 1 : 0
        },

        items: {
          [itemPath]: {
            win: player.winner ? 1 : 0,
            games: 1,
            totaldamage: actor.damage,
            totalhealed: actor.healed
          }
        },

        ability: {
          [skillPath]: {
            win: player.winner ? 1 : 0,
            games: 1,
            totaldamage: actor.damage,
            totalhealed: actor.healed
          }
        }
      });
    })
  );

  return heroes;
};

export default async match => {
  let heroes = {};

  let averageTier = 0;

  let gameMode = match.gameMode;
  let tierProperty = "tier";

  if (match.patchVersion >= "3.2" && gameMode.includes("5v5")) {
    tierProperty = "rank5v5vst";
  }

  match.players.forEach(p => (averageTier += p[tierProperty]));

  averageTier = parseInt(averageTier / match.players.length);

  if (tierProperty === "rank5v5vst") {
    averageTier = getTier(averageTier);
  }

  match.averageTier = averageTier;

  for (const player of match.players) {
    heroes[player.actor] = merge(
      heroes[player.actor],
      generateHeroesStats(match, player)
    );
  }

  const telemetry = await getTelemetryStats(match);
  heroes = merge(heroes, telemetry);

  Analysis.increment("heroes.match.add", 1, [
    `tier:${match.averageTier}`,
    `region:${match.shardId}`,
    `patch:${match.patchVersion}`,
    `gameMode:${match.gameMode}`
  ]);

  return heroes;
};
