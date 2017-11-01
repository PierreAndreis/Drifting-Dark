import KueService from "./kue";
import MatchController from "../controllers/vg_matches";
import Pros from "../resources/pro";

const PROS_PER_QUEUE = 10;
// const PROS_QUEUE_TIME = 60000 // 1 minute.
const PROS_QUEUE_TIME = 2000; // 2 seconds for development
const PROS_LIMIT_HISTORY = 50;

const PRO_HISTORY = [];
let counter = 0;

const ProQueue = async () => {
  console.log('inside the queue')
  // const playersFetch = [];
  const player = Pros[counter];
  let oldest;
  // Create a date for the oldest match if none exists or else give it the value of the oldest match in the array
  if (PRO_HISTORY.length === 0) oldest = 1507913623000;
  else oldest = Date.parse(PRO_HISTORY[PRO_HISTORY.length - 1].createdAt);

  const matches = await MatchController.getMatchesByName(player.name);
  for (let i = 0; i < matches.length; i++) {
    // Turn the date into the ms number
    const matchTime = Date.parse(matches[i].createdAt);
    // If the createdAt is older then the oldest match in the array skip to next loop
    if (matchTime < oldest) continue;
    // Remove the oldest if 50 matches
    if (PRO_HISTORY.length === 50) PRO_HISTORY.pop();
    // Add this match to the beginning of the array
    PRO_HISTORY.unshift(matches[i]);
  }
  console.log(PRO_HISTORY)
  // After the loop resort everything.
  await PRO_HISTORY.sort((a, b) => {
    const date = new Date(a.players.createdAt);
    const now = new Date(b.players.createdAt);

    if (now > date) return 1;
    if (date < now) return -1;
    return 0;
  });

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
