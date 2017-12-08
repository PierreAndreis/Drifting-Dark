import math         from "mathjs";
import moment       from "moment";
import * as lodash  from "lodash";

function formatFixed(value, num = 2) {
  return math.format(value, {notation: 'fixed', precision: num});
}

/**
 * Calculate KDA based on given stats
 * @param {float} kills
 * @param {float} deaths
 * @param {float} assists
 */
function getKDA(kills, deaths, assists) {

  // We will return kills + assists if there are no deaths (otherwise it would return 0 as kda)
  let res = 0;
  
  if (deaths > 0) res = (kills + assists) / deaths;
  else res = kills + assists;

  return parseFloat(formatFixed(res, 2));

};

/**
 * Calculate Winrate/Pickrate based on given stats
 * @param {float} wins
 * @param {float} games
 */
function getRate(wins, games, divider = 100) {
  let res = math.round(math.eval(`${wins} / ${games}`) * divider, 1);
  if (lodash.isNaN(res)) res = 0;
  return res + "%";

}

function getAvg(value, total, time = false, precision = 2) {

  if (total == 0) return (time) ? "00:00" : "0.00";

  value = value / total;
  
  const formatted = (time) ? moment.utc(value*1000).format("mm:ss") : parseFloat(formatFixed(value, precision));


  return formatted;

}


export {
  getKDA,
  getRate,
  getAvg
}