import EventEmitter from './EventEmitter';
import ExecutorEvent from './ExecutorEvent';

class Executor extends EventEmitter {
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
  }
}

export default Executor;