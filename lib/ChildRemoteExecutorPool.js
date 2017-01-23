import EventEmitter from './EventEmitter';
import assert from 'assert';
import ChildRemoteExecutor from './ChildRemoteExecutor';
import cp from 'child_process';
import path from 'path';
import arrayDistribute from 'scha.lib/lib/array/arrayDistribute';
import ExecutorEvent from './ExecutorEvent';
import Progress from './Progress';
import TaskType from './TaskType';
import Environment from './Environment';

/**
 * Pool for child remote executors
 */
class ChildRemoteExecutorPool extends EventEmitter {
  _childs=[];
  _limit = 0;
  _idle = true;

  /**
   * Pool for child remote executors
   * @param {Number} limit
   * @param {Array} params
   * @param {String} modulePath
   * @param {Object} parentEnv
   * @param {Function} paramsGenerator
   */
  constructor({limit, params=[], modulePath, parentEnv, paramsGenerator}) {
    super();
    this._limit = limit;
    this._params = params;
    this._modulePath = modulePath;
    this._parentEnv = parentEnv;
    this._paramsGenerator = paramsGenerator;
  }

  /**
   * Count of childs in pool
   * @returns {Number}
   */
  get count() {
    return this._childs.length;
  }

  /**
   * Total progress of childs
   * @returns {Progress}
   */
  get progress() {
    return this._childs.reduce((progress,child)=>{
      progress.increase(child.progress);
      return progress;
    }, new Progress());
  }

  /**
   * If childs all idle?
   * @returns {boolean}
   */
  get idle() {
    return !this._childs.some(child=>!child.idle);
  }

  /**
   * Get child ids
   * @returns {Array}
   */
  get ids() {
    return this._childs.map(child=>child.id);
  }

  /**
   * All childs will quit
   * @param {Number} code
   * @param {boolean} force
   */
  exit({code, force=false}={}) {
    this._childs.forEach(child=>{
      child.remoteCall({event:ExecutorEvent.exit, data:{code, force}});
    });
  }

  /**
   * Create a child & put in pool
   * @returns {ChildRemoteExecutor}
   * @private
   */
  _createChild() {
    assert(this._childs.length <=this._limit);

    let modulePath = this._modulePath;
    let params = this._params;
    if(this._paramsGenerator) {
      const result = this._paramsGenerator();
      modulePath = result.path;
      params = result.params;
    }

    const childProcess = cp.fork(path.relative(process.cwd(), modulePath), params, {
      env: Object.assign({}, process.env, {PARENT_EXECUTOR: JSON.stringify(this._parentEnv), EXECUTOR_ENV: JSON.stringify(Environment)}),
      silent: false
    });

    const child = new ChildRemoteExecutor({executorProcess:childProcess});
    child.on(ExecutorEvent.exit, ::this._onChildExit);
    child.on(ExecutorEvent.idle, ::this._onChildIdle);
    child.on(ExecutorEvent.progress, ::this._onChildProgress);
    this._childs.push(child);
    return child;
  }

  /**
   * Dispatch tasks to childs
   * @param {Task[]} tasks
   */
  dispatchTasks(tasks=[]) {
    const statistics = Array.from({length:this._limit},(x,i)=>{
      const child = this._childs[i];
      let count = 0;
      if(child) {
        count = child.progress.rest;
      }
      return {child, count};
    });

    arrayDistribute(statistics, tasks.length, x=>x.count).forEach((count,i)=>{
      if(count===0) {
        return;
      }
      let child = statistics[i].child;
      if(!child) {
        child = this._createChild();
      }
      child.remoteCall({event:ExecutorEvent.tasks, data:{type: TaskType.Local, tasks:tasks.splice(0, count)}});
    });

    assert(tasks.length === 0);
  }

  /**
   * Child exit handler
   * @param {Executor} sender
   * @param {Object} data
   * @private
   */
  _onChildExit(sender, data) {
    const index = this._childs.findIndex(child=>child.id === sender.id);
    assert(index !== -1);
    this._childs.splice(index, 1);
    this.emit(ExecutorEvent.exit, {child: sender, data})
  }

  /**
   * Child idle handler
   * @private
   */
  _onChildIdle() {
    if(this.idle) {
      this.emit(ExecutorEvent.idle);
    }
  }

  /**
   * Child on progress handler
   * @private
   */
  _onChildProgress() {
    this.emit(ExecutorEvent.progress, this.progress);
  }
}

export default ChildRemoteExecutorPool;