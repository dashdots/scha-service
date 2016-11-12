import ExecutorBase from './lib/ExecutorBase';
import ExitCodes from './lib/ExitCodes';
import TaskPool from './lib/TaskPool';

class Executor extends ExecutorBase {

  _parent;
  _childs;
  _waitForDispose = false;
  _taskPool;
  _idle = true;
  _initialized = false;

  _onSIGINT() {
    this.exit({force:this._waitForExit});
  }

  _onSIGTERM() {
    this._forceExit({code: ExitCodes.FORCE_EXIT});
  }


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

  initialize({identifier, task:{invokerLimit=1, factory}={}}) {
    super.identifier = identifier;
    if(!this._identifier) {
      throw new Error('`identifier` must be specified');
    }
    if(!factory) {
      throw new Error('task factory must be specified');
    }
    if(invokerLimit<1) {
      throw new Error(`task invoker limit cannot be \`${invokerLimit}\``);
    }
    this._taskPool = new TaskPool({invokerLimit, factory});
  }

  exit({force=false}={}) {
    if(force) {
      this._forceExit();
    } else {
      this._cleanExit();
    }
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