import { StatsD } from "node-dogstatsd";
import logger from "./logger";

const dogstatsd = new StatsD("localhost", 8125);

const Analysis = {
  increment(key, tags) {
    return dogstatsd.increment(key, tags);
  },

  incrementBy(key, value, tags) {
    return dogstatsd.incrementBy(key, value, tags);
  },

  decrement(key, tags) {
    return dogstatsd.decrement(key, tags);
  },

  decrementBy(key, value, tags) {
    return dogstatsd.decrementBy(key, value, tags);
  },

  timing(key, time, tags) {
    return dogstatsd.timing(key, time, tags);
  }
};

// dogstatsd.socket.on('error', function (exception) {
//    return logger.warn("error event in socket.send(): " + exception);
// });

export default Analysis;
