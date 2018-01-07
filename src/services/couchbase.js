import c       from "couchbase";
import Promise from "bluebird";

import Config from "~/config";

const couchbase = Promise.promisifyAll(c);

const cluster = new couchbase.Cluster(Config.COUCHBASE.HOST);

// cluster.authenticate(Config.COUCHBASE.USERNAME, Config.COUCHBASE.PASSWORD);

class CouchBase {

  constructor(bucket) {
    this.bucket   = cluster.openBucket(bucket, Config.COUCHBASE.PASSWORD);
    this.query    = couchbase.N1qlQuery;
  }

  async nquery(query) {

    try {
      // console.log("** QUERYING FROM DATABASE **");

      //  Passing a new query as argument
      const query_builder  = this.query.fromString(query);
      const [result, meta] = await new Promise((resolve, reject) => {
        const req = this.bucket.query(query_builder);
        let res = [];
        req.on('row', function(row) {
          res.push(row);
        });
        req.on('error', function(err) {
          reject(err);
        });
        req.on('end', function(meta) {
          resolve([res, meta]);
        });
      });
      // TODO: something with meta
      return result;

    }
    catch (e) {
      console.log(e);
      throw new Error(e);
    }
  }

  async upsert(name, doc, options = {}) {
    try {
      const rows = await this.bucket.upsertAsync(name, doc, options);
      return rows;

    }
    catch (e) {
      if (e.message === "bad cas passed") return false;
      console.log(`ERROR WHILE INSERTING ${name}=`, e.message, {args: arguments});
      return e.message;
    }
  }

  async find(query) {

    try {

      let res;
      if (typeof query === "object") res = await this.bucket.getMultiAsync(query);
      else res = await this.bucket.getAsync(query);

      return res.value ? res.value : res;

    }
    catch (e) {
      if (e.code !== 13) console.warn(e);
      return undefined;
    }
  }

  getAndLock(key) {
    return this.bucket.getAndLockAsync(key, {lockTime: 20}).catch(err => {
      if (err.message === "The key does not exist on the server") return [];
      else {
        console.log(err);
        return false;
      }
    });
  }
}

export default CouchBase;
