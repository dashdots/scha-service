import EventEmitter from './EventEmitter';

class Task extends EventEmitter {

  static instanceCount=0;

  _fields = {};
  _running = false;
  _blocking = true;
  _completed = false;
  _id = Task.instanceCount++;
  _retries = false;

  get id() { return this._id;}

  get running() {return this._running;}

  get blocking() {return this._blocking;}

  get completed() {return this._completed;}

  get retries() {return this._retries;}

  constructor() {
    super();
  }

  run() {
    throw new Error();
  }

  block() {
    this._blocking = true;
  }
}

export default Task;