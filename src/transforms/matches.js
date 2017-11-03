import * as lodash from "lodash";

function generateMatch(match) {
  const gameMode = (match.gameMode === "Battle Royal"
           || match.gameMode === "Private Battle Royal"
  ) ? `${match.gameMode}e` : match.gameMode;

  return {
    id: match.data.id,
    shardId: match.shardId,
    gameMode,
    endGameReason: match.data.attributes.stats.endGameReason,
    createdAt: match.createdAt,
    duration: match.duration,
    patchVersion: match.patchVersion,
    // We will generate Rosters + Players
    ...generateRosters(match.rosters),
    telemetry: generateTelemetry(...match.assets),
  };
}

function generateTelemetry(telemetry) {
  return {
    name: "telemetry",
    createdAt: telemetry.createdAt,
    contentType: telemetry.contentType,
    URL: telemetry.URL,
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
   players: players,
   rosters
  };
}

function generatePlayers(players, roster) {

  let p = [];

  lodash.forEach(players, (player) => {
    delete player.data.attributes.itemGrants;

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
