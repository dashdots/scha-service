import {NotImplementError} from 'hello.lib/lib/errors';

class TaskFactory {
  create() {
    throw new NotImplementError();
  }
}

export default TaskFactory;