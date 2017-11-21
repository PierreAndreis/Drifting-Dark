import * as lodash from "lodash";
import Joi from "joi";

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
  
  // Make a schema check
  const schema = Joi.object().keys({ 
    kills: Joi.number().min(0).required().integer(),
    deaths: Joi.number().min(0).required().integer(),
    assists: Joi.number().min(0).required().integer(),
    farm: Joi.number().min(0).required().integer(),
    blueWins: Joi.number().min(0).max(1).required().integer(),
    redWins: Joi.number().min(0).max(1).integer().required(),
    games: Joi.number().min(0).integer().required(), 
    duration: Joi.number().min(1).integer().required(),
    lastId: Joi.string().required(),
    Heroes: ,// how to do this
})

  const object = {
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

  return Joi.validate(object, schema, (err, value) => {
    if (err) {
      console.log(err) 
      return err // TODO: Do we need to do anything else if this errors?
    }
    return value
  })
}

function generateHeroesStats(match, participant) {

  const p = participant.data.attributes.stats;

  const winner = (p.winner) ? 1 : 0;
  const afk    = (p.firstAfkTime !== -1) ? 1 : 0;

  // Make a schema check
  const schema = Joi.object().keys({
    hero: Joi.string().min(0).required().alphanum(),
    wins: Joi.numbe().min(0).max(1).required().integer(),
    krakenCap: Joi.number().min(0).required().integer(),
    aces: Joi.number().min(0).required().integer(),
    games: Joi.number().min(0).required().integer(),
    afk: Joi.number().integer().required(),
    kills: Joi.number().integer().required().min(0), 
    deaths: Joi.number().min(1).integer().required(),
    assists: Joi.number().integer().required().min(0),
    farm: Joi.number().min(0).integer().required(),
    turretCaptures: Joi.number().min(0).integer().required(),
    duration: Joi.number().min(0).integer().required()
})
  const object = {
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
  return Joi.validate(object, schema, (err, value) => {
    if (err) {
      console.log(err) 
      return err // TODO: Do we need to do anything else if this errors?
    }
    return value
  }) 
}
