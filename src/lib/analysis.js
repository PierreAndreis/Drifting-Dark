import { StatsD } from "node-dogstatsd";
import logger     from "./logger";

const dogstatsd = new StatsD();

const Analysis = {
  increment(key) {
    return dogstatsd.increment(key);
  },

  incrementBy(key, value) {
    return dogstatsd.incrementBy(key, value)
  },

  decrement(key) {
    return dogstatsd.decrement(key);
  },

  decrementBy(key, value) {
    return dogstatsd.decrementBy(key, value);
  },

  timing(key, time) {
    return dogstatsd.timing(key, time);
  }

}

dogstatsd.socket.on('error', function (exception) {
   return logger.warn("error event in socket.send(): " + exception);
});

export default Analysis;