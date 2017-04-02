/**
 * Scha service, Only execute by Scha portable (need environment injection).
 */

import 'source-map-support/register';
import 'babel-polyfill';
import Log from 'scha.lib/lib/Log';
import executor, {ExecutorEvent, Task, TaskFactory, TaskType} from './Executor';
import Leecher from './Leecher';
import LeechTaskType from './LeecherTaskType';
import isObject from 'scha.lib/lib/object/isObject';

const log = new Log({name:'Leecher', logName:false, showPid:true});

/**
 * Handler for peer message event
 * @param {ExecutorBase} sender
 * @param {String} event
 * @param {Object} data
 */
function _onPeerMessage(sender, {event, data}) {
  log.debug({event, data}, 'peer message:');
  switch(event) {
    case 'tasks':
      if(isObject(data)) {
        _publishTasks(data).catch(e=>{log.error(e)});
      } else {
        log.error('task not valid')
      }
      break;
  }
}

/**
 * Build list tasks
 * @param {String} name - Leecher name
 * @param {Number} begin - Begin index
 * @param {Number} end - End index
 * @param {Task[]} tasks - Syncholize tasks
 * @param {Object[]} params - Params for each task
 * @returns {Promise.<*>}
 */
async function _buildListTasks({name, begin=1, end, tasks, ...params}) {
  name = name.toUpperCase();
  if(!begin) {
    begin = 1;
  }

  if(!tasks || tasks.length===0) {
    tasks = [];
    if(!end) {
      end = await (new Leecher(name)).getListCount();
    }

    if(!begin || !end) {
      return false;
    }

    for(let i=begin; i<=end; i++) {
      tasks.push(i);
    }
  }
  return tasks.map(page=>Object.assign({}, params, {name, page}));
}

/**
 * Build page tasks
 * @param {String} name - Leecher name
 * @param {Number} begin - Begin index
 * @param {Number} end - End index
 * @param {Task[]} tasks - Syncholize tasks
 * @param {Object[]} params - Params for each task
 * @returns {Promise.<Array>}
 */
async function _buildPageTasks({name, begin=0, end, tasks, ...params}) {
  name = name.toUpperCase();
  if(!tasks || !tasks.length) {
    tasks = await (new Leecher(name)).loadPageIdsByRange(begin, end) || [];
  }
  return tasks.map(pageId=>Object.assign({}, params, {name, pageId}));
}

/**
 * Build standalone syncholize tasks
 * @param {String} name - Leecher name
 * @param {Number} begin - Begin index
 * @param {Number} end - End index
 * @param {Task[]} tasks - Syncholize tasks
 * @param {Object[]} params - Params for each task
 * @returns {Promise.<Array>}
 */
async function _buildSyncholizeTasks({name, begin = 0, end, tasks, ...params}) {
  name = name.toUpperCase();
  if(!tasks || !tasks.length) {
    tasks = await (new Leecher(name)).loadPageIdsByRange(begin, end) || [];
  }
  return tasks.map(pageId=>Object.assign({}, params, {name, pageId}));
}

/**
 * Publish task to child executors
 * @param {String} type - task type
 * @param {Task} task - bulk task
 * @returns {Promise.<boolean>}
 */
async function _publishTasks({type, task}) {

  if(!TaskType.hasOwnProperty(type)) {
    log.error(`invalid executor task type: \`${type}\``);
    return false;
  }

  let executorTasks;

  if(type === TaskType.Remote) {
    if(!isObject(task)) {
      log.error({body:task}, `invalid remote task data body:`);
      return false;
    }
    if(!task.name) {
      log.error(`invalid leecher task name: \`${task.name}\``);
      return false;
    }

    switch (task.type) {
      case LeechTaskType.ListTask:
        executorTasks = await _buildListTasks(task);
        break;
      case LeechTaskType.PageTask:
        executorTasks = await _buildPageTasks(task);
        break;
      case LeechTaskType.SyncholizeTask:
        executorTasks = await _buildSyncholizeTasks(task);
        break;
      default:
        log.error(`invalid leecher task type: \`${task.type}\``);
        return false;
    }
  }

  if(!executorTasks || !Array.isArray(executorTasks) || executorTasks.length===0) {
    log.attention(`task ignored, because no remote executor tasks`);
    return false;
  }

  log.notice(`${executorTasks.length} task found`);
  executor.dispatchTasks(type, executorTasks);
}

/**
 * Empty task used to idling
 */
class _NopTask extends Task {
  run() {
    this.success();
  }
}

/**
 * Factory to product idling tasks
 */
class _NopTaskFactory extends TaskFactory {
  create(task) {
    return new _NopTask();
  }
}

/**
 * Service entry
 */
function entry() {

  const taskFactory = new _NopTaskFactory();

  executor.initialize({
    identifier:'Leecher',
    task:{
      invokerLimit:1,
      factory:taskFactory
    },
    child:{
      limit:20,
      params:[],
      modulePath:path.resolve(__dirname, './dispatcher.js')
    }
  },
  err=>{
    executor.on(ExecutorEvent.dispose, (sender, resolve)=>{log.notice('dispose'); resolve();});
    executor.on(ExecutorEvent.running,()=>{log.notice('running')});
    executor.on(ExecutorEvent.exit,()=>{log.danger('exit')});
    executor.on(ExecutorEvent.exiting,()=>{log.attention('try exit, wait for dispose')});
    executor.on(ExecutorEvent.idle,()=>{log.notice('idle')});
    executor.on(ExecutorEvent.error,(sender, error)=>{log.error(error)});
    executor.on(ExecutorEvent.peer, _onPeerMessage)

  })
  .then(()=>{
    log.on('log', (data)=>{ executor.emitSocket({event:'log', data}); });

    log.notice('initialized');

    executor.run();

  });

}

entry();