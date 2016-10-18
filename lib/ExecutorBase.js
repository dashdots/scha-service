import EventEmitter from './EventEmitter';
import ExecutorEvent from './ExecutorEvent';

class ExecutorBase extends EventEmitter {
  static Events = ExecutorEvent;

  _track;
  _identifier;
  _id;
  _process;

  constructor() {
    super();
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
    //@todo BASE 消息传播如何做到通用？
  }
}

export default ExecutorBase;