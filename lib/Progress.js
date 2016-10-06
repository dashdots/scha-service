import EventEmitter from './EventEmitter';

const ProgressEvents = {
  changed:'changed'
};

class Progress extends EventEmitter {
  _total = 0;
  _success = 0;
  _failed = 0;
}

export default Progress;