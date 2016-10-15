import {NotImplementError} from 'scha.lib/lib/errors';
import EventEmitter from './EventEmitter';

class Task extends EventEmitter {

  static instanceCount=0;

  static Events = {
    failed: 'failed',
    success: 'success',
    complete: 'complete',
    retry: 'retry',
  };

  __taskPrivates = {
    fields: {},
    running: false,
    blocking: true,
    completed: false,
    id:Task.instanceCount++,
  };

  get id() { return this.__taskPrivates.id;}

  get running() {return this.__taskPrivates.running;}

  get blocking() {return this.__taskPrivates.blocking;}

  get completed() {return this.__taskPrivates.completed;}

  get retries() {return this.__taskPrivates.retries;}

  get fields() { return this.__taskPrivates.fields; }

  constructor() {
    super();
    this.__taskPrivates.fields = fields;
    this.__taskPrivates.retries = false;
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
    this.__taskPrivates.retries = true;
    this.emit('retry');
  }

  block() {
    this.__taskPrivates.blocking = true;
  }

  __complete() {
    this.__taskPrivates.blocking = false;
    this.__taskPrivates.completed = true;
    this.emit(Task.Events.complete);
  }
}

export default Task;