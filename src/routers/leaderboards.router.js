import Leaderboards from "~/services/leaderboards.js";

// leaderboards/:name
export const vpr = async (req, res, next) => {
  const { region, min, max, type } = req.query;
  const limit = max || 100;
  const start = min || 0;
  const leaderboard = await Leaderboards[type](region, start, limit, 'withscores');
  res.json(leaderboard);
};

