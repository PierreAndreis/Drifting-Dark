import ProHistoryController from "~/controllers/prohistory";

// pro/history
export const ProHistory = async (req, res, next) => {
  const reply = await ProHistoryController.get();
  res.json(reply);
};