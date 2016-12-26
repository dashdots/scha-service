import ExecutorBase from './lib/ExecutorBase';
import ExitCodes from './lib/ExitCodes';
import TaskPool from './lib/TaskPool';
import ExecutorEvent from './lib/ExecutorEvent';
import Progress from './lib/Progress';
import Task from './lib/Task';
import TaskFactory from './lib/TaskFactory';
import TaskType from './lib/TaskType';
import ParentRemoteExecutor from './lib/ParentRemoteExecutor';
import ChildRemoteExecutorPool from './lib/ChildRemoteExecutorPool';
import webSocket from 'socket.io';
import webSocketClient from 'socket.io-client';
import express from 'express';
import util from 'util';
import Environment from './lib/Environment';

class Executor extends ExecutorBase {

  _parent;
  _childs;
  _waitForDispose = false;
  _taskPool;
  _idle = true;
  _initialized = false;
  _waitForExit = false;

  _onSIGINT() {
    this.exit({force:this._waitForExit});
  }

  _onSIGTERM() {
    this._forceExit({code: ExitCodes.FORCE_EXIT});
  }

  _onUncaughtException(err) {
    console.error(err);
    this.emit({event:ExecutorEvent.error, data:err});
    this._forceExit({code:ExitCodes.FATAL});
  }

  constructor() {
    super({executorProcess: process});
    process.stdin.resume();
    process.on('SIGINT', ::this._onSIGINT);
    process.on('SIGTERM', ::this._onSIGTERM);
    process.on('uncaughtException', ::this._onUncaughtException);
  }

  get parent() {return this._parent;}
  get childs() { return this._childs; }
  get identifier() {return super.identifier;}
  get idle() {return this._idle;}


  set track(value) {super.track = value;}
  get track() {
    let trackCombined = [];
    if(this._parent) {
      trackCombined = trackCombined.concat(this._parent.track);
    }
    const track = super.track;
    if(track && Array.isArray(track)) {
      trackCombined = trackCombined.concat(track);
    } else {
      trackCombined.push(track);
    }
    trackCombined.push({identifier:this.identifier, pid:this.id});
    return trackCombined;
  }

  dispatchTasks(type, tasks=[]) {
    if(type === TaskType.Local) {
      this._taskPool.loadTasks(tasks);
    } else if(type === TaskType.Remote) {
      if(!this._childs) {
        throw new Error('there\'s no remote child to handle remote tasks because child limit is 0')
      }
      this._childs.dispatchTasks(tasks);
    } else {
      throw new Error(`unknown task type: \`${type}\``);
    }
  }

  run() {
    if(!this._initialized || this._waitForExit) {
      return;
    }
    if(this._taskPool.idle) {
      // this.emit(ExecutorEvent.running);
      this._taskPool.run();
    }
  }

  initialize({identifier, dashboard:{port=5151}={}, task:{invokerLimit=1, factory}={}, child:{limit, paramsGenerator, params, modulePath}={}}, callback) {

    super.identifier = identifier;
    let err;
    try {
      if(!this._identifier) {
        throw new Error('`identifier` must be specified');
      }
      if(!factory) {
        throw new Error('task factory must be specified');
      }
      if(invokerLimit<1) {
        throw new Error(`task invoker limit cannot be \`${invokerLimit}\``);
      }

      const taskPool = this._taskPool = new TaskPool({invokerLimit, factory});
      taskPool.on(TaskPool.Events.progress, ::this._onTaskProgress);
      taskPool.on(TaskPool.Events.idle, ::this._onTaskIdle);
      taskPool.on(TaskPool.Events.running, ::this._onTaskRunning);

      if(ParentRemoteExecutor.isParentExist()) {
        this._parent = new ParentRemoteExecutor({child:this});
        // Receive parent process message
        this._parent.on(ExecutorEvent.run, ::this._onParentExecutorCommandRun);
        this._parent.on(ExecutorEvent.tasks, ::this._onParentExecutorCommandTasks);
      } else {
        this._createSocketServer(port);
      }

      if(limit > 0 && modulePath) {
        const childs = this._childs = new ChildRemoteExecutorPool({
          limit,
          params,
          modulePath,
          paramsGenerator,
          parentEnv: {
            pid: this.id,
                identifier: this.identifier,
                track: this.track,
          }
        });

        // Receive child process message
        childs.on(ExecutorEvent.progress, ::this._onChildProgress);
        childs.on(ExecutorEvent.exit, ::this._onChildExit);
        childs.on(ExecutorEvent.idle, ::this._onChildIdle);
      }


      const io = this._io = webSocketClient.connect(`http://127.0.0.1:${Environment.socketPort}`, {reconnect: true});

      io.on(SocketEvent.peer, ({id, event, data}={})=>{    // client -> [server -> client]
        if(id === this.id) {
          this.emit({event:ExecutorEvent.peer, data: {event, data}, callParent:false, sendSocket:false});
        }
      })
      io.on(SocketEvent.peer, ({id, event, data}={})=>{    // client -> [server -> client]
        if(id === this.id) {
          this.emit({event:ExecutorEvent.peer, data: {event, data}, callParent:false, sendSocket:false});
        }
      })

    } catch(e) {
      err = e;
    }

    return _promisifyCallback(callback, err, ()=>{
      this._initialized = true;
      this.emit({event:ExecutorEvent.initialized, data:{identifier:this.identifier, track:this.track, id:this.id}, callParent:true});
    });
  }

