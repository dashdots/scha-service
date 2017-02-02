import EventEmitter from './EventEmitter';
import Task from './Task';
import assert from 'assert';

/**
 * Task invoker
 */
class TaskInvoker extends EventEmitter {
  static Events = {
    complete: 'complete',
    success: 'success',
    failed: 'failed',
    begin: 'begin',
  };

  /**
   * Whether invoker is idle
   * @type {Boolean}
   * @private
   */
  _idle = true;

  /**
   * Invoker instance count
   * @type {number}
   */
  static instanceCount=0;

  /**
   * Task invoker
   */
  constructor() {
    super();
    this._id = TaskInvoker.instanceCount++;
  }

  /**
   * Get invoker id
   * @returns {Number}
   */
  get id() {return this._id;}

  /**
   * Whether invoker is idle
   * @type {Boolean}
   */
  get idle() {return this._idle;}

  /**
   * Run a task by invoker
   * @param task
   */
  run(task) {
    task.invokerId = this._id;
    assert(task!==undefined);
    assert(this._idle, 'run task invoker when busy');

    this._idle = false;
    task.once(Task.Events.complete, ::this._onTaskComplete);
    task.once(Task.Events.failed, ::this._onTaskFailed);
    task.once(Task.Events.success, ::this._onTaskSuccess);
    task.once(Task.Events.retry, ::this._onTaskRetry);
    this.emit(TaskInvoker.Events.begin);
    this._runTask(task);
  }

  /**
   * Run task single step
   * @param {Task} task
   * @private
   */
  _runTask(task) {
    task.block();
    Promise.resolve(task.run()).then(()=>{
      if(!task.completed) {
        task.success();
      }
    }).catch(e=>{
      if(!task.completed) {
        task.failed(e);
      }
    });
  }

  /**
   * Handler for task retry event
   * @param {Task} sender
   * @private
   */
  _onTaskRetry(sender) {
    this._runTask(sender);
  }

  /**
   * Handler for task complete event
   * @param {Task} sender
   * @private
   */
  _onTaskComplete(sender) {
    this._idle = true;
    this.emit(TaskInvoker.Events.complete);
  }

  /**
   * Handler for task failed event
   * @param {Task} sender
   * @private
   */
  _onTaskFailed(sender) {
    this.emit(TaskInvoker.Events.failed);
  }

  /**
   * Handler for task success event
   * @param {Task} sender
   * @param {Object} result
   * @private
   */
  _onTaskSuccess(sender, result) {
    this.emit(TaskInvoker.Events.success, result);
  }
}

export default TaskInvoker;