import { Router } from 'express'; // WebServer

import { playerFind, playerStats } from './routers/players.router';
import { latestMatches, test } from './routers/matches.router';
import * as Tournament from './routers/tournament.router';

const routes = Router();

/** PlayerLookup Routers */
routes.get('/player/:name/find', playerFind);

/** PlayerLookup Routers */
routes.get('/player/:name/stats', playerStats);

/** Matches Routers */
routes.get('/matches/:name', latestMatches);

/** Matches Routers */
routes.get('/test/:name', test);

/** Tournament Routers */
// routes.get("/tourney_entry/:region/:matchId",  Tournament.EntryRoute);
// routes.get("/tournament/global",               Tournament.AllStatsRoute);
// routes.get("/tournament/teams",                Tournament.TeamsRoute);
// routes.get("/tournament/last",                 Tournament.LastRoute);
// routes.get("/tournament/team/:region/:team",   Tournament.TeamRoute);
// routes.get("/tournament/list/teams",           Tournament.ListTeamsRoute);


export default routes;
