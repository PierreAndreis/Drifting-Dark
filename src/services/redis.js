import Redis from "ioredis";
import lodash from "lodash";
import logger from "~/lib/logger";

import Config from "~/config";

const client = new Redis({
  port: Config.REDIS.PORT,
  host: Config.REDIS.HOSTNAME
});

const events = ['connect', 'ready', 'error', 'close', 'reconnecting', 'end'];

lodash.map(events, (event) => {
  return client.on(event, ()  => logger.info(`redislog ${event}`));
});

export default client;
