import ExecutorBase from './ExecutorBase';

/**
 * Remote executor
 * Used to map remote process to executor reference
 * @abstract
 */
class RemoteExecutor extends ExecutorBase {

  /**
   * Remote executor
   * @param {Process|ChildProcess} executorProcess
   * @param {String}identifier
   */
  constructor({executorProcess, identifier}) {
    super({executorProcess, identifier});
  }
}

export default RemoteExecutor;