import allPros from '../resources/vg8_teams/teams_autumn_1';
import matches from './vg_matches';
import kue from 'kue';
import cluster from 'cluster';
import CacheService from "../services/cache";

// Run a loop depending on how many teams there are
const players = {};
for (let i = 0; i < teams_autumn_1.length; i++) {
  // For each player in the team add their playerID and region to players
  players[i].id = await PlayerController.lookupName(teams_autumn_1[i].players.name);
  players[i].region = teams_autumn_1[i].players.region;
}

const clusterWorkerSize = require('os').cpus().length;

const queue = kue.createQueue();

// Creates a queue called prohistory
const job = queue.create('prohistory', {
    // Gives it the data from the players object above. Can we make this for loop in teams_autumn page and just simply pull 1 variable from there and remove the logic from this file?
  allPlayers: players,
})
    // priority in queue
  .priority('normal')
  // error handler
  .on('error', (err) => {
    // TODO: Add to the end of the queue
    console.log(err);
  })
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
  queue.process('prohistory', 10, (job, done) => {
    if (!getProsHistory(job.data)) {
      return done(new Error('4ever messed up not Skillz. Everyone blame 4ever :)'));
      // TODO: Remove from queue then add to end of queue, log error
    }
    // TODO: Store data
    // TODO: remove from queue
    done();
  });
}


function getProsHistory() {
  // TODO: call the matches
}
