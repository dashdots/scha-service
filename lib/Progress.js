import EventEmitter from './EventEmitter';
import {NotImplementError} from 'scha.lib/lib/errors';

const ProgressEvents = {
  changed:'changed'
};

class Progress extends EventEmitter {
  _total = 0;
  _success = 0;
  _failed = 0;

  get total() {return this._total;}

  get success() {return this._success;}

  get failed() {return this._failed;}

  get rest() {return this._total - this._success - this._failed;}

  get percent() { return this._total===0 ? 1 : (this._success + this._failed) / this._total; }

  increase({total=0, success=0, failed=0}) {
    const changed = total !== 0 || success !==0 || failed !==0;
    if(changed) {
      this._total += total;
      this._success += success;
      this._failed += failed;
      this.emit(Progress.Events.changed, this);
    }
  }

  static merge(...progressArray) {
    throw new NotImplementError();
  }

  toJSON() {
    const {total, success, failed, rest} = this;
    return {total, success, failed, rest};
  }
}

export default Progress;