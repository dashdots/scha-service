import Task from '../lib/Task';
import {database, searchEngine} from 'scha.db';
import executor from '../Executor';
import Leecher, {LeecherEvent} from '../Leecher';

let taskLog;

class SyncholizeLeechTask extends Task {
  leecher;
  log;

  constructor({name, force=false, pageId}) {
    super(...arguments);

    if(!taskLog) {
      taskLog = executor.log.child({name:'PageLeecher',id:this.id});
    }

    this.log = taskLog.child({name});
    this.log.on('log', data=>{
      executor.emitSocket({event:'log', data})
    });

    this.leecher = new Leecher(name);
    this.leecher.on(LeecherEvent.leechLeak, msg=>{
      this.log.attention(msg);
    });
    this.leecher.on(LeecherEvent.message, msg=>{
      this.log.trace(msg);
    });

    this.on(Task.Events.success, ()=>{
      this.log.success(`leech ${pageId} success`);
    });
    this.on(Task.Events.failed, (sender, reason)=>{
      this.log.error(reason, `leech ${pageId} failed`);
    });
    this.on(Task.Events.complete,()=>{
      this.log.removeAllListeners('log');
    });

  }
  async run() {
    const {pageId} = this.fields;
    const archive = await this.leecher.loadLeechResult({pageId});

    this.log.debug(archive);

    return this.success();
  }
}

export default SyncholizeLeechTask;