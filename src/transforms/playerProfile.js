import * as lodash from "lodash";
import Joi from "joi"

const ALLSEASONS = {
  spring07: ["2.2", "2.3", "2.4", "2.5"],
  summer07: ["2.6", "2.7"],
  autumn07: ["2.8", "2.9", "2.10"]
}

const findSeasonByPatch = (patchVersion) => {
  let season;

  lodash.forEach(ALLSEASONS, (s, name) => {
    if (s.includes(patchVersion)) {
      season = name;
      return false;
    }
  })


  return season;
}

export const createPlayer = (p) => {
  
  const player = {...p.raw};

  let patch = player.attributes.patchVersion;

  let season = findSeasonByPatch(patch);

  // Make a schema check
  const schema = Joi.object().keys({ 
    id:          Joi.string().guid().required(),
    region:      Joi.string().min(2).alphanum().required(),
    name:        Joi.string().min(3).max(16).alphanum().required(),
    lastPatch:   Joi.string().alphanum().required(),
    lastSeason:  Joi.string().alphanum().required(),
  })

  const object = {
    id:            player.id,
    name:          player.attributes.name,
    region:        player.attributes.shardId,
    lastPatch:     patch,
    lastSeason:    season,
  }

  return Joi.validate(object, schema, (err, value) => {
    if (err) {
      console.log(err) 
      return err // TODO: Do we need to do anything else if this errors?
    }
    return value
  })
}