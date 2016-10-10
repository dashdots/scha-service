import {EventEmitter as EM} from 'events';

class EventEmitter extends EM {
  emit(event, data) {
    return super.emit(event, this, data);
  }
}

export default EventEmitter;