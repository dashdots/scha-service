import Task from '../lib/Task';
import {readFile, writeFile, makeDirectory, exists} from 'scha.lib/lib/fs';
import {ProxyDistributorEvent} from 'scha.dump.proxy';

class PageLeechTask extends Task {
  leecher;
  log;

  constructor({name, loadDumpFile=false, loadDumpCache=true, force=false, pageId}) {
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
    this.leecher.proxy.on(ProxyDistributorEvent.notice, msg=>{
      this.log.trace(`fetch ${pageId}: ${msg}`);
    });
    this.leecher.proxy.on(ProxyDistributorEvent.warning, msg=>{
      this.log.warn(`fetch ${pageId}: ${msg}`);
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
    const log = this.log;

    let {loadDumpFile, loadDumpCache, force, pageId, name} = this.fields;

    const leecher = this.leecher;

    log.trace(`run task ${pageId} ${force?'force':''}`);

    try {
      await leecher.fetchPageResult({pageId, dumpPath: DUMP_PATH, loadDumpFile, loadDumpCache});
    } catch(e) {
      console.log(e);
      log.error(`BUG: ${pageId}, ${e.message}`);
      return this.failed();
    }

    return this.success();
  }
}



export default PageLeechTask;