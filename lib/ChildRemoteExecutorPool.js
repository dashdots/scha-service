import Environment from './Environment';
import Progress from './Progress';
import ExecutorEvent from './ExecutorEvent';
import cp from 'child_process';
import path from 'path';
import ChildRemoteExecutor from './ChildRemoteExecutor';

class ChildRemoteExecutorPool {
  _childs = [];
  _limit = 0;
  _idle = true;

  constructor({limit, params=[], modulePath, parentEnv, paramsGenerator}) {
    super();
    this._limit = limit;
    this._params = params;
    this._modulePath = modulePath;
    this._parentEnv = parentEnv;
    this._paramsGenerator = paramsGenerator;
  }

  get count() {
    return this._childs.length;
  }

  get progress() {
    return this._childs.reduce((progress,child)=>{
      progress.increase(child.progress);
      return progress;
    }, new Progress());
  }

  get idle() {
    return !this._childs.some(child=>!child.idle);
  }

  get ids() {
    return this._childs.map(child=>child.id);
  }

  exit({code, force=false}={}) {
    this._childs.forEach(child=>{
      child.remoteCall({event:ExecutorEvent.exit, data:{code, force}});
    });
  }

  _createChild() {
    let modulePath = this._modulePath;
    let params = this._params;
    if(this._paramsGenerator) {
      let result = this._paramsGenerator();
      modulePath = result.path;
      params = result.params;
    }

    const childProcess = cp.fork(path.relative(process.cwd(), modulePath), params, {
      env: Object.assign({}, process.env, {PARENT_EXECUTOR: JSON.stringify(this._parentEnv), EXECUTOR_ENV: JSON.stringify(Environment)}),
      silent: false
    });

    const child = new ChildRemoteExecutor({executorProcess:childProcess});
    this._childs.push(child);
    return child;
  }
}

export default ChildRemoteExecutorPool;