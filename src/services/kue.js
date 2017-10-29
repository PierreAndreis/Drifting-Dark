import kue from "kue";
import Redis from "ioredis";
import lodash from "lodash";
import cache from "./cache";
import cluster from 'cluster';
import allPros from '../resources/vg8_teams/teams_autumn_1';
import matches from '../models/vg_matches';
import PlayerController from "../controllers/vg_player";

const KUE_SHUTDOWN_TIME_MS = 2000;
const clusterWorkerSize = require('os').cpus().length;

const REDIS = {
  PORT: 6379,
  KUE_HOST: "localhost"
};

// Run a loop depending on how many teams there are
const players = {};
for (let i = 0; i < allPros.length; i++) {
  // For each player in the team add their playerID and region to players
  players[i].id = PlayerController.lookupName(allPros[i].players.name);
}

const q = kue.createQueue({
  redis: {
    // kue makes 2 instances
    // http://stackoverflow.com/questions/30944960/kue-worker-with-with-createclientfactory-only-subscriber-commands-may-be-used
    createClientFactory: function () {
      return new Redis({
        port: REDIS.PORT,
        host: REDIS.KUE_HOST
      });
    }
  }
});

q.on('error', (err) => {
  return console.log(err);
});

process.once('SIGTERM', (sig) => {
  return q.shutdown(KUE_SHUTDOWN_TIME_MS, function (err) {
    console.log('Kue shutdown: ', err || '');
    return process.exit(0);
  });
});

// Creates a queue called prohistory
const job = q.create('prohistory', {
  allPlayers: "allPros" // TODO: Get Data from redis queue list. Create a queue list in redis
})
  // priority in queue
  .priority('normal')
  // Check for stuck jobs
  .watchStuckJobs(5000)
  .active((err, ids) => {
    ids.forEach((id) => {
      kue.Job.get(id, (err, job) => {
      // Your application should check if job is a stuck one
        job.inactive();
      });
    });
  })
  // if it complete remove from queue
  .removeOnComplete(true)
  .save((err) => {
    if (err) console.log(err);
    else console.log(job.id);
  });

if (cluster.isMaster) {
  kue.app.listen(3000);
  for (let i = 0; i < clusterWorkerSize; i++) {
    cluster.fork();
  }
} else {
  q.process('prohistory', 10, (job, done) => {
    const allPlayers = job.data; // job.data declared above from redis queue
    // Calls the player matches AND stores in redis
    const prosData = matches.getMatches(allPlayers.playerID, allPlayers.region, allPlayers.lastMatch); // TODO:(NOT DONE) Figure out how to give it the correct ID, REGION, Date for each time the queue runs. Exmaple player[0].id, second queue uses player[1].id
    if (!prosData) {
      // TODO: Add to end of queue
      return done(new Error('4ever messed up not Skillz. Everyone blame 4ever :)'));
    }
    console.log(``);
    done();
  });
  // If the queue gets over 1 thousand send an alert
  q.inactiveCount((err, total) => {
    if (total > 100) {
      console.log('The Queue is getting over 100, something is wrong.');
    }
  });
}

export default q;
