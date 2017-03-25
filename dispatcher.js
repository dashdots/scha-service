import 'source-map-support/register';
import 'babel-polyfill';

import Log from 'scha.lib/lib/Log';
import executor from './Executor';
import LeecherTaskFactory from './LeecherTaskFactory';

import {database, searchEngine} from 'scha.db';

const log = new Log({name:'Dispatcher', logName:false, showPid:true});
const taskFactory = new LeecherTaskFactory();

executor.log = log;
executor.initialize({
  identifier:'Dispatcher',
  task:{
    invokerLimit:2,
    factory:taskFactory
  }
}, async err=>{

  function onPeerMessage(sender, {event, data}) {}

  executor.on(ExecutorEvent.dispose, (sender, resolve)=>{log.notice('dispose'); resolve();});
  executor.on(ExecutorEvent.running,()=>{log.notice('running')});
  executor.on(ExecutorEvent.exit,()=>{log.danger('exit')});
  executor.on(ExecutorEvent.exiting,()=>{log.attention('try exit, wait for dispose')});
  executor.on(ExecutorEvent.idle,()=>{log.notice('idle')});
  executor.on(ExecutorEvent.error,(sender, error)=>{log.error(error)});
  executor.on(ExecutorEvent.peer, onPeerMessage);

  await database.sync();
  await searchEngine.sync();

}).then(()=>{
  log.on('log', (data)=>{ executor.emitSocket({event:'log', data}); });

  log.notice('initialized');

  executor.run();

});