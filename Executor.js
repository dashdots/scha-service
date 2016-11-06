import ExecutorBase from './lib/ExecutorBase';

class Executor extends ExecutorBase {

  _parent;
  _childs;

  constructor() {
    super({executorProcess: process});
  }

  get parent() {return this._parent;}
  get childs() { return this._childs; }

  run() {

  }

  initialize() {
    super.identifier = identifier;

  }}


export default Executor;