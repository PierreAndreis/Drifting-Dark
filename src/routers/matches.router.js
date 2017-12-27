import MatchesController    from "~/controllers/vg_matches.js";

// matches/:name
export const latestMatches = async (req, res, next) => {
  const { name } = req.params;
  const { patch, gameMode, page, limit } = req.query;
  let reply = await MatchesController.getMatchesByName(name, { patch, gameMode, page, limit });
  res.json(reply);
};

// matches/:id/:region/details
export const details = async (req, res, next) => {
  const { id, region } = req.params;
  const reply = await MatchesController.getMatchByMatchId(id, region);
  res.json(reply);
};

// matches/:id/:region/telem
export const telemetry = async (req, res, next) => {
    const { id, region } = req.params;
  const reply = await MatchesController.getMatchTelemetry(id, region);
  res.json(reply);
};

// todo: loop to get more pages... get also at the same time another batch of 28 days before now
// export const test = async (req, res, next) => {
//   const { name } = req.params;
//   const reply = await MatchesController.getAllPages(name);
//   res.json(reply);
// };

// export const test = async (req, res, next) => {
//   const { name } = req.params;
//   const { patch, gameMode, page, limit } = req.query;
//   let reply = await MatchesController.getAllPages(name);
//   reply.forEach(match => {
//     HeroesStats.addMatch(match);
//   })
//   res.json(reply);
// };

// export const test = async (req, res, next) => {
//   const { name } = req.params;
//   const { patch, gameMode, page, limit } = req.query;
//   const reply = await HeroesStats.cacheStats();
//   res.json(reply);
// };

export const ProHistory = async (req, res, next) => {
  const reply = await MatchesController.ProMatches();
  res.json(reply);
};
