import RemoteExecutor from './RemoteExecutor';
import ExecutorEvent from './ExecutorEvent';
import Progress from './Progress';

class ChildRemoteExecutor extends RemoteExecutor {
  _progress = new Progress();
  _idle = true;

  constructor({executorProcess}) {
    super({executorProcess})
    this.on(ExecutorEvent.progress, ::this._onChildRemoteExecutorProgress);
    this.on(ExecutorEvent.idle, ::this._onChildRemoteExecutorIdle);
    this.on(ExecutorEvent.running, ::this._onChildRemoteExecutorRunning);
    this.on(ExecutorEvent.initialized, ::this._onChildRemoteExecutorInitialized);
  }

  get progress() {
    return this._progress;
  }

  get idle() {
    return this._idle;
  }

  _onChildRemoteExecutorProgress(sender, {total, failed, success}) {
    this._progress.set({total, failed, success});
  }
  _onChildRemoteExecutorIdle() {
    this._idle = true;
  }
  _onChildRemoteExecutorRunning() {
    this._idle = false;
  }
  _onChildRemoteExecutorInitialized(sender, {identifier, id, track}) {
    this._identifier = identifier;
    this._id = id;
    this._track = track;
  }
}

export default ChildRemoteExecutor;