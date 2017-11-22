import * as lodash    from "lodash";
import moment         from "moment";
import { merge }      from "~/lib/utils";

import MatchesTransform from "./matches";

class ProStats {

  create(match, proInfo) {

    const playerName = proInfo.name;
    const playerStats = match.players.find(p => p.name === playerName);
    
    if (!playerStats) return false;

    // Make a schema check
    const schema = Joi.object().keys({ 
      createdAt:    Joi.string().isoDate().required(),
      matchId:      Joi.string().guid().required(),
      proInfo:      '', // TODO: How to do this
      actor:        Joi.string().min(1).alphanum().required(),
      tier:         Joi.number().min(-1).max(29).integer().required(),
      skilName:     '', // TODO: How to do this
      winner:       Joi.number().min(0).max(1).positive().integer().required(),
      kills:        Joi.number().min(0).positive().integer().required(),
      deaths:       Joi.number().min(0).positive().integer().required(),
      assists:      Joi.number().min(0).positive().integer().required(),
      items:        '' // TODO: how to do this
    })

    const object = {
      createdAt: match.createdAt,
      matchId:   match.id,
      proInfo,
      actor:    playerStats.actor,
      tier:     playerStats.tier,
      skilName: playerStats.skilName,
      winner:   playerStats.winner,
      kills:    playerStats.kills,
      deaths:   playerStats.deaths,
      assists:  playerStats.assists,
      items:    playerStats.items,
    };

    return Joi.validate(object, schema, (err, value) => {
      if (err) {
        console.log(err) 
        return err // TODO: Do we need to do anything else if this errors?
      }
      return value
    })
    
  }

}

export default new ProStats();