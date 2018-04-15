import LeaderboardsController    from "~/controllers/leaderboards.js";

// leaderboards/:type/:region
export const leaderboard = async (req, res, next) => {
  const { type, region } = req.params;
  const { limit, offset }  = req.query;
  const reply = await LeaderboardsController.getRange(type, region, {limit, offset});
  res.json(reply);
};

export const leaderboardFindPlayer = async (req, res, next) => {
  const { type, region, playerName } = req.params;
  const reply = await LeaderboardsController.getPlayer(type, region, playerName);
  res.json(reply);
}