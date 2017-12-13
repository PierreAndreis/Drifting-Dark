import Leaderboards from "~/services/leaderboards.js";

// leaderboards/:name
export const vpr = async (req, res, next) => {
  const { region, amount, type } = req.query;
  const limit = amount || 100;
  const leaderboard = await Leaderboards[type](region, 0, limit, 'withscores');
  res.json(leaderboard);
};

