import * as lodash    from "lodash";
import moment         from "moment";
import { merge }      from "~/lib/utils";

import MatchesTransform from "./matches";

class ProStats {

  create(match, proInfo) {

    const playerName = proInfo.name;
    
    // let playerStats;

    const playerStats = match.players.find(p => p.name === playerName)
    // console.log(match.players);

    return {
      createdAt: match.createdAt,
      matchId:   match.id,
      ...proInfo,
      tier:     playerStats.tier,
      skilName: playerStats.skilName,
      winner:   playerStats.winner,
      kills:    playerStats.kills,
      deaths:   playerStats.deaths,
      assists:  playerStats.assists,
      items:    playerStats.items,
    };
    
  }

}

export default new ProStats();