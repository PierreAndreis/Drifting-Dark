import express      from "express";
import path         from "path";
import morgan       from "morgan";
import helmet       from "helmet";
import bodyParser   from "body-parser";
import responseTime from "response-time";
import logger       from "~/lib/logger"

import Cors         from "cors";     // Cross Request

import routes     from "~/routes";

const app = express();

app.use(morgan('combined'))

app.disable("x-powered-by");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(Cors());
// Security Headers
app.use(helmet());

// Add ResponseTime Header
app.use(responseTime())

// Routes
app.use("/", routes);

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  const err  = new Error("Not Found");
  err.status = 404;
  next(err);
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}, message: ${req.originalUrl}`);
  res
    .status(err.status || 500)
    .send({Error: err.message});
});

process.on('unhandledRejection', (reason, p) => {
  // console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  logger.error(`Unhandled Rejection. Reason: ${reason}. Stack: ${JSON.stringify(reason.stack)}`);
  // application specific logging, throwing an error, or other logic here
});


export default app;
