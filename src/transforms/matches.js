import * as lodash from "lodash";

function generateMatch(match) {

 const gameMode = (   match.gameMode == "Battle Royal"
           || match.gameMode == "Private Battle Royal"
         ) ? `${match.gameMode}e` : match.gameMode;

  return {
  id:                          match.data.id,
  shardId:                     match.shardId,
  gameMode:                    gameMode,
  endGameReason:               match.data.attributes.stats.endGameReason,
  createdAt:                   match.createdAt,
  duration:                    match.duration,
  patchVersion:                match.patchVersion,
  // We will generate Rosters + Players 
          ...generateRosters  (match.rosters),
  telemetry: generateTelemetry(...match.assets),
  }
}

function generateTelemetry(telemetry) {

  return {
    name:           "telemetry",
    createdAt:      telemetry.createdAt,
    contentType:    telemetry.contentType,
    URL:            telemetry.URL,
  }
}

function generateRosters(rosters) {
  const teams   = [];
  const players = [];

  const names   = {
   "left/blue": "Blue",
   "right/red": "Red",
  };
  // Let's separate the rosters
  lodash.forEach(rosters, (roster) => {
    
    teams[names[roster.stats.side]] = {
             ...roster.stats,
        };

    // Now, lets create the players for this roster
    players.push({...generatePlayers(roster.participants, roster)});

    
  })

  return {
    players: {...players[0], 
              ...players[1]},
    rosters: {...teams},
  };
}

function generatePlayers(players, roster) {

  const p = [];

  lodash.forEach(players, (player) => {
    
    delete player.data.attributes.itemGrants;

    p[player.player.id] = {
      uid:      player.player.id,
      name:     player.player.name,
      shardId:  player.player.shardId,
      tier:     player._stats.skillTier,
      actor:    player.actor,
      side:     roster.stats.side,
      aces:     roster.stats.acesEarned,
        ...player.stats,
    };

  });

  return p;

}

export default generateMatch;