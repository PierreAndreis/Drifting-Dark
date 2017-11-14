import MatchesController    from "~/controllers/vg_matches.js";

// matches/:name
export const latestMatches = async (req, res, next) => {
  const {name} = req.params;
  const {patch, gameMode, page} = req.query
  const reply = await MatchesController.getMatchesByName(name, {patch, gameMode, page});
  res.json(reply);
}

// matches/:id/details
export const details = async (req, res, next) => {
  const { id } = req.params;
  let reply = await MatchesController.getMatchByMatchId(id);
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