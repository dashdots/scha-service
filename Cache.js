import {TASK_DB, DUMP_DB, DATA_DB, TEMP_DB} from './configure';
import cacheDB from 'scha.service/lib/actions/cacheDB';

export function getCache(db=0) {return cacheDB(db);}

export default class Cache {
  static get dumpDB() {
    return cacheDB(DUMP_DB);
  }

  static get dataDB() {
    return cacheDB(DATA_DB);
  }

  static get taskDB() {
    if(!this._taskDB) {
      this._taskDB = cacheDB(TASK_DB);
    }
    return this._taskDB;
  }

  static get tempDB() {
    return cacheDB(TEMP_DB);
  }
}