import Redis from "~/services/redis.js";

class Leaderboards {
  constructor(name) {
    this.name = name;
  }

  get(playerId) {
    return Redis.zrank(this.name, playerId);
  }

  set(playerId, score) {
    return Redis.zadd(this.name, score, playerId);
  }

  range(min, max) {
    return Redis.zrevrange(this.name, min, max);
  }
}

export default new Leaderboards();
