import {NotImplementError} from 'scha.lib/lib/errors';
import EventEmitter from './EventEmitter';

/**
 * Base task
 */
class Task extends EventEmitter {

  /**
   * task variables
   * @type {Object}
   * @private
   */
  __taskPrivates = {
    fields: {},
    running: false,
    blocking: true,
    completed: false,
    id:Task.instanceCount++,
  };

  /**
   * Count of active task instance
   * @type {Number}
   */
  static instanceCount=0;

  /**
   * Event constant of task
   */
  static Events = {
    failed: 'failed',
    success: 'success',
    complete: 'complete',
    retry: 'retry',
  };

  /**
   * Get task id
   * @returns {Number}
   */
  get id() { return this.__taskPrivates.id;}

  /**
   * Whether task is running
   * @returns {Boolean}
   */
  get running() {return this.__taskPrivates.running;}

  /**
   * Whether task is blocking
   * @returns {Boolean}
   */
  get blocking() {return this.__taskPrivates.blocking;}

  /**
   * Whether task is completed
   * @returns {Boolean}
   */
  get completed() {return this.__taskPrivates.completed;}

  /**
   * Base task
   * @param {Object} fields
   */
  constructor(fields={}) {
    super();
    this.__taskPrivates.fields = fields;
    this.__taskPrivates.retries = false;
  }

  /**
   * Get task fields
   * @returns {Object}
   */
  get fields() { return this.__taskPrivates.fields; }

  /**
   * Get task retry limits
   * @returns {Number}
   */
  get retries() {return this.__taskPrivates.retries;}

  /**
   * Run a task
   */
  run() {
    throw new NotImplementError();
  }

  /**
   * Block a task
   */
  block() {
    this.__taskPrivates.blocking = true;
  }

  /**
   * Set task failed
   * @param {String} reason - The reason tell why task failed
   */
  failed(reason) {
    this.emit(Task.Events.failed, reason);
    this.__complete();
  }

  /**
   * Set task status to `success`
   * @param result
   */
  success(result) {
    this.emit(Task.Events.success, result);
    this.__complete();
  }

  /**
   * Retry a task
   */
  retry() {
    this.__taskPrivates.retries = true;
    this.emit(Task.Events.retry);
  }

  /**
   * handler for task complete event
   * @private
   */
  __complete() {
    this.__taskPrivates.blocking = false;
    this.__taskPrivates.completed = true;
    this.emit(Task.Events.complete);
  }
}

export default Task;