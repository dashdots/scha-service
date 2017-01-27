import EventEmitter from './EventEmitter';
import RemoteExecutor from './RemoteExecutor';
import ExecutorBase from './ExecutorBase';

/**
 * Remote executor for parent(or host) process
 */
class ParentRemoteExecutor extends RemoteExecutor {
  /**
   * Check if parent exists
   * @returns {boolean}
   */
  static isParentExist() {
    return process.env.hasOwnProperty('PARENT_EXECUTOR');
  }

  _child;

  /**
   * Remote executor for parent(or host) process
   * @param {Process} child
   */
  constructor({child}) {
    const {pid, identifier, track} = JSON.parse(process.env['PARENT_EXECUTOR']);
    super({executorProcess: process, identifier});
    this._child = child;
    this._id = pid;
    this._track = track;
  }

}

export default ParentRemoteExecutor;