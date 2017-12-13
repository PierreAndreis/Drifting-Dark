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

function generateHeroesStats(match, participant) {

  const p = participant.data.attributes.stats;

  const winner = (p.winner) ? 1 : 0;
  const afk    = (p.firstAfkTime !== -1) ? 1 : 0;

  return {
    hero:           participant.actor,
    wins:           winner,
    krakenCap:      p.krakenCaptures,
    aces:           p.aces,
    games:          1,
    afk:            afk,
    kills:          p.kills,
    deaths:         p.deaths,
    assists:        p.assists,
    farm:           p.farm,
    turretCaptures: p.turretCaptures,
    duration:       match.duration, 
  };
}
