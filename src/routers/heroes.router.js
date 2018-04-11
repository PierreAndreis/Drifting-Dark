import HeroesController      from "~/controllers/vg_heroes";

// heroes/:region/:heroName? | list
export const heroesStats = async (req, res, next) => {
  const { heroName, region } = req.params;
  let reply = await HeroesController.byName(heroName, region);
  res.json(reply);
};

// heroes/:type/:heroName/history?mode=&limit=
export const heroesHistory = async (req, res, next) => {
  const { heroName, region } = req.params;
  const { limit, mode }= req.query;
  let reply = await HeroesController.getHistory(heroName, region, {limit, mode});
  res.json(reply);
};
