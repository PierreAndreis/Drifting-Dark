import cluster from "cluster";
import cron from "node-cron";

import logger from "./lib/logger";

import ProHistory from "~/services/prohistory";
import HeroesStats from "~/services/heroes";

//  # ┌────────────── second (optional)
//  # │ ┌──────────── minute
//  # │ │ ┌────────── hour
//  # │ │ │ ┌──────── day of month
//  # │ │ │ │ ┌────── month
//  # │ │ │ │ │ ┌──── day of week
//  # │ │ │ │ │ │
//  # │ │ │ │ │ │
//  # * * * * * *
const everyMinute = (minute) => `*/${minute} * * * *`;
const everyHour   = (hour)   => `* */${hour} * * *`;
const everyDay    = (day)    => `* * */${day} * *`;

const crons = [
  {
    name: "Pro History",
    interval: everyMinute(1),
    fn: ProHistory,
  },
  {
    name: "HeroStats - Digest",
    interval: everyMinute(5),
    fn: () => HeroesStats.processMatches(),
  },
  {
    name: "HeroStats - Save",
    interval: everyHour(1),
    fn: () => HeroesStats.saveMatches(),
  }
]

if (cluster.isMaster) {


  crons.forEach(c => cron.schedule(c.interval, () => {
    logger.info(`${c.name} is running`);
    c.fn()
  }));
}