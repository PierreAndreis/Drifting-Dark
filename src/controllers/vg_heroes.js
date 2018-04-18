import HeroesModel from "../models/vg_heroes";

class HeroesController {
  async byName(heroName, region) {
    if (!heroName) return await HeroesModel.getStats("list", region);
    return await HeroesModel.getHeroStats(heroName, region);
  }

  getHistory(heroName, region, {limit = 5, mode = "patch"}) {
    // Max: 20
    // Min: 2
    limit = Math.min(20, limit);
    limit = Math.max(2, limit);
    if (mode === "date") return HeroesModel.getHistoricalByDate(heroName, region, limit);
    else return HeroesModel.getHistoricalByPatch(heroName, region, limit);
  }
}

export default new HeroesController();
