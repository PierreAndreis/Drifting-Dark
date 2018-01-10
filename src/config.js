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
    HOSTNAME: process.env.REDIS_SERVER || "localhost",
    KUEHOSTNAME: process.env.REDIS_SERVER || "localhost",
    PREFIX: "vgpro",
  },

  VAINGLORY: {
    API_KEY: process.env.API_KEY || "",
    SETUP_CONFIG: {
      region: "na",
    },
    DEFAULT_OPTION: {
      sort: "-createdAt",
    },
    REGIONS: ["na", "sa", "eu", "ea", "sg", "cn"],
    RESPONSES: {
      REPLY_404_MSG: "The specified object could not be found.",
      REPLY_429_MSG: "Request rate limited. Free for non-commercial use for up to 10 requests per minute! To increase your rate limit, please contact api@superevilmegacorp.com"
    }
  },

  CACHE: {
    PREFIXES: {
      PLAYERNAME: "playerName",
    },

    API_PLAYERSTATS_CACHE:      minutes(10),

    REDIS_LOOKUP_CACHE_EXPIRE:  days(2),
    REDIS_LOOKUP_MISS_CACHE_EXPIRE: minutes(5),

    REDIS_MATCHES_CACHE_EXPIRE: minutes(10),
    REDIS_LEADERBOARD_CACHE_EXPIRE: minutes(20),
  }

}