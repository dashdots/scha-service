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
  }

  async run() {
    const {force, ignoreNext, page, loadDumpCache, loadDumpFile, rewriteDump} = this.fields;
    const log = this.log;
    let results = [];
    log.notice(`run task ${page} ${force?'force':''}`);
    results = await this.leecher.fetchListResult({page, dumpPath:DUMP_PATH, loadDumpCache, loadDumpFile, rewriteDump, force});
    return this.success();
  }
}

export default ListLeechTask;