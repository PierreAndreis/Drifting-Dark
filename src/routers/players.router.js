import PlayerController from "src/controllers/vg_player";

/**
 * todo:
 * 1- quick lookup. Store it in redis with expiry
 * 2- tbd
 */

 /** /playerFind/:name */
export const playerFind = async (req, res, next) => {
  const {name} = req.params;
  const reply = await PlayerController.lookupName(name);
  res.json(reply);
}

export const playerStats = async (req, res, next) => {
  const {name} = req.params;
  const reply = await PlayerController.getStats(name);
  res.json(reply);
}