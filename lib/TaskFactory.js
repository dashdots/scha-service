import {NotImplementError} from 'scha.lib/lib/errors';

/**
 * Task factory interface
 *
 * @interface TaskFactory
 */
class TaskFactory {

  /**
   * Create task
   * @public
   * @param {Object} task
   * @returns {Task}
   */
  create(task) {
    throw new NotImplementError();
  }
}

export default TaskFactory;