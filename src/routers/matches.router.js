import MatchesController from '../controllers/vg_matches';

// matches/:name
export const latestMatches = async (req, res, next) => {
  const { name } = req.params;
  const reply = await MatchesController.getMatchesByName(name);
  res.json(reply);
};

// todo: loop to get more pages... get also at the same time another batch of 28 days before now
export const test = async (req, res, next) => {
  const { name } = req.params;
  const reply = await MatchesController.getAllPages(name);
  res.json(reply);
};

