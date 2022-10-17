class wrappedPromise {
  constructor(promise) {
    this.rejectPromise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
    this.oldPromise = promise;
    this.newPromise = Promise.race([this.rejectPromise, promise])
  }

  resolve(v) {
    this.resolve(v)
  }

  reject(v) {
    this.reject(v)
  }
}

class PromiseManager {
  constructor() {
    this.db = new Map();
  }

  emplace(event) {
    return this.add(event, new Promise(() => {}));
  }

  add(event, promise) {
    if (this.db.has(event)) {
      throw new Error(`Event ${event} already exists`);
    }
    const wrapped = new wrappedPromise(promise);
    this.db.set(event, wrapped);
    return wrapped.newPromise;
  }

  wrap(promise) {
    const wrapped = new wrappedPromise(promise);
    const key = [...Array(30)].map(() => Math.random().toString(36)[2]).join('');
    this.db.set(key, wrapped);
    return wrapped.newPromise;
  }

  _get(event) {
    if (!this.db.has(event)) {
      throw new Error(`Event ${event} does not exist`);
    }
    return this.db.get(event);
  }

  waitFor(event) {
    return this._get(event).newPromise;
  }

  resolve(event, data) {
    this._get(event).resolve(data);
  }

  reject(event, data) {
    this._get(event).reject(data);
  }

  rejectAll(data) {
    for (const [event, wrapped] of this.db) {
      wrapped.reject(data);
    }
  }
}

const pm = new PromiseManager();

module.exports = {
  pm,
}