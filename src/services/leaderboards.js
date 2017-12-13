import Redis from "~/services/redis.js";

class Leaderboards {
    async vpr(table, region, max, min = 0) {
        return Redis.zrevrange(`vpr:${region}`, min, max, 'withscores');
    }

    async vst(table, region, max, min = 0) {
        return Redis.zrevrange(`vst:${region}`, min, max, 'withscores');
    }

    async heroes(table, region, max, min = 0) {
        return Redis.zrevrange(`heroes:${region}`, min, max, 'withscores');
    }
}

export default new Leaderboards();
