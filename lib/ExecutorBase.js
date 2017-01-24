import EventEmitter from './EventEmitter';
import ExecutorEvent from './ExecutorEvent';

class ExecutorBase extends EventEmitter {
  static Events = ExecutorEvent;

  _track;
  _identifier;
  _id;
  _process;

  constructor({executorProcess, identifier}) {
    super();
    this._process = executorProcess;
    this._id = executorProcess.pid;
    this._identifier = identifier;
    this._process.on('exit', ::this._onExecutorBaseExit);
    this._process.on('message', ::this._onExecutorBaseMessage);
  }


  get track() {return this._track;}
  set track(value) {this._track = value;}
  get id() {return this._id;}
  set identifier(value) {this._identifier = value;}
  get identifier() {return this._identifier;}
  get process() {return this._process;}

  remoteCall({target, event, data={}}) {
    if(!target) {
      target = this;
    }
    if(target._process && target._process.connected && target._process.send) {
      target._process.send.call(target._process, {event, ...data});
    }
  }

  _onExecutorBaseExit(code) {
    this.emit(ExecutorEvent.exit, {code});
  }

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