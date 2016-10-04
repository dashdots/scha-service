import uuid from 'scha.lib/lib/uuid';

let env = {socketPort:5151, uuid: uuid.v4()};

if(process.env.hasOwnProperty('EXECUTOR_ENV')) {
  env = JSON.parse(process.env['EXECUTOR_ENV']);
}

export default env;