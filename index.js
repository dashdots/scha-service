import 'source-map-support/register';
import 'babel-polyfill';
import Log from 'scha.lib/lib/Log';
import executor, {ExecutorEvent, Task, TaskFactory, TaskType} from './Executor';

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