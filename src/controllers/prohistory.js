import CacheService     from "~/services/cache";

class ProHistory {
  constructor() {
    this.key = "prohistory";
  }

  get() {
    return CacheService.get(this.key) || [];
  }

  set(value) {
    return CacheService.set(this.key, value);
  }
}

export default new ProHistory();