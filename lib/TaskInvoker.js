import EventEmitter from './EventEmitter';

class TaskInvoker extends EventEmitter {
  static Events = {
    complete: 'complete',
    success: 'success',
    failed: 'failed',
    begin: 'begin',
  };

  _idle = true;

  static instanceCount=0;

  constructor() {
    super();
    this._id = TaskInvoker.instanceCount++;
  }

  get id() {return this._id;}

  get idle() {return this._idle;}

  run(task) {
    this._idle = false;
    this.emit(TaskInvoker.Events.begin);
  }

  _runTask(task) {
    task.block();
  }
}

export default TaskInvoker;