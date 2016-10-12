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
    this._progress.on('changed', ::this._onProgressChanged);
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
}

export default TaskPool;