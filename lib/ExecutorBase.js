import EventEmitter from './EventEmitter';
import ExecutorEvent from './ExecutorEvent';

/**
 * Base Executor
 */
class ExecutorBase extends EventEmitter {
  static Events = ExecutorEvent;

  /**
   * track info (from environment)
   * @type {Object[]}
   * @private
   */
  _track;

  /**
   * identifier of executor
   * @type {String}
   * @private
   */
  _identifier;

  /**
   * id of process
   * @type {Number}
   * @private
   */
  _id;

  /**
   * process instance
   * @type {Process|ChildProcess}
   * @private
   */
  _process;

  /**
   * Base Executor
   * @param {Process|ChildProcess} executorProcess
   * @param {String} identifier
   */
  constructor({executorProcess, identifier}) {
    super();
    this._process = executorProcess;
    this._id = executorProcess.pid;
    this._identifier = identifier;
    this._process.on('exit', ::this._onExecutorBaseExit);
    this._process.on('message', ::this._onExecutorBaseMessage);
  }

  /**
   * get track from environment
   * @returns {Object[]}
   */
  get track() {return this._track;}

  /**
   * set track to overwrite environment
   * @param {Object[]} value
   */
  set track(value) {this._track = value;}

  /**
   * get process id
   * @returns {Number}
   */
  get id() {return this._id;}

  /**
   * set identifier of executor
   * @param {String} value
   */
  set identifier(value) {this._identifier = value;}

  /**
   * get identifier of executor
   * @returns {String}
   */
  get identifier() {return this._identifier;}

  /**
   * get process of executor
   * @returns {Process|ChildProcess}
   */
  get process() {return this._process;}

  /**
   * remote call target executor
   * @param {ExecutorBase} [target] - Target executor
   * @param {ExecutorEvent} event - Remove event
   * @param {object} data - Data need pass
   */
  remoteCall({target, event, data={}}) {
    if(!target) {
      target = this;
    }
    if(target._process && target._process.connected && target._process.send) {
      target._process.send.call(target._process, {event, ...data});
    }
  }

  /**
   * Handler of executor base exit event
   * @param {Number} code
   * @private
   */
  _onExecutorBaseExit(code) {
    this.emit(ExecutorEvent.exit, {code});
  }

  /**
   * Handler of executor base message event
   * @param {Object} dataArg
   * @param {Object} handler
   * @private
   */
  _onExecutorBaseMessage(dataArg, handler) {
    if(!dataArg || typeof(dataArg)!=='object' || !dataArg.event) {
      return;
    }
    const {event, ...data} = dataArg;
    if(ExecutorEvent.hasOwnProperty(event)) {
      this.emit(event, {...data, handler});
    } else {
      this.emit(ExecutorEvent.message, {...dataArg, handler});
    }
  }
}

export default ExecutorBase;