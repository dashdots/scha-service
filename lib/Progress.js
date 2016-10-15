import EventEmitter from './EventEmitter';
import {NotImplementError} from 'scha.lib/lib/errors';


class Progress extends EventEmitter {
  static Events = {
    changed:'changed'
  };

  _total = 0;
  _success = 0;
  _failed = 0;

  get total() {return this._total;}

  get success() {return this._success;}

  get failed() {return this._failed;}

  get rest() {return this._total - this._success - this._failed;}

  get percent() { return this._total===0 ? 1 : (this._success + this._failed) / this._total; }

  constructor({total, success, failed}={}) {
    super();
    this.set({total, success, failed});
    this.emit(Progress.Events.changed, this);
  }

  set({total, success, failed}={}) {
    const changed = this._total - total !== 0 || this._success - success !==0 || this._failed - failed !==0;
    if(changed) {
      if(total !== undefined) {
        this._total = total;
      }
      if(success !== undefined) {
        this._success = success;
      }
      if(failed !== undefined) {
        this._failed = failed;
      }
      this.emit(Progress.Events.changed, this);
    }
  }

  increase({total=0, success=0, failed=0}) {
    const changed = total !== 0 || success !==0 || failed !==0;
    if(changed) {
      this._total += total;
      this._success += success;
      this._failed += failed;
      this.emit(Progress.Events.changed, this);
    }
  }

  toJSON() {
    const {total, success, failed, rest} = this;
    return {total, success, failed, rest};
  }

  static merge(...progressArray) {
    return progressArray.reduce((totalProgress,progress)=>{
      totalProgress.increase(progress);
      return totalProgress
    }, new Progress())
  }

}

export default Progress;