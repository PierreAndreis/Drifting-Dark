import Showdown from "showdown";
import RedisCache   from "~/services/cache";

/* /wiki/:type/:section */
export const wiki = async (req, res, next) => {
  const { type, section } = req.params;
  const converter         = Showdown.Converter();
  const md                = await RedisCache.get(`${type}/${section}`);
  const reply             = await converter.makeHtml(md);
  res.json(reply);
};
