import RemoteExecutor from './RemoteExecutor';

class ParentRemoteExecutor extends RemoteExecutor {
  _child;

  constructor({child}) {
    const {pid, identifier, track} = JSON.parse(process.env['PARENT_EXECUTOR']);
    super({executorProcess: process, identifier});
    this._child = child;
    this._id = pid;
    this._track = track;
  }

}

export default ParentRemoteExecutor;