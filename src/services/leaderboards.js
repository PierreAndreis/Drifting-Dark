import Redis from "~/services/redis.js";

const key = "VGPRO:Leaderboard";

class Leaderboards {
  constructor(type, region) {
    this.name = `${key}:${type}:${region}`;
  }
  get(playerId) {
    return Redis.zrevrank(this.name, playerId);
  }
  set(playerId, score) {
    return Redis.zadd(this.name, score, playerId);
  }
  range(start, end) {
    return Redis.zrevrange(this.name, start, end, "withscores");
  }

  async updateAndGet(playerId, score) {
    const res = await this.set(playerId, score);
    return await this.get(playerId) + 1;
  }
};

export default Leaderboards;
