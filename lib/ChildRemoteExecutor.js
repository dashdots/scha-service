import RemoteExecutor from './RemoteExecutor';
import ExecutorEvent from './ExecutorEvent';
import Progress from './Progress';

class ChildRemoteExecutor extends RemoteExecutor {
  _progress = new Progress();
  _idle = true;

  constructor({executorProcess}) {
    super({executorProcess})
  }

  get progress() {
    return this._progress;
  }

  get idle() {
    return this._idle;
  }

}

export default ChildRemoteExecutor;