  // region parent event handlers
  _onParentExecutorCommandTasks(sender, {type, tasks}) { this.dispatchTasks(type, tasks); }
  _onParentExecutorCommandRun() { this.run(); }
  // endregion

  _onTaskProgress(sender, progress) {
    this.emit({event:ExecutorEvent.localProgress, data:progress, callParent:true});
    const totalProgress = new Progress(progress);
    if(this._childs) {
      totalProgress.increase(this._childs.progress);
    }
    this.emit({event:ExecutorEvent.progress, data:totalProgress, callParent:true});
  }

  _onTaskIdle() {
    if(!this._childs || this._childs.idle) {
      this._idle = true;
      this.emit({event:ExecutorEvent.idle, callParent:true});
      if(this._waitForExit) {
        this._cleanExit();
      }
    }
  }

  emitSocket({event, data}) {
    try {
      this._io.emit(SocketEvent.broadcast, {
        identifier: this.identifier,
        id: this.id,
        track: this.track,
        parentId: this._parent ? this._parent.id : null,
        uuid: Environment.uuid,
        progress: this.progress.toJSON(),
        localProgress: this._taskPool.progress.toJSON(),
        idle: this._idle,
        childs: this._childs ? this._childs.ids : [],
        event,
        data
      });
    } catch(e) {
      console.error(e);
    }
  }

  _emitSocket({sender, event, data}) {
    if(!sender) {
      sender = this;
    }

    try {
      this._io.emit(SocketEvent.broadcast, {
        identifier: sender.identifier,
        id: sender.id,
        track: sender.track,
        parentId: this._parent ? this._parent.id : null,
        uuid: Environment.uuid,
        progress: this.progress.toJSON(),
        localProgress: this._taskPool.progress.toJSON(),
        idle: this._idle,
        childs: this._childs ? this._childs.ids : [],
        event,
        data
      });
    } catch(e) {
      console.error(e);
    }
  }

  _onTaskRunning() {
    this._idle = false;
    this.emit({event:ExecutorEvent.running, callParent:true});
  }


  // region child event handlers
  _onChildExit(sender, {child, code}) {
    if(this._waitForExit && this._childs.count===0) {
      this._cleanExit();
    }
  }

  _onChildProgress(sender, progress) {
    const totalProgress = new Progress(progress);
    totalProgress.increase(this._taskPool.progress);
    this.emit({event:ExecutorEvent.progress, data:totalProgress, callParent:true});
  }

  _onChildIdle() {
    if(this._taskPool.idle) {
      this._idle = true;
      this.emit({event:ExecutorEvent.idle, callParent:true});

      if(this._waitForExit) {
        this._cleanExit();
      }
    }
  }
  // endregion

  exit({code, force=false}={}) {
    if(force) {
      this._forceExit({code});
    } else {
      if(!this._waitForExit) {
        this.emit({event:ExecutorEvent.exiting});
      }
      this._waitForExit = true;
      this._cleanExit({code});
    }
  }

