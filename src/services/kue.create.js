import KueService from "./kue";

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
