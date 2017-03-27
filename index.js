import 'source-map-support/register';
import 'babel-polyfill';
import Log from 'scha.lib/lib/Log';
import executor, {ExecutorEvent, Task, TaskFactory, TaskType} from './Executor';
import Leecher from './Leecher';
import LeechTaskType from './LeecherTaskType';

const log = new Log({name:'Leecher', logName:false, showPid:true});

class NopTask extends Task {
  run() {
    this.success();
  }
}


class NopTaskFactory extends TaskFactory {
  create(task) {
    return new NopTask();
  }
}

const taskFactory = new NopTaskFactory();

function onPeerMessage(sender, {event, data}) {
  log.debug({event, data}, 'peer message:');
}

async function buildListTasks({name, begin=1, end, tasks, ...params}) {
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

async function buildPageTasks({name, begin=0, end, tasks, ...params}) {
  name = name.toUpperCase();
  if(!tasks || !tasks.length) {
    tasks = await (new Leecher(name)).loadPageIdsByRange(begin, end) || [];
  }
  return tasks.map(pageId=>Object.assign({}, params, {name, pageId}));
}

async function buildSyncholizeTasks({name, begin = 0, end, tasks, ...params}) {
  name = name.toUpperCase();
  if(!tasks || !tasks.length) {
    tasks = await (new Leecher(name)).loadPageIdsByRange(begin, end) || [];
  }
  return tasks.map(pageId=>Object.assign({}, params, {name, pageId}));
}


async function publishTasks({type, task}) {

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
        executorTasks = await buildListTasks(task);
        break;
      case LeechTaskType.PageTask:
        executorTasks = await buildPageTasks(task);
        break;
      case LeechTaskType.SyncholizeTask:
        executorTasks = await buildSyncholizeTasks(task);
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