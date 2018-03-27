import HeroesModel from "../models/vg_heroes";

class HeroesController {
  async byName(heroName, region) {
    if (!heroName) return await HeroesModel.getStats("list", region);

    return await HeroesModel.getHeroStats(heroName, region);
  }
}

export default new HeroesController();
