import allPlayers from "../resources/vg8_teams/teams_autumn_1";
import matches from "./vg_matches";

const players = {};
let counter = 0;

// Run a loop depending on how many teams there are
for (let i = 0; i < allPlayers.length; i++) {
  // For each player in the team add their IGN and region to players
  players[i].ign = allPlayers[i].players.name;
  players[i].region = allPlayers[i].players.region;
}

async function queuePros() {
  let maxSearch = counter + 15;
  if (!players.length > maxSearch) {
    // If the max loop counter is more than players.length decrease the maxSearch
    const difference = maxSearch - players.length;
    maxSearch -= difference;
  }
  // Loop through the list of players starting from the counter and for 15 players
  for (let i = counter; i < maxSearch; i++) {
    let lastMatch;
    // If the lastMatch exists use it
    if (players[i].lastMatch) {
      lastMatch = players[i].lastMatch;
    } else {
      // if the lastMatch didnt exist create it for NOW
      lastMatch = new Date().toISOString();
      // Add lastMatch to the player for next time
      players[i].lastMatch = lastMatch;
    }
    // If the counter is at the last player reset to 0 else add 1 to the counter
    if (counter === players.length) {
      counter = 0;
    } else counter++;
    const data = matches.getMatches(players[i].ign, players[i].region, lastMatch);
    // If error move to next loop
    if (!data) continue;
    // TODO: Store the data in redis
  }
}

// Infinite loop every 1 minute calling the queuePros function
setInterval(queuePros(), 60000);