  _forceExit({code=ExitCodes.FORCE_EXIT}={}) {
    if(this._childs) {
      this._childs.exit({code, force:true});
    }
    process.exit(code);
  }


  _cleanExit({code=ExitCodes.SUCCESS}={}) {
    if(this._waitForDispose) {
      return;
    }

    if(this._childs && this._childs.count!==0) {
      return;
    }

    if(!this._taskPool.idle) {
      this._taskPool.stop();
      return;
    }

    this._waitForDispose = true;
    const resolve = ()=>{
      process.exit(code);
    };
    if(this.listenerCount(ExecutorEvent.dispose) === 0) {
      resolve();
    } else {
      this.emit({event:ExecutorEvent.dispose, data:resolve});
    }
  }

  get progress() {
    return this._childs
        ? Progress.merge(this._taskPool.progress, this._childs.progress)
        : this._taskPool.progress;
  }


  emit({event, data, callParent=false, sendSocket=true}) {
    super.emit(event, data);

    if(sendSocket || callParent) {
      if(typeof(data)==='function') {
        data = util.format(data);
      }

      if(data && typeof(data)==='object' && !Array.isArray(data) && data.constructor!==Object) {
        if(data.toJSON) {
          data = data.toJSON();
        } else {
          data = util.format(data);
        }
      }
    }

    if(callParent) {
      this._remoteCallParent({event, data});
    }

    if(sendSocket) {
      this._emitSocket({sender:this, event, data})
    }
  }

  _remoteCallParent({event, data}) {
    if(this._parent) {
      this.remoteCall({target:this._parent, event, data});
    }
  }


  _createSocketServer(port) {
    Environment.socketPort = port;
    const dashboard = express();
    const server = http.createServer(dashboard);
    const io = webSocket(server);
    io.on(SocketEvent.connection, client=>{
      this._onSocketConnected(client);

      io.emit(SocketEvent.status, {
        uuid: Environment.uuid,
      });  // server ->> client : status

      client.emit(SocketEvent.message, {
        identifier: this.identifier,
        id: this.id,
        track: this.track,
        event: SocketEvent.report,
      });

      client.on(SocketEvent.message, dataPacket=>{
        if(dataPacket && typeof(dataPacket)==='object' && dataPacket.event) {
          const {event, data} = dataPacket;
          //this._onSocketEvent(client, event, data);
        }
      });

      client.on(SocketEvent.peer, dataPacket=>{  // client -> server: peer
        if(dataPacket && typeof(dataPacket)==='object' && dataPacket.id && dataPacket.event) {
          io.emit(SocketEvent.peer, dataPacket);
        }
      });
    });
    io.on(SocketEvent.error, error=>{
      this._onSocketError(error)
    });
    server.listen(port, ()=>{
      this._onServerListening()
    });
    dashboard.use(express.static(path.join(__dirname, '../../../public')));
  }

  _onServerListening() {
    console.log('socket:listening');
  }
  _onSocketConnected(client) {
    console.log('socket:connected');
  }
  _onSocketError(error) {
    console.error(error);
  }
  _onSocketDisconnect(client, data) {
  }
}

/**
 * Promisify callback with error & done
 * @param {?Function} callback
 * @param {?Function} err
 * @param {Function}done
 * @returns {Promise}
 */
function _promisifyCallback(callback, err, done) {
  if(callback && typeof(callback)!=='function') {
    throw new TypeError('callback should be function');
  }

  if(err && !callback) {
    return Promise.reject(err);
  }

  let promise = Promise.resolve(callback && callback.apply(undefined, err));
  if(!err) {
    promise = promise.then(done);
  }
  return promise;
}

const SocketEvent = {
  listening:'listening',
  connected:'connected',
  connection:'connection',
  disconnect:'disconnect',
  error:'error',
  message:'message',
  broadcast:'broadcast',
  peer:'peer',
  report:'report',
  status:'status',
};

export default new Executor();

export {
  Task,
  TaskType,
  TaskFactory,
  ExitCodes,
  ExecutorBase,
  ExecutorEvent
};