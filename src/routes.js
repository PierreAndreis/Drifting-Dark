import { Router } from "express"; // WebServer

import { playerFind, playerStats }         from "./routers/players.router";
import { latestMatches, test, ProHistory, details } from "./routers/matches.router";
import { vpr } from "./routers/leaderboards.router";

// import * as Tournament from "./routers/tournament.router";

const routes = Router();

/** PlayerLookup Routers */
routes.get("/player/:name/find", playerFind);

/** PlayerLookup Routers ?gameMode=&season= */
routes.get("/player/:name/stats", playerStats);

/** Matches Routers ?page=&gameMode[]= */
routes.get("/matches/:name", latestMatches);

routes.get("/matches/:id/:region/details", details);

/** Matches Routers */
routes.get("/test/:name", test);

routes.get("/pro/history", ProHistory);

/* Leaderboards Routers */
routes.get("/leaderboards/:type/:region", vpr);

/** Tournament Routers */
// routes.get("/tourney_entry/:region/:matchId",  Tournament.EntryRoute);
// routes.get("/tournament/global",               Tournament.AllStatsRoute);
// routes.get("/tournament/teams",                Tournament.TeamsRoute);
// routes.get("/tournament/last",                 Tournament.LastRoute);
// routes.get("/tournament/team/:region/:team",   Tournament.TeamRoute);
// routes.get("/tournament/list/teams",           Tournament.ListTeamsRoute);


export default routes;
