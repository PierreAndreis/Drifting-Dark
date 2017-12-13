import Redis from "~/services/redis.js";

// leaderboards/:name
export const vpr = async (req, res, next) => {
  const { region, amount, type } = req.query;
  const limit = amount || 100;
  const leaderboard = await Redis.zrevrange(type, region, 0, limit, 'withscores');
  res.json(leaderboard);
};

