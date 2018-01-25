import { Router } from "express";

import * as PlayerRouter  from "./routers/players.router";
import * as MatchesRouter from "./routers/matches.router";
import { leaderboard }    from "./routers/leaderboards.router";
import { heroesStats }    from "./routers/heroes.router";

import * as Pro from "./routers/pro.router";

// import * as Tournament from "./routers/tournament.router";

const routes = Router();

/** PlayerLookup Routers */
routes.get("/player/:name/find", PlayerRouter.playerFind);

/** PlayerLookup Routers ?gameMode=&season= */
routes.get("/player/:name/stats", PlayerRouter.playerStats);

/** Matches Routers ?page=&gameMode[]=&limit=&patch[]= */
routes.get("/matches/:name", MatchesRouter.latestMatches);

routes.get("/matches/:id/:region/details", MatchesRouter.details);

routes.get("/matches/:id/:region/telemetry", MatchesRouter.telemetry);

/** Heroes Stats Routers */
routes.get("/heroes/:type/:region", heroesStats);

/** Pro Routers */
routes.get("/pro/history", Pro.ProHistory);

/* Leaderboards Routers */
routes.get("/leaderboard/:type/:region", leaderboard);

/** Tournament Routers */
// routes.get("/tourney_entry/:region/:matchId",  Tournament.EntryRoute);
// routes.get("/tournament/global",               Tournament.AllStatsRoute);
// routes.get("/tournament/teams",                Tournament.TeamsRoute);
// routes.get("/tournament/last",                 Tournament.LastRoute);
// routes.get("/tournament/team/:region/:team",   Tournament.TeamRoute);
// routes.get("/tournament/list/teams",           Tournament.ListTeamsRoute);


export default routes;
