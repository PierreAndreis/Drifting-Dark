import * as lodash from "lodash";
import Joi from "joi";

function generateMatch(match) {
  const gameMode = (match.gameMode === "Battle Royal" || match.gameMode === "Private Battle Royal") ? `${match.gameMode}e` : match.gameMode;

  // Make a schema check
  const schema = Joi.object().keys({ 
    id:               Joi.string().guid().required(),
    shardId:          Joi.string().min(2).alphanum().required(),
    gameMode:         Joi.string().alphanum().required(),
    endGameReason:    Joi.string().alphanum().required(),
    createdAt:        Joi.string().isoDate().required(),
    duration:         Joi.number().min(0).positive().integer().required(),
    patchVersion:     Joi.string().min(0).alphanum().required(),
    generateRosters:  '', // TODO: how to do this
    telemetry:        '', // TODO: how to do this
  })

  const object = {
    id:      match.data.id,
    shardId: match.shardId,
    gameMode,
    endGameReason: match.data.attributes.stats.endGameReason,
    createdAt:     match.createdAt,
    duration:      match.duration,
    patchVersion:  match.patchVersion,
    // We will generate Rosters + Players
            ...generateRosters(match.rosters),
    telemetry: generateTelemetry(match, ...match.assets),
  };

  // TODO: Once finished uncomment this and delete the return at the bottom 
  // return Joi.validate(object, schema, (err, value) => {
  //   if (err) {
  //     console.log(err) 
  //     return err // TODO: Do we need to do anything else if this errors?
  //   }
  //   return value
  // })

  return {
    id:      match.data.id,
    shardId: match.shardId,
    gameMode,
    endGameReason: match.data.attributes.stats.endGameReason,
    createdAt:     match.createdAt,
    duration:      match.duration,
    patchVersion:  match.patchVersion,
    // We will generate Rosters + Players
            ...generateRosters(match.rosters),
    telemetry: generateTelemetry(match, ...match.assets),
  };
}

function generateTelemetry(telemetry) {
  if (!telemetry || !telemetry.URL) return {}
  
  return {
    name:       "telemetry",
    URL:         telemetry.URL,
  };
}

function generateRosters(r) {
  const rosters = [];
  const players = [];

  const names = {
    "left/blue": "Blue",
    "right/red": "Red",
  };
  // Let's separate the rosters
  lodash.forEach(r, (roster) => {
    
    rosters.push(roster.stats);

    // Now, lets create the players for this roster
    players.push(...generatePlayers(roster.participants, roster));

  });

  return {
   players,
   rosters
  };
}

function generatePlayers(players, roster) {

  let p = [];

  lodash.forEach(players, (player) => {

    p.push({
      id:       player.player.id,
      name:     player.player.name,
      shardId:  player.player.shardId,
      tier:     player._stats.skillTier,
      actor:    player.actor,
      side:     roster.stats.side,
      aces:     roster.stats.acesEarned,
        ...player.stats,
    });

  });
  return p;
}

export default generateMatch;
