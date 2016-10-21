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

  loadTasks(tasks) {
    if(!Array.isArray(tasks)) {
      tasks = [tasks];
    }
    if(!tasks.length) {
      return;
    }
    this._reloading = true;
    for(const task of tasks) {
      this._tasks.push(this._factory.create(task));
    }
    this._reloading = false;
    this._progress.increase({total:tasks.length});
    if(this._running) {
      this.run();
    }
  }

  _onProgressChanged(sender, progress) {
    this.emit(TaskPool.Events.progress, progress);
  }

  get idle() {
    return this._activeInvokerCount===0;
  }

  run() {
    this._running = true;
  }

  stop() {
    this._running = false;
    if(this.idle) {
      this.emit(TaskPool.Events.idle);
    }
  }

  _onInvokerBegin() {
    if(this.idle) {
      this.emit(TaskPool.Events.running);
    }
    this._activeInvokerCount++;
  }

  _onInvokerComplete(sender) {
    this._activeInvokerCount--;

    if(this._reloading) {
      return;
    }

    if(!this._running) {
      if(this.idle) {
        this.emit(TaskPool.Events.idle);
      }
      return;
    }

    if(this._tasks.length>0) {
      sender.run(this._tasks.shift());
    } else {
      if(this.idle) {
        this.emit(TaskPool.Events.idle);
      }
    }
  }

  _onInvokerSuccess() {
    this._progress.success++;
  }

  _onInvokerFailed() {
    this._progress.failed++;
  }
}

export default TaskPool;