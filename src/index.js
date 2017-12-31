import cluster from "cluster";
import os      from "os";

import app from "~/app";
import crons from "~/crons";
import logger from "~/lib/logger";

const numCPUs = os.cpus().length;

const {PORT = 8080} = process.env;


const startApp = () => {
  return app.listen(PORT, () => {
    logger.info(`Worker ${process.pid} is listening on port ${PORT}`)
  });
}

if (true || process.env.NODE_ENV !== "production") {
  startApp();
}
else {

  // We should use cluster only for production
  if (cluster.isMaster) {
    logger.info(`Master ${process.pid} is running and will set up ${numCPUs} workers...`);
    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on('exit', function(worker, code, signal) {
        logger.warn(`Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`);
        logger.info('Starting a new worker');
        cluster.fork();
    });

  } else {
    // Workers can share any TCP connection
    startApp();

  }
}
