import EventEmitter from './EventEmitter';

/**
 * A progress event emitter
 */
class Progress extends EventEmitter{
  static Events = {
    changed:'changed'
  };

  /**
   * Count of tasks
   * @type {number}
   * @private
   */
  _total = 0;

  /**
   * Count of successes tasks
   * @type {number}
   * @private
   */
  _success = 0;

  /**
   * Count of failed tasks
   * @type {number}
   * @private
   */
  _failed = 0;

  /**
   * Get total tasks
   * @returns {Number}
   */
  get total() {return this._total;}

  /**
   * Get success tasks
   * @returns {Number}
   */
  get success() {return this._success;}

  /**
   * Get failed tasks
   * @returns {Number}
   */
  get failed() {return this._failed;}

  /**
   * Get rest(remain) tasks
   * @returns {Number}
   */
  get rest() {return this._total - this._success - this._failed;}

  /**
   * Get progress as percentage
   * @returns {Number}
   */
  get percent() { return this._total===0 ? 1 : (this._success + this._failed) / this._total; }

  /**
   * Set count of tasks
   * @param {Number} value
   */
  set total(value) {
    let changed = this._total !== value;
    if(changed) {
      this._total = value;
      this.emit(Progress.Events.changed, this);
    }
  }

  /**
   * Set count of success tasks
   * @param {Number} value
   */
  set success(value) {
    let changed = this._success !== value;
    if(changed) {
      this._success = value;
      this.emit(Progress.Events.changed, this);
    }
  }

  /**
   * Set count of failed tasks
   * @param {Number} value
   */
  set failed(value) {
    let changed = this._failed !== value;
    if(changed) {
      this._failed = value;
      this.emit(Progress.Events.changed, this);
    }
  }

  /**
   * Bulk set task count
   * @param {Number} total
   * @param {Number} success
   * @param {Number} failed
   */
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

  /**
   * Bulk increase task count
   * @param {Number} total
   * @param {Number} success
   * @param {Number} failed
   */
  increase({total=0, success=0, failed=0}) {
    const changed = total !== 0 || success !==0 || failed !==0;
    if(changed) {
      this._total += total;
      this._success += success;
      this._failed += failed;
      this.emit(Progress.Events.changed, this);
    }
  }

  /**
   * A progress event emitter
   * @param {number} total
   * @param {number} success
   * @param {number} failed
   */
  constructor({total=0, success=0, failed=0}={}) {
    super();
    this.set({total, success, failed});
    this.emit(Progress.Events.changed, this);
  }

  /**
   * Get pure object of progress
   * @returns {{total: Progress.total, success: Progress.success, failed: Progress.failed, rest: Progress.rest}}
   */
  toJSON() {
    const {total, success, failed, rest} = this;
    return {total, success, failed, rest};
  }

  /**
   * Merge several Progress instances into one
   * @param {Progress[]} progressArray
   */
  static merge(...progressArray) {
    return progressArray.reduce((totalProgress,progress)=>{
      totalProgress.increase(progress);
      return totalProgress
    }, new Progress())
  }
}

export default Progress;