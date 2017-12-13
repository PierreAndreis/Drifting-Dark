import Leaderboards from "~/services/leaderboards.js";

// leaderboards/:region
export const vpr      = async (req, res, next) => {
  const region        = req.params;
  const { min, max }  = req.query;
  const limit         = max || 100;
  const start         = min || 0;
  const top           = await Leaderboards.range(`vpr:${region}`, start, limit, "withscores");
  res.json(top);
};

// leaderboards/:type/:region
export const leaderboard    = async (req, res, next) => {
  const { region, types }   = req.params;
  const { min, max }        = req.query;
  const limit               = max || 100;
  const start               = min || 0;
  const top                 = await Leaderboards.range(`${types}:${region}`, start, limit, "withscores");
  res.json(top);
};
