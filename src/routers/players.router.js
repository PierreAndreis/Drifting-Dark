import PlayerController from "~/controllers/vg_player";

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