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