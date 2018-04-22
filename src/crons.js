import cluster from "cluster";
import {performance} from "perf_hooks";
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
    interval: everyMinute(1),
    fn: () => HeroesStats.processMatches(),
  },
  {
    name: "HeroStats - Save",
    interval: everyMinute(1),
    fn: () => HeroesStats.saveMatches(),
  },
  {
    name: "HeroStats - List Cache Generate",
    interval: everyMinute(5),
    fn: () => HeroesStats.cacheStats(),
  }
];

if (cluster.isMaster) {
 crons.forEach(c => cron.schedule(c.interval, async () => {
   logger.verbose(`${c.name} is running`);
   const t0 = performance.now();
   await c.fn();
   const result = performance.now() - t0;
   logger.verbose(`${c.name} is done in ${result.toFixed(0)}ms`)
 }));
}
