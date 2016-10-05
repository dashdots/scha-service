/**
 * Process environment, used to pass message when child process startup
 */

import uuid from 'scha.lib/lib/uuid';

let env;

if(process.env.hasOwnProperty('EXECUTOR_ENV')) {
  env = JSON.parse(process.env['EXECUTOR_ENV']);
} else {
  env = {socketPort:5151, uuid: uuid.v4()};
}

export default env;