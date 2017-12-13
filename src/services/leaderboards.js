import Redis from "~/services/redis.js";

class Leaderboards {
    vpr(region, max, min = 0) {
        return Redis.zrevrange(`vpr:${region}`, min, max, 'withscores');
    }

    vst(region, max, min = 0) {
        return Redis.zrevrange(`vst:${region}`, min, max, 'withscores');
    }

    heroes(region, max, min = 0) {
        return Redis.zrevrange(`heroes:${region}`, min, max, 'withscores');
    }
}

export default new Leaderboards();
