import PlayerController from "~/controllers/vg_player";
import HeroesModel      from "~/models/vg_heroes";

 /** /player/:name/find */
export const playerFind = async (req, res, next) => {
  const {name} = req.params;
  const reply = await PlayerController.lookupName(name);
  res.json(reply);
}

 /** /player/:name/stats ?gameMode=&season= */
export const playerStats = async (req, res, next) => {
  const {name} = req.params;
  const opts = req.query
  const reply = await PlayerController.getStats(name, opts);
  // const reply = await HeroesModel.games();
  res.json(reply);
}