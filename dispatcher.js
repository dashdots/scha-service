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

});