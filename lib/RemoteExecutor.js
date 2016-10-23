import ExecutorBase from './ExecutorBase';

class RemoteExecutor extends ExecutorBase {

  constructor({executorProcess, identifier}) {
    super({executorProcess, identifier});
  }
}

export default RemoteExecutor;