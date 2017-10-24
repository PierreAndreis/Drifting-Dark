/**
 *  MadGlory API KEY
 *
 * @return {string}
 */
const APIKEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiJhYjFmYWYyMC01YzFkLTAxMzUtOTE3NS02Mjc3YWFkYjY5Y2QiLCJpc3MiOiJnYW1lbG9ja2VyIiwiaWF0IjoxNTAxOTQ1NjI2LCJwdWIiOiJzZW1jIiwidGl0bGUiOiJ2YWluZ2xvcnkiLCJhcHAiOiJiYjA2YmQ4MC1kZGQ5LTAxMzQtOTNmZi0wMjQyYWMxMTAwMDUiLCJzY29wZSI6ImNvbW11bml0eSIsImxpbWl0Ijo0MDB9.2fyZssgE2VKLjeKZ8vuUyfUrMdglqaaMZ4t8WRjqlSM";

/**
 * Current season in Vainglory
 *
 */
const SEASON = "spring07";

const minutes = (minutes) => (60 * minutes);
const hours   = (hours)   => (minutes(60) * hours);
const days    = (day)     => (hours(24) * day);

export default {

  COUCHBASE: {
    HOST: "localhost",
    PORT: 8091,
    PASSWORD: "vgpro2017@@"
  },

  REDIS: {
    PORT: 6379,
    HOSTNAME: "localhost",
    KUEHOSTNAME: "localhost",
    PREFIX: "vgpro",
  },

  VAINGLORY: {
    API_KEY: APIKEY,
    SEASONS: {
      spring07: ["2.2", "2.3", "2.4", "2.5"],
      summer07: ["2.6", "2.7"],
      autumn07: ["2.8", "2.9"],
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

    API_MATCHES_CACHE_TIME: minutes(5),
    REDIS_LOOKUP_CACHE_EXPIRE: days(2),
  }

}