import EventEmitter from './EventEmitter';

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

  get remain() {return this._total - this._success - this._failed;}
}

export default Progress;