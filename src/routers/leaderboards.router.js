import Leaderboards from "~/services/leaderboards.js";

// leaderboards/:name
export const vpr = async (req, res, next) => {
  console.log('this ran')
  const { region, min, max, type } = req.query;
  const limit = max || 100;
  const start = min || 0;
  const leaderboard = await Leaderboards[type](region, start, limit, 'withscores');
  res.json(leaderboard);
};
