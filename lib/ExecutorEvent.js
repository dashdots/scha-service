/**
 * Executor Events Enumeration
 * @readonly
 * @enum {string}
 */
const ExecutorEvent = {

  /** @event ExecutorEvent.dispose */
  dispose: 'dispose',

  /** @event ExecutorEvent.run */
  run: 'run',

  /** @event ExecutorEvent.exit */
  exit: 'exit',

  /** @event ExecutorEvent.message */
  message: 'message',

  /** @event ExecutorEvent.error */
  error: 'error',

  /** @event ExecutorEvent.progress */
  progress: 'progress',

  /** @event ExecutorEvent.localProgress */
  localProgress: 'local-progress',

  /** @event ExecutorEvent.localProgress */
  remoteProgress: 'remote-progress',

  /** @event ExecutorEvent.running */
  running: 'running',

  /** @event ExecutorEvent.exiting */
  exiting: 'exiting',

  /** @event ExecutorEvent.initialized */
  initialized: 'initialized',

  /** @event ExecutorEvent.idle */
  idle: 'idle',

  /** @event ExecutorEvent.tasks */
  tasks: 'tasks',

  peer: 'peer',
};

export default ExecutorEvent;