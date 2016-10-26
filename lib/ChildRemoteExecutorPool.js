import Environment from './Environment';
import Progress from './Progress';

class ChildRemoteExecutorPool {
  _childs = [];
  _limit = 0;
  _idle = true;

  constructor({limit, params=[], modulePath}) {
    super();
    this._limit = limit;
    this._params = params;
    this._modulePath = modulePath;
  }

  get count() {
    return this._childs.length;
  }

  get progress() {
    return this._childs.reduce((progress,child)=>{
      progress.increase(child.progress);
      return progress;
    }, new Progress());
  }

  get idle() {
    return !this._childs.some(child=>!child.idle);
  }

  get ids() {
    return this._childs.map(child=>child.id);
  }

}

export default ChildRemoteExecutorPool;