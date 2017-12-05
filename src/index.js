import app from "~/app";
import logger from "~/lib/logger";

const {PORT = 8080} = process.env;

app.listen(PORT, () => logger.info(`Listening on port ${PORT}`));
