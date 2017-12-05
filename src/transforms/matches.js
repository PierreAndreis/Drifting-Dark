import * as lodash from "lodash";

const findRole = (player) => {
  let role = "Captain";

  const laneCS   = player.nonJungleMinionKills;
  const jungleCS = player.jungleKills;
  const farm     = player.minionKills;

  if (laneCS > jungleCS && farm > 45) role = "Carry";
  if (laneCS < jungleCS && farm > 45) role = "Jungler";

  return role;
}

function generateMatch(match) {
  const gameMode = (match.gameMode === "Battle Royal" || match.gameMode === "Private Battle Royal") ? `${match.gameMode}e` : match.gameMode;

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
    telemetry: generateTelemetry(match.assets[0]),
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
      role:     findRole(player.stats),
        ...player.stats,
    });

  });
  return p;
}

export default generateMatch;
