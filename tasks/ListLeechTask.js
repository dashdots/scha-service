import Task from '../lib/Task';
import {readFile, writeFile, makeDirectory, exists} from 'scha.lib/lib/fs';
import {ProxyDistributorEvent} from 'scha.dump.proxy';
import executor from '../Executor';
import Leecher, {LeecherEvent} from '../Leecher';

let taskLog;

class ListLeechTask extends Task {

  leecher;
  log;

  constructor({name, rewriteDump=false, ignoreNext=false, loadDumpFile=false, loadDumpCache=true, force=false, leechPage=false, begin=0, end=0, page}) {
    super(...arguments);
    if(!taskLog) {
      taskLog = executor.log.child({name:'ListLeecher',id:this.id});
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
      this.log.trace(`fetch ${page}: ${msg}`);
    });
    this.leecher.proxy.on(ProxyDistributorEvent.warning, msg=>{
      this.log.warn(`fetch ${page}: ${msg}`);
    });


    this.on(Task.Events.success, ()=>{
      this.log.success(`leech ${page} success`);
    });
    this.on(Task.Events.failed, (sender, reason)=>{
      this.log.error(reason, `leech ${page} failed`);
    });
    this.on(Task.Events.complete,()=>{
      this.log.removeAllListeners('log');
    });
  }

  async run() {
    const {force, ignoreNext, page, loadDumpCache, loadDumpFile, rewriteDump} = this.fields;
    const log = this.log;

    let results = [];

    log.notice(`run task ${page} ${force?'force':''}`);
    try {
      results = await this.leecher.fetchListResult({page, dumpPath:DUMP_PATH, loadDumpCache, loadDumpFile, rewriteDump, force});
    } catch(e) {
      console.log(e);
      log.error(`BUG: ${page}, ${e.message}`);
      return this.failed();
    }

    return this.success();
  }
}

export default ListLeechTask;