import EventEmitter from './EventEmitter';
import Progress from './Progress';

class TaskPool extends EventEmitter {
  static Events = {
    idle: 'idle',
    running: 'running',
    progress: 'progress',
  };

  _tasks = [];

  _invokers = [];

  _running = false;

  _factory;

  _progress = new Progress();

  _reloading = false;

  _activeInvokerCount = 0;

  constructor({invokerLimit=1, factory}={}) {
    super();
    this._factory = factory;
    this._progress.on(Progress.Events.changed, ::this._onProgressChanged);
    for(let i=0; i<invokerLimit; i++) {
      const invoker = new TaskInvoker();
      invoker.on(TaskInvoker.Events.begin, ::this._onInvokerBegin);
      invoker.on(TaskInvoker.Events.success, ::this._onInvokerSuccess);
      invoker.on(TaskInvoker.Events.failed, ::this._onInvokerFailed);
      invoker.on(TaskInvoker.Events.complete, ::this._onInvokerComplete);
      this._invokers.push(invoker);
    }
  }

  _onProgressChanged(sender, progress) {
    this.emit(TaskPool.Events.progress, progress);
  }

  get idle() {
    return this._activeInvokerCount===0;
  }

  stop() {
    this._running = false;
    if(this.idle) {
      this.emit(TaskPool.Events.idle);
    }
  }

  _onInvokerBegin() {}

  _onInvokerComplete(sender) {}

  _onInvokerSuccess() {}

  _onInvokerFailed() {}
}

export default TaskPool;