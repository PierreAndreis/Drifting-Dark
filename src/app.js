import express      from "express";
import path         from "path";
import helmet       from "helmet";
import bodyParser   from "body-parser";
import datadog      from "connect-datadog";
// import morgan       from "morgan";

import logger       from "~/lib/logger"
import Cors         from "cors";     // Cross Request

import routes     from "~/routes";

const app = express();

const dd_options = {
  'response_code': true,
  'tags': ['app:my_app']
}


app.disable("x-powered-by");
app.enable('trust proxy');
app.set('trust proxy', () => { return true; });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(Cors());
// Security Headers
app.use(helmet());

// app.use(morgan(':remote-addr - :method :url :status - :response-time ms'))

// Datadog
app.use(datadog(dd_options));

app.use("/", (req, res, next) => {
  if (req.headers && req.headers["user-agent"] && req.headers["user-agent"].includes("bot")) {
    logger.warn(`Blocked ${req.ip}. Headers: ${req.headers}`);
    res.status(403).send(
      "Sorry, not allowed headerless or bots"
    );
    return;
  }
  next();
})

// Routes
app.use("/", routes);

app.get("/", (req, res) => {
  res.status(200).send(
    "PONG"
  );
})

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
  // console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);c
  logger.error(`Unhandled Rejection. Reason: ${reason}. Stack: ${JSON.stringify(reason.stack)}`);
  // application specific logging, throwing an error, or other logic here
});


export default app;
