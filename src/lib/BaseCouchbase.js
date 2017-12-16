class CouchbaseModel {

  constructor(conn) {
    this.conn = conn;
  }

  find(query) {
    return this.conn.find(query);
  }

  query(query) {
    return this.conn.nquery(query);
  }

  getAndLock(key) {
    return this.conn.getAndLock(key);
  }

  upsert(key, doc, options) {
    if (!key) 
      throw new Error('Missing id parametter');
    if (!doc) 
      throw new Error('Missing doc parametter');
    
    return this.conn.upsert(key, doc, options);
  }
}

export default CouchbaseModel;