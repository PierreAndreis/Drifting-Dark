const minutes = (minutes) => (60 * minutes);
const hours   = (hours)   => (minutes(60) * hours);
const days    = (day)     => (hours(24) * day);

export default {

  COUCHBASE: {
    HOST:     process.env.COUCHBASE_HOST     || "couchbase://127.0.0.1:8091",
    USERNAME: process.env.COUCHBASE_USERNAME || "Administrator",
    PASSWORD: process.env.COUCHBASE_PASSWORD || "",
  },

  REDIS: {
    PORT: 6379,
    HOSTNAME: "localhost",
    KUEHOSTNAME: "localhost",
    PREFIX: "vgpro",
  },

  VAINGLORY: {
    API_KEY: process.env.API_KEY || "",
    SEASONS: {
      spring07: ["2.2", "2.3", "2.4", "2.5"],
      summer07: ["2.6", "2.7"],
      autumn07: ["2.8", "2.9"],
    },
    PATCH_DATES: {
      "2.2": "02 28 2017",
      "2.3": "03 28 2017",
      "2.4": "04 24 2017",
      "2.5": "05 30 2017",
      "2.6": "06 20 2017",
      "2.7": "08 08 2017",
      "2.8": "09 05 2017",
      "2.9": "10 11 2017",
    },
    SETUP_CONFIG: {
      region: "na",
    },
    DEFAULT_OPTION: {
      sort: "-createdAt",
    },
    REGIONS: ["na", "sa", "eu", "ea", "sg", "cn"],
    RESPONSES: {
      REPLY_404_MSG: "The specified object could not be found."
    }
  },

  CACHE: {
    PREFIXES: {
      PLAYERNAME: "playerName",
    },

    API_PLAYERSTATS_CACHE:      minutes(10),
    REDIS_LOOKUP_CACHE_EXPIRE:  days(2),
    REDIS_MATCHES_CACHE_EXPIRE: minutes(10),
  }

}