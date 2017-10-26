
// import Tournament from 'src/api/vgpro/matches_tournament';
// import VGPROTournament from 'src/api/vgpro/tournament';
// import MatchesTournament from 'src/api/vgpro/matches_tournament';
// import VGPROVG8 from 'src/api/vgpro/vg8';


// const tournament = new VGPROVG8();

// export const EntryRoute = async (req, res, next) => {
//   try {
//     const tournament = new VGPROTournament(req.params.matchId, req.params.region);
//     const show = await tournament.init();

//     res.json(show);
//   } catch (e) {
//     console.log(e.message);
//     next(e);
//   }
// };

// export const AllStatsRoute = async (req, res, next) => {
//   try {
//     const season = req.query.season;

//     const show = await tournament.calculateGlobalStats(season);

//     res.json(show);
//   } catch (e) {
//     console.log(e.message);
//     next(e);
//   }
// };

// export const TeamsRoute = async (req, res, next) => {
//   try {
//     const season = req.query.season;

//     const show = await tournament.calculateAllTeams(season);

//     res.json(show);
//   } catch (e) {
//     console.log(e.message);
//     next(e);
//   }
// };

// export const LastRoute = async (req, res, next) => {
//   try {
//     const show = await tournament.getLast();

//     res.json(show);
//   } catch (e) {
//     console.log(e.message);
//     next(e);
//   }
// };

// export const TeamRoute = async (req, res, next) => {
//   try {
//     const show = await tournament.calculateTeamStats(req.params.team, req.params.region);

//     res.json(show);
//   } catch (e) {
//     console.log(e.message);
//     next(e);
//   }
// };

// export const ListTeamsRoute = async (req, res, next) => {
//   try {
//     const season = req.query.season;

//     const show = await tournament.listTeams(season);

//     res.json(show);
//   } catch (e) {
//     console.log(e.message);
//     next(e);
//   }
// };
