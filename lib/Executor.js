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
  get id() {return this._id;}
  get identifier() {return this._identifier;}
  get process() {return this._process;}
}

export default Executor;