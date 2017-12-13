import Redis from "~/services/redis.js";

class Leaderboards {
    async vpr(table, max, min = 0) {
        return Redis.zrevrange(`vpr:${table}`, min, max, 'withscores');
    }

    async vst(table, max, min = 0) {
        return Redis.zrevrange(`vst:${table}`, min, max, 'withscores');
    }

    async heroes(table, max, min = 0) {
        return Redis.zrevrange(`heroes:${table}`, min, max, 'withscores');
    }
}

export default new Leaderboards();
