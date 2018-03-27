import HeroesController      from "~/controllers/vg_heroes";

// heroes/:type/:region
export const heroesStats = async (req, res, next) => {
  const { heroName, region } = req.params;
  let reply = await HeroesController.byName(heroName, region);
  res.json(reply);
};