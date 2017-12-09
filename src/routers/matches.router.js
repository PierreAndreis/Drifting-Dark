import MatchesController    from "~/controllers/vg_matches.js";
import VPR from "~/transforms/vpr.js";

// matches/:name
export const latestMatches = async (req, res, next) => {
  const {name} = req.params;
  const {patch, gameMode, page} = req.query
  // let reply = await MatchesController.getMatchesByName(name, {patch, gameMode, page});
  const reply = await VPR.initial({ tier: 2, kills: 8, deaths: 2, assists: 4, kp: 90, wins: 823, losses: 797 })
  console.log(reply)
    res.json(reply);
}

// matches/:id/:region/details
export const details = async (req, res, next) => {
  const { id, region } = req.params;
  let reply = await MatchesController.getMatchByMatchId(id, region);
  res.json(reply);
}

// todo: loop to get more pages... get also at the same time another batch of 28 days before now
export const test = async (req, res, next) => {
  const {name} = req.params;
  const reply = await MatchesController.getAllPages(name);
  res.json(reply);
}

export const ProHistory = async (req, res, next) => {
  const reply = await MatchesController.ProMatches();
  res.json(reply);
}