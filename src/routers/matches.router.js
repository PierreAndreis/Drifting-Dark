import MatchesController from "~/controllers/vg_matches.js";
import TelemetryTransformer from "~/transforms/telemetry";
import fetch from "node-fetch";

// matches/:name
export const latestMatches = async (req, res, next) => {
  const { name } = req.params;
  const { patch, gameMode, page } = req.query;
  const reply = await MatchesController.getMatchesByName(name, { patch, gameMode, page });
  const data = [];
  for (const match of reply) {
    const telem = await fetch(match.telemetry.URL)
      .then(result => result.json()).then(json => json).catch(e => console.log(e));
    for (const each of telem) {
      if (each.payload.TargetActor === "*JungleMinion_GoldMiner*" && each.type !== "UseAbility") data.push(each);
        if (each.payload.Target === "*JungleMinion_GoldMiner*" && each.type !== "UseAbility") data.push(each);
      if (each.type === "DealDamage" && each.payload.TargetIsHero !== 1 && each.payload.Target !== "*OuterTurret*" && each.payload.Target !== "*Turret*" && each.payload.Target !== "*VainTurret*" && each.payload.Target !== "*VainCrystalHome*" && each.payload.Target !== "*VainCrystalAway*" && each.payload.Target !== "*PetalMinion*" && each.payload.Target !== "*PetalSeed*" && each.payload.Target !== "*FortressMinion*") data.push(each);
    }
  }

  res.json(data);
};

// matches/:id/:region/details
export const details = async (req, res, next) => {
  const { id, region } = req.params;
  const reply = await MatchesController.getMatchByMatchId(id, region);
  res.json(reply);
};

// matches/:id/:region/telem
export const telemetry = async (req, res, next) => {
  console.log("hi telem launched");
  const { id, region } = req.params;
  const reply = await MatchesController.getMatchByMatchId(id, region);
  const telem = await fetch(reply.telemetry.URL)
    .then(result => result.json()).then(json => json);
  // const telem = await TelemetryTransformer.lyraStyle(reply.telemetry.URL, id, reply.duration);
  res.json(telem);
};

// todo: loop to get more pages... get also at the same time another batch of 28 days before now
export const test = async (req, res, next) => {
  const { name } = req.params;
  const reply = await MatchesController.getAllPages(name);
  res.json(reply);
};

export const ProHistory = async (req, res, next) => {
  const reply = await MatchesController.ProMatches();
  res.json(reply);
};
