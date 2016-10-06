import EventEmitter from './EventEmitter';

class Task extends EventEmitter {

  static instanceCount=0;

  _fields = {};
  _running = false;
  _blocking = true;
  _completed = false;
  _id = Task.instanceCount++;

  constructor() {
    super();
  }

  run() {
    throw new Error();
  }
}

export default Task;