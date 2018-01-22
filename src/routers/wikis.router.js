import Showdown from "showdown";

/* /wiki/:type/:section */
export const wiki = async (req, res, next) => {
  const { type, section } = req.params;
  const converter         = Showdown.Converter();
  const md                = ''; // todo: get the md file
  const reply = await converter.makeHtml(md);
  res.json(reply);
};
