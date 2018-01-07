import { Router } from "express"; // WebServer

import { playerFind, playerStats }         from "./routers/players.router";
import { latestMatches, test, ProHistory, details, telemetry } from "./routers/matches.router";
import { leaderboard } from "./routers/leaderboards.router";
import { heroesStats } from "./routers/heroes.router";

// import * as Tournament from "./routers/tournament.router";

const routes = Router();

/** PlayerLookup Routers */
routes.get("/player/:name/find", playerFind);

/** PlayerLookup Routers ?gameMode=&season= */
routes.get("/player/:name/stats", playerStats);

/** Matches Routers ?page=&gameMode[]= */
routes.get("/matches/:name", latestMatches);

routes.get("/matches/:id/:region/details", details);

routes.get("/matches/:id/:region/telemetry", telemetry);

/** Heroes Stats Routers */
routes.get("/heroes/:type/:region", heroesStats);

/** Pro Routers */
routes.get("/pro/history", ProHistory);

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
