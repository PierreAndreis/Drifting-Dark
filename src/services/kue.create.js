import KueService from "./kue";
import MatchController from "../controllers/vg_matches";
import Pros from "../resources/pro";

// const PROS_PER_QUEUE = 10;
// const PROS_QUEUE_TIME = 60000 // 1 minute.
const PROS_QUEUE_TIME = 2000; // 2 seconds for development
// const PROS_LIMIT_HISTORY = 50;

const PRO_HISTORY = [];
let counter = 0;

const ProQueue = async () => {
  // const playersFetch = [];
  const lastMatch = new Date().toISOString(); // TODO: Make this the actual lastMatch from Redis
  const player = Pros[counter];
  if (player.id) {
    PRO_HISTORY.push(MatchController.getMatchesById(player.id, player.region, lastMatch, "prohistory")); // TODO: this makes it so lastMatch is createdEnd and not createdStart????
  } else {
    PRO_HISTORY.push(MatchController.getMatchesByName(player.name, player.region));
  }

  // store the result in the PRO_HISTORY limiting it 50 matches.
  // Add all the results, sort by createdAt then slice it to 50 matches

  // Don't worry about making the loop, we will deal with that later
  // Don't worry about KUE either, we worry about that later
  // Don't worry about redis either, we worry about that later. Pretend PRO_HISTORY is redis

  // Reset counter so it goes back to the first loop
  if (counter === Pros.length) counter = 0;

  // This will make it loop
  setTimeout(() => ProQueue(), PROS_QUEUE_TIME);
};

ProQueue(); // This is for testing so you can see on the consoleLog the result

export const createJob = (name, data) => { // TODO: Make this the default export
  const job = KueService.create(name, {
    title: name,
    ...data,
  });

  // if (priority) {
  //   job.priority(priority);
  // };
  // if (attempts) {
  //   job.attempts(attempts);
  // };
  job.removeOnComplete(true);
  job.save(err => console.warn(err));

  return job;
};


// KueService.process('lol', function(job, done){
//   console.log("result", job.data.text);
//   done();
// });
