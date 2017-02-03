export const DATA_HOST = "http://svr.scha:5010";
export const TASK_DB = 4;
export const DUMP_DB = 5;
export const DATA_DB = 6;
export const TEMP_DB = 7;

export const HEAP_SNAPSHOT_REPORT_INTERVAL = 5 * 60 * 1000;

export const CLEANUP_CHECK_INTERVAL = 1000;
export const CLEANUP_TIMEOUT = 10 * 1000;
export const CLEANUP_FORCE_TIMEOUT = CLEANUP_TIMEOUT + 60 * 1000;

export const TASK_WATCHER_INTERVAL = 2*1000;

export const WORKER_PROCESS_LIMIT = 20;
export const WORKER_THREADS_LIMIT = 2;
export const WORKER_TASK_LIMIT = 10;
export const WORKER_RECYCLING_RUN_LOOP = 10;

export const WORKER_RECYCLING_TIME = 2*60*1000;

export const DUMP_PATH = '/data/dump';

export const PROXY_RETRY_DELAY = 5000;