import EventEmitter from './EventEmitter';
import Progress from './Progress';

const TaskPoolEvents = {
  idle: 'idle',
  running: 'running',
  progress: 'progress',
};

class TaskPool extends EventEmitter {

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

  _onProgressChanged(sender, progress) {}

  get idle() {
    return this._activeInvokerCount===0;
  }

  stop() {
    this._running = false;
    if(this.idle) {
      this.emit(TaskPoolEvents.idle);
    }
  }
}

export default TaskPool;