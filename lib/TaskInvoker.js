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
    task.invokerId = this._id;
    assert(task!==undefined);
    assert(this._idle, 'run task invoker when busy');

    this._idle = false;
    task.once(Task.Events.complete, ::this._onTaskComplete);
    task.once(Task.Events.failed, ::this._onTaskFailed);
    task.once(Task.Events.success, ::this._onTaskSuccess);
    task.once(Task.Events.retry, ::this._onTaskRetry);
    this.emit(TaskInvoker.Events.begin);
    this._runTask(task);
  }

  _runTask(task) {
    task.block();
    Promise.resolve(task.run()).then(()=>{
      task.success();
    }).catch(e=>{
      task.failed(e);
    });
  }

  _onTaskRetry(sender) {
    this._runTask(sender);
  }

  _onTaskComplete(sender) {
    this._idle = true;
    this.emit(TaskInvoker.Events.complete);
  }

  _onTaskFailed(sender) {
    this.emit(TaskInvoker.Events.failed);
  }

  _onTaskSuccess(sender, result) {
    this.emit(TaskInvoker.Events.success, result);
  }
}

export default TaskInvoker;