import kue from "kue";
import Redis from "ioredis";
import lodash from "lodash";

const KUE_SHUTDOWN_TIME_MS = 2000;

const REDIS = {
  PORT: 6379,
  KUE_HOST: "localhost"
};

const q = kue.createQueue({
  redis: {
    // kue makes 2 instances
    // http://stackoverflow.com/questions/30944960/kue-worker-with-with-createclientfactory-only-subscriber-commands-may-be-used
    createClientFactory: function() {
      return new Redis({
        port: REDIS.PORT,
        host: REDIS.KUE_HOST
      });
    }
  }
});

q.on('error', function(err) {
  return console.log(err);
});

process.once('SIGTERM', function(sig) {
  return q.shutdown(KUE_SHUTDOWN_TIME_MS, function(err) {
    console.log('Kue shutdown: ', err || '');
    return process.exit(0);
  });
});

export default q;
