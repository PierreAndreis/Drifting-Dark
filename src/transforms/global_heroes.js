import * as lodash from "lodash";
import {merge} from "./../lib/utils";
import MatchesModel from "./../models/vg_matches";

import T3Items from "~/resources/items_t3";

const translateSkillPath = (skillPath) => {
  return skillPath.map(skill => /_(.+)/.exec(skill)[1]);
}

const translateItemPath = (itemPath) => {
  const res = [];

  for (const tItem of itemPath) {

    const item = T3Items.find(t => t.name === tItem.Item);
    if (item && item !== []) {
      res.push(item.short);
    }
    if (res.length > 3) break;
  }

  return res.join(",");
}

const generateHeroesStats = (match, player) => {
  const winner      = (player.winner) ? 1 : 0;
  const afkOrNo     = (player.firstAfkTime !== -1) ? 1 : 0;

  const stats = {
    gameMode:     match.gameMode,
    matchId:      match.id,
    patchVersion: match.patchVersion,
    region:       match.shardId,
    actor:          player.actor,
    tier:           player.tier,
    wins:           winner,
    krakenCap:      player.krakenCaptures,
    crystalSentry:  player.crystalMineCaptures,
    goldMiner:      player.goldMineCaptures,
    aces:           player.aces,
    games:          1,
    side:           {[player.side]: {games: 1, wins: winner}},
    role:           {[player.role]: {games: 1, wins: winner}},
    afk:            afkOrNo,
    kills:          player.kills,
    deaths:         player.deaths,
    assists:        player.assists,
    farm:           player.farm,
    gold:           player.gold,
    lane:           player.nonJungleMinionKills,
    jungle:         player.minionKills,
    turretCaptures: player.turretCaptures,
    duration:       match.duration,
    teammates:      {},
    enemies:        {}
  };

  for (const p of match.players) {
    if (p.id === player.id) continue;

    const toAdd = {
      win: winner,
      games: 1,
    }

    if (p.side === player.side) stats.teammates[p.actor] = toAdd;
    if (p.side !== player.side) stats.enemies[p.actor] = toAdd
  }

  return stats;
}

const getTelemetryStats = async (match) => {
  let heroes = {};

  const telem = await MatchesModel.getMatchTelemetry(match.telemetry.URL, match.id);
  let averageTier = 0;
  
  match.players.forEach(p => averageTier += p.tier);

  averageTier = parseInt(averageTier / match.players.length);

  for (const pick of telem.Draft) {
    if (pick.Type !== "HeroBan") continue;
    heroes[pick.Hero] = {
      tier:         averageTier,
      patchVersion: match.patchVersion,
      gameMode: match.gameMode,
      region: match.shardId,
      bans: 1,
    };
  }

  const facts = telem.Facts;

  lodash.forEach(facts, teams => lodash.forEach(teams, (actor, name) => {

    const skillPath = translateSkillPath(actor.Skill);
    if (typeof actor.Items !== "object") {
      console.log(actor.Items, match.id, name);
    }
    const itemPath = translateItemPath(actor.Items);
    const player = match.players.find(p => name === p.actor);

      heroes[name] = {
        totalhealed: actor.Healed,
        totaldamage: actor.Damage,
        abilitypicks: {
          [skillPath]: 1
        },
        abilitywins: {
          [skillPath]: (player.winner) ? 1 : 0,
        },
        itemspicks: {
          [itemPath]: 1,
        },
        itemswin: {
          [itemPath]: (player.winner) ? 1 : 0,
        },
      }
  }));

  return heroes;
} 

export default async (match) => {
  let heroes = {};
  for (const player of match.players) {
    heroes[player.actor] = generateHeroesStats(match, player);
  }


  const telemetry = await getTelemetryStats(match);
  heroes = merge(heroes, telemetry);

  return heroes;
}
