import app from "src/app";

const {PORT = 8080} = process.env;

app.listen(PORT, () => console.log(`Listening on port ${PORT}`)); // eslint-disable-line no-console
