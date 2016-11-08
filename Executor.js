import ExecutorBase from './lib/ExecutorBase';
import ExitCodes from './lib/ExitCodes';

class Executor extends ExecutorBase {

  _parent;
  _childs;
  _waitForDispose = false;

  constructor() {
    super({executorProcess: process});
    process.stdin.resume();
    process.on('SIGINT', ::this._onSIGINT);
    process.on('SIGTERM', ::this._onSIGTERM);
  }

  get parent() {return this._parent;}
  get childs() { return this._childs; }

  run() {

  }

  initialize() {
    super.identifier = identifier;

  }

  exit({force=false}={}) {
    if(force) {
      this._forceExit();
    } else {
      this._cleanExit();
    }
  }

  _onSIGINT() {
    this.exit({force:this._waitForExit});
  }

  _onSIGTERM() {
    this._forceExit({code: ExitCodes.FORCE_EXIT});
  }

  _forceExit() {
    process.exit();
  }

  _cleanExit() {
    if(this._waitForDispose) {
      return;
    }
    process.exit();
  }

}


export default Executor;