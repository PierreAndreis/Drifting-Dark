import couchbase from 'couchbase-promises';
import Config from '../config';

const cluster = new couchbase.Cluster(`couchbase://${Config.COUCHBASE.HOST}:${Config.COUCHBASE.PORT}`);

class CouchBase {
  constructor(bucket) {
    this.bucket = cluster.openBucket(bucket, Config.COUCHBASE.PASSWORD);
    this.query = couchbase.N1qlQuery;
  }

  async nquery(query) {
    try {
      console.log('** QUERYING FROM DATABASE **');

      //  Passing a new query as argument
      const queryBuilder = this.query.fromString(query);
      const [result, meta] = await this.bucket.queryAsync(queryBuilder);

      return result;
    } catch (e) {
      console.log(e);
      throw new Error(e);
    }
  }

  async upsert(name, doc) {
    try {
      // console.log(`** TRYING TO INSERT ${name} DOCUMENT **`);
      //  Trying to insert into the bucket
      const rows = await this.bucket.upsertAsync(name, doc);
      // console.log(`** DONE INSERTING ${name} **`);
      return rows;
    } catch (e) {
      console.log(e);
      throw new Error(e);
    }
  }

  async find(query) {
    try {
      // console.log(`** DB SEARCH ${query} **`);

      const res = await this.bucket.getAsync(query);

      return res.value;
    } catch (e) {
      return undefined;
    }
  }
}

export default CouchBase;
