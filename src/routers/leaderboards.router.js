import Redis from "~/services/redis.js";

// leaderboards/:name
export const vpr = async (req, res, next) => {
  const { name } = req.params;
  const { region, amount } = req.query;
  const limit = amount || 100;
  const leaderboard = await Redis.zrevrange(`vpr:${region}`, 0, limit, 'withscores');
  res.json(leaderboard);
};
