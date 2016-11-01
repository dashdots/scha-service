import RemoteExecutor from './RemoteExecutor';
import ExecutorBase from './ExecutorBase';

class ParentRemoteExecutor extends RemoteExecutor {
  _child;

  static isParentExist() {
    return process.env.hasOwnProperty('PARENT_EXECUTOR');
  }

  constructor({child}) {
    const {pid, identifier, track} = JSON.parse(process.env['PARENT_EXECUTOR']);
    super({executorProcess: process, identifier});
    this._child = child;
    this._id = pid;
    this._track = track;
  }

}

export default ParentRemoteExecutor;