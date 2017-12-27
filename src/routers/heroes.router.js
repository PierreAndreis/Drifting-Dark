import HeroesController      from "~/controllers/vg_heroes";

// heroes/:type/:region
export const heroesStats = async (req, res, next) => {
  const { type, region } = req.params;
  const reply = await HeroesController.getStats(type, region);
  res.json(reply);
};