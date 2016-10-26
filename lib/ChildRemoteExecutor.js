import RemoteExecutor from './RemoteExecutor';
import ExecutorEvent from './ExecutorEvent';
import Progress from './Progress';

class ChildRemoteExecutor extends RemoteExecutor {
  _progress = new Progress();
  _idle = true;

  constructor({executorProcess}) {
    super({executorProcess})
    this.on(ExecutorEvent.progress, ::this._onChildRemoteExecutorProgress);
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
}

export default ChildRemoteExecutor;