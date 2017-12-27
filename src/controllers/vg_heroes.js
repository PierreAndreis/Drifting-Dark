import HeroesModel from "../models/vg_heroes";

const allowedTypes = ["pickrate", "winrate", "banrate"];

class HeroesController {
  
  getStats(type, region) {
    if (!allowedTypes.includes(type)) return {errors: "Type not allowed."};
    return HeroesModel.getStats(type, region);
  }

}

export default new HeroesController();
