import EventEmitter from './EventEmitter';
import Progress from './Progress';

const TaskPoolEvents = {
  idle: 'idle',
  running: 'running',
  progress: 'progress',
};

class TaskPool extends EventEmitter {}

export default TaskPool;