import {TASK_DB, DUMP_DB, DATA_DB, TEMP_DB} from './configure';
import cacheDB from 'scha.service/lib/actions/cacheDB';

export default function getCache(db=0) {return cacheDB(db);}