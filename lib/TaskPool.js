import EventEmitter from './EventEmitter';
import TaskInvoker from './TaskInvoker';
import Progress from './Progress';

/**
 * Task pool
 */
class TaskPool extends EventEmitter {
  static Events = {
    idle: 'idle',
    running: 'running',
    progress: 'progress',
  };

  /**
   * Tasks in pool
   * @type {Task[]}
   * @private
   */
  _tasks = [];

  /**
   * Task invokers
   * @type {TaskInvoker[]}
   * @private
   */
  _invokers = [];

  /**
   * Whether any running task in pool
   * @type {boolean}
   * @private
   */
  _running = false;

  /**
   * A task factory used to product tasks
   * @type {TaskFactory}
   * @private
   */
  _factory;

  /**
   * Total progress of tasks
   * @type {Progress}
   * @private
   */
  _progress = new Progress();

  /**
   * Whether pool is on reloading
   * @type {boolean}
   * @private
   */
  _reloading = false;

  /**
   * Count of active invokers
   * @type {number}
   * @private
   */
  _activeInvokerCount = 0;

  /**
   * Task pool
   * @param {Number} invokerLimit - Limits of Task performing at same time
   * @param {TaskFactory} factory - Task factory used to product tasks
   */
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

  /**
   * Load tasks
   * @param {Task[]} tasks
   */
  loadTasks(tasks) {
    if(!Array.isArray(tasks)) {
      tasks = [tasks];
    }
    if(!tasks.length) {
      return;
    }
    this._reloading = true;
    try {
      for(const task of tasks) {
        this._tasks.push(this._factory.create(task));
      }
    } catch(e) {
      console.error(e);
    }
    this._reloading = false;
    this._progress.increase({total:tasks.length});
    if(this._running) {
      this.run();
    }
  }

  /**
   * Total progress of tasks
   * @returns {Progress}
   */
  get progress() { return this._progress; }

  /**
   * Run task invokers
   * @return {Boolean}
   */
  run() {
    this._running = true;
    this._invokers.some(invoker=>{
      if(this._tasks.length>0) {
        if(invoker.idle) {
          invoker.run(this._tasks.shift());
        }
      } else {
        return true;
      }
    });
  }

  /**
   * Stop task invokers
   */
  stop() {
    this._running = false;
    if(this.idle) {
      this.emit(TaskPool.Events.idle);
    }
  }

  /**
   * Whether invokers are idle
   * @returns {Boolean}
   */
  get idle() {
    return this._activeInvokerCount===0;
  }

  /**
   * Handler of progress changed event
   * @param {Task} sender
   * @param {Progress} progress
   * @private
   */
  _onProgressChanged(sender, progress) {
    this.emit(TaskPool.Events.progress, progress);
  }

  /**
   * Handler of invoker begin running event
   * @private
   */
  _onInvokerBegin() {
    if(this.idle) {
      this.emit(TaskPool.Events.running);
    }
    this._activeInvokerCount++;
  }

  /**
   * Handler of invoker complete event
   * @private
   */
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

  /**
   * Handler of invoker success event
   * @private
   */
  _onInvokerSuccess() {
    this._progress.success++;
  }

  /**
   * Handler of invoker failed event
   * @private
   */
  _onInvokerFailed() {
    this._progress.failed++;
  }
}

export default TaskPool;