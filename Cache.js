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

  static get dumpCmd() { return this.dumpDB.multi(); }

  static get dataCmd() { return this.dataDB.multi(); }

  static get taskCmd() { return this.taskDB.multi(); }

  static get tempCmd() { return this.tempDB.multi(); }

  static async _runCmd(db, cmd, cb) {
    const execNow = !cmd;
    if(execNow) {
      cmd = db.multi();
    }
    await cb(cmd);
  }
  static async runDumpCmd(cmd, cb) {
    return await this._runCmd(this.dumpDB, cmd, cb);
  }

  static async runDataCmd(cmd, cb) {
    return await this._runCmd(this.dataDB, cmd, cb);
  }

  static async runTaskCmd(cmd, cb) {
    return await this._runCmd(this.taskDB, cmd, cb);
  }

  static async runProxyCmd(cmd, cb) {
    return await this._runCmd(this.proxyDB, cmd, cb);
  }

  static async runTempCmd(cmd, cb) {
    return await this._runCmd(this.tempDB, cmd, cb);
  }
}