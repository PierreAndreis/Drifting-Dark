import { Router } from "express";

import * as PlayerRouter  from "./routers/players.router";
import * as MatchesRouter from "./routers/matches.router";
import { leaderboard }    from "./routers/leaderboards.router";
import { heroesStats, heroesHistory }    from "./routers/heroes.router";

import * as Pro from "./routers/pro.router";

// import * as Tournament from "./routers/tournament.router";

const routes = Router();

const routers = [
  {
    name    : "Player/Find",
    enabled : true,
    async   : true,
    router  : "/player/:name/find",
    resolver: PlayerRouter.playerFind,
  },
  {
    name    : "Player/Stats",
    enabled : true,
    async   : true,
    router  : "/player/:name/stats",
    resolver: PlayerRouter.playerStats,
  },
  {
    name    : "Matches/List",
    enabled : true,
    async   : true,
    router  : "/matches/:name",
    resolver: MatchesRouter.latestMatches,
  },
  {
    name    : "Matches/Details",
    enabled : true,
    async   : true,
    router  : "/matches/:id/:region/details",
    resolver: MatchesRouter.details,
  },
  {
    name    : "Matches/Details",
    enabled : true,
    async   : true,
    router  : "/matches/:id/:region/telemetry",
    resolver: MatchesRouter.telemetry,

  },
  {
    name    : "Heroes/Stats/History",
    enabled : true,
    async   : true,
    router  : "/heroes/:region/:heroName/history",
    resolver: heroesHistory
  },
  {
    name    : "Heroes/Stats",
    enabled : true,
    async   : true,
    router  : "/heroes/:region/:heroName*?",
    resolver: heroesStats,
  },
  {
    name    : "Pro/History",
    enabled : true,
    async   : true,
    router  : "/pro/history",
    resolver: Pro.ProHistory,
  },
  {
    name    : "Leaderboard",
    enabled : true,
    async   : true,
    router  : "/leaderboard/:type/:region",
    resolver: leaderboard,
  }
];

routers.forEach((r) => {
  routes.get(r.router, async (req, res, next) => {
    try {
      await r.resolver(req, res, next);
    }
    catch(err) {
      const response = {
        routerName: r.name,
        routerUrl: r.router,
        args: req.params,
        queries: req.query,
      }

      console.warn("Error!", response, err);

      res.status(500).json({
        error: response
      });
    }
  })
})

/** Tournament Routers */
// routes.get("/tourney_entry/:region/:matchId",  Tournament.EntryRoute);
// routes.get("/tournament/global",               Tournament.AllStatsRoute);
// routes.get("/tournament/teams",                Tournament.TeamsRoute);
// routes.get("/tournament/last",                 Tournament.LastRoute);
// routes.get("/tournament/team/:region/:team",   Tournament.TeamRoute);
// routes.get("/tournament/list/teams",           Tournament.ListTeamsRoute);


export default routes;
