import {NotImplementError} from 'scha.lib/lib/errors';
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
    throw new NotImplementError();
  }

  failed(reason) {
    this.emit(Task.Events.failed, reason);
    this.__complete();
  }

  success(result) {
    this.emit(Task.Events.success, result);
    this.__complete();
  }

  retry() {
    this._retries = true;
    this.emit('retry');
  }

  block() {
    this._blocking = true;
  }

  __complete() {
    this._blocking = false;
    this._completed = true;
    this.emit(Task.Events.complete);
  }
}

export default Task;