import {TASK_DB, DUMP_DB, DATA_DB, TEMP_DB} from './configure';
import cacheDB from 'scha.service/lib/actions/cacheDB';

/**
 * get a directly cacheDB instance
 * @param {Number} db
 */
export function getCache(db=0) {return cacheDB(db);}

/**
 * Cache for Scha service
 */
export default class Cache {
  /**
   * get dump db instance
   * @return {CacheDB}
   */
  static get dumpDB() {
    return cacheDB(DUMP_DB);
  }

  /**
   * get data db instance
   * @return {CacheDB}
   */
  static get dataDB() {
    return cacheDB(DATA_DB);
  }

  /**
   * get task db instance
   * @return {CacheDB}
   */
  static get taskDB() {
    if(!this._taskDB) {
      this._taskDB = cacheDB(TASK_DB);
    }
    return this._taskDB;
  }

  /**
   * get temp db instance
   * @return {CacheDB}
   */
  static get tempDB() {
    return cacheDB(TEMP_DB);
  }

  /**
   * get dump db cmd instance
   * @return {CacheDBCmd}
   */
  static get dumpCmd() { return this.dumpDB.multi(); }

  /**
   * get data db cmd instance
   * @return {CacheDBCmd}
   */
  static get dataCmd() { return this.dataDB.multi(); }

  /**
   * get task db cmd instance
   * @return {CacheDBCmd}
   */
  static get taskCmd() { return this.taskDB.multi(); }

  /**
   * get temp db cmd instance
   * @return {CacheDBCmd}
   */
  static get tempCmd() { return this.tempDB.multi(); }

  /**
   * bulk run a cmd
   * @param {CacheDB} db
   * @param {CacheDBCmd} cmd
   * @param {Function} cb
   * @returns {Promise.<Object>}
   * @private
   */
  static async _runCmd(db, cmd, cb) {
    const execNow = !cmd;
    if(execNow) {
      cmd = db.multi();
    }
    await cb(cmd);
    if(execNow) {
      return await cmd.execAsync();
    }
  }

  /**
   * bulk run a dump cmd
   * @param {CacheDBCmd} cmd
   * @param {Function} cb
   * @returns {Promise.<Object>}
   * @private
   */
  static async runDumpCmd(cmd, cb) {
    return await this._runCmd(this.dumpDB, cmd, cb);
  }

  /**
   * bulk run a data cmd
   * @param {CacheDBCmd} cmd
   * @param {Function} cb
   * @returns {Promise.<Object>}
   * @private
   */
  static async runDataCmd(cmd, cb) {
    return await this._runCmd(this.dataDB, cmd, cb);
  }

  /**
   * bulk run a task cmd
   * @param {CacheDBCmd} cmd
   * @param {Function} cb
   * @returns {Promise.<Object>}
   * @private
   */
  static async runTaskCmd(cmd, cb) {
    return await this._runCmd(this.taskDB, cmd, cb);
  }

  /**
   * bulk run a proxy cmd
   * @param {CacheDBCmd} cmd
   * @param {Function} cb
   * @returns {Promise.<Object>}
   * @private
   */
  static async runProxyCmd(cmd, cb) {
    return await this._runCmd(this.proxyDB, cmd, cb);
  }


  /**
   * bulk run a temp cmd
   * @param {CacheDBCmd} cmd
   * @param {Function} cb
   * @returns {Promise.<Object>}
   * @private
   */
  static async runTempCmd(cmd, cb) {
    return await this._runCmd(this.tempDB, cmd, cb);
  }
}
