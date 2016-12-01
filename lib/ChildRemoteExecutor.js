import RemoteExecutor from './RemoteExecutor';
import ExecutorEvent from './ExecutorEvent';
import Progress from './Progress';

/**
 * Remote Executor of Child Process (only as reference)
 * @extends {RemoteExecutor}
 */
class ChildRemoteExecutor extends RemoteExecutor {
  _progress = new Progress();
  _idle = true;

  /**
   * Remote Executor of Child Process (only as reference)
   * @param {Process} executorProcess
   */
  constructor({executorProcess}) {
    super({executorProcess});
    this.on(ExecutorEvent.progress, ::this._onChildRemoteExecutorProgress);
    this.on(ExecutorEvent.idle, ::this._onChildRemoteExecutorIdle);
    this.on(ExecutorEvent.running, ::this._onChildRemoteExecutorRunning);
    this.on(ExecutorEvent.initialized, ::this._onChildRemoteExecutorInitialized);
  }

  /**
   * Get progress of task execution
   * @returns {Progress}
   */
  get progress() {
    return this._progress;
  }

  /**
   * Get executor idle status
   * @returns {boolean}
   */
  get idle() {
    return this._idle;
  }

  /**
   * Set executor progress
   * @param {RemoteExecutor} sender
   * @param {Number} total
   * @param {Number} failed
   * @param {Number} success
   * @private
   */
  _onChildRemoteExecutorProgress(sender, {total, failed, success}) {
    this._progress.set({total, failed, success});
  }

  /**
   * Set remote executor idle
   * @private
   */
  _onChildRemoteExecutorIdle() {
    this._idle = true;
  }

  /**
   * Set remote executor free
   * @private
   */
  _onChildRemoteExecutorRunning() {
    this._idle = false;
  }

  /**
   * Trigger when remote executor initialized
   * @param sender
   * @param identifier
   * @param id
   * @param track
   * @private
   */
  _onChildRemoteExecutorInitialized(sender, {identifier, id, track}) {
    this._identifier = identifier;
    this._id = id;
    this._track = track;
  }
}

export default ChildRemoteExecutor;