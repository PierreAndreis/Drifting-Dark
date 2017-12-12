import MatchesController from "~/controllers/vg_matches.js";
import VPR from "~/transforms/vpr.js";
import Redis from "~/services/redis.js";

// leaderboards/:name
export const vpr = async (req, res, next) => {
    console.log('this ran')
  const { name } = req.params;
  const { patch, gameMode, page } = req.query;
  let reply = await MatchesController.getMatchesByName(name, { patch, gameMode, page });
  reply = await VPR.update(reply[0]);
  console.log(reply)
  const vprs = [];
  for (const player of reply.players) {
    const vpr = player.vpr;
    Redis.zadd('vpr', vpr, player.name);
  }

  const leaderboard = await Redis.zrevrank('vpr');
  res.json(leaderboard);
};
