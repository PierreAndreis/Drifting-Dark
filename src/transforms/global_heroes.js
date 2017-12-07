import * as lodash from "lodash";

export default function (match) {
  
  const heroes = {};

  const stats = {
    kills:   0,
    deaths:  0,
    assists: 0,
    farm:    0,
  };

  lodash.forEach(match.rosters, (roster) => lodash.forEach(roster.participants, (participant) => {
    heroes[participant.actor] = generateHeroesStats(match, participant);

    stats.kills    += participant._stats.kills;
    stats.deaths   += participant._stats.deaths;
    stats.assists  += participant._stats.assists;
    stats.farm     += participant._stats.farm;
  }));
  
  const matches = generateMatchStats(match, stats, heroes);


  return matches;
  
}

function generateMatchStats(match, stats, heroes) {

  let blueWins = 0;
  let redWins  = 0;

  // why is this a string?
  (match.matchRoster[0].data.attributes.won === "false") ? blueWins = 1 : redWins = 1;

  return {
    stats: {
      kills:    stats.kills,
      deaths:   stats.deaths,
      assists:  stats.assists,
      farm:     stats.farm,
      blueWins: blueWins,
      redWins:  redWins,
      games:    1,
      duration: match.duration,
    },
    lastId: match.id,
    Heroes: {
      ...heroes
    }

  }
}

exports.generateHeroesStats = (match, player) => {
  const winner      = (player.winner) ? 1 : 0;
  const afkOrNo     = (player.firstAfkTime !== -1) ? 1 : 0;
  const stats = {
    patch:          match.patchVersion,
    region:         match.shardId,
    wins:           winner,
    krakenCap:      player.krakenCaptures,
    crystalSentry:  player.crystalMineCaptures,
    goldMiner:      player.goldMineCaptures,
    aces:           player.aces,
    games:          1,
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
    wonWith:        [],
    wonAgainst:     [],
    lostWith:       [],
    lostAgainst:    [],
  };

  if (winner === 1) {
    for (const won of match.players) {
      if (won === player) continue;
      if (won.side === player.side) stats.wonWith.push(won.actor);
      if (won.side !== player.side) stats.wonAgainst.push(won.actor);
    }
  } else {
    for (const loser of match.players) {
      if (loser === player) continue;
      if (loser.side === player.side) stats.lostWith.push(loser.actor);
      if (loser.side !== player.side) stats.lostAgainst.push(loser.actor);
    }
  }
  return stats;
}
