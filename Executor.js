import ExecutorBase from './lib/ExecutorBase';
import ExitCodes from './lib/ExitCodes';
import TaskPool from './lib/TaskPool';
import ExecutorEvent from './lib/ExecutorEvent';
import Progress from './lib/Progress';
import Task from './lib/Task';
import TaskFactory from './lib/TaskFactory';
import TaskType from './lib/TaskType';

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

  _onUncaughtException(err) {
    this.emit({event:ExecutorEvent.error, data:err});
    this._forceExit({code:ExitCodes.FATAL});
  }

  constructor() {
    super({executorProcess: process});
    process.stdin.resume();
    process.on('SIGINT', ::this._onSIGINT);
    process.on('SIGTERM', ::this._onSIGTERM);
    process.on('uncaughtException', ::this._onUncaughtException);
  }

  get parent() {return this._parent;}
  get childs() { return this._childs; }
  get identifier() {return super.identifier;}
  get idle() {return this._idle;}

  run() {
    if(!this._initialized || this._waitForExit) {
      return;
    }
    if(this._taskPool.idle) {
      this.emit(ExecutorEvent.running);
      this._taskPool.run();
    }
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

  _forceExit({code=ExitCodes.FORCE_EXIT}={}) {
    if(this._childs) {
      this._childs.exit({code, force:true});
    }
    process.exit(code);
  }


  _cleanExit({code=ExitCodes.SUCCESS}={}) {
    if(this._waitForDispose) {
      return;
    }

    if(this._childs && this._childs.count!==0) {
      return;
    }

    if(!this._taskPool.idle) {
      this._taskPool.stop();
      return;
    }

    this._waitForDispose = true;
    const resolve = ()=>{
      process.exit(code);
    };
    if(this.listenerCount(ExecutorEvent.dispose) === 0) {
      resolve();
    } else {
      this.emit({event:ExecutorEvent.dispose, data:resolve});
    }
  }

  get progress() {
    return this._childs
        ? Progress.merge(this._taskPool.progress, this._childs.progress)
        : this._taskPool.progress;
  }
}


export default new Executor();

export {
  Task,
  TaskType,
  TaskFactory,
  ExitCodes,
  ExecutorBase,
  ExecutorEvent
};