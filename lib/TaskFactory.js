import EventEmitter from './EventEmitter';

class TaskFactory extends EventEmitter {
  create() {
    throw new Error();
  }
}

export default TaskFactory;