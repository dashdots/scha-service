import LeecherTaskType from './LeecherTaskType';
import TaskFactory from './lib/TaskFactory';
import PageLeechTask from './tasks/PageLeechTask';
import ListLeechTask from './tasks/ListLeechTask';
import SyncholizeTask from './tasks/SyncholizeTask';

class LeecherTaskFactory extends TaskFactory {
  create(task) {
    if(task.type === LeecherTaskType.PageTask) {
      return new PageLeechTask(task);
    }
    if(task.type === LeecherTaskType.ListTask) {
      return new ListLeechTask(task);
    }
    if(task.type === LeecherTaskType.SyncholizeTask) {
      return new SyncholizeTask(task);
    }
  }
}

export default LeecherTaskFactory;