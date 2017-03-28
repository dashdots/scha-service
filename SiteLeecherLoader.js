import {BannedError, InvalidError} from 'scha.dump.proxy';

function _wrapValidator(validator) {
  if(validator instanceof RegExp) {
    return function(text) { return validator.test(text); }
  } else if(typeof(validator) === 'function') {
    return validator;
  }
  return false;
}

function _makeResConverter(listResConverter=x=>x.text(), bannedValidator=/your ip /i, contentValidator=x=>x && x.length>1024*5) {

  bannedValidator = _wrapValidator(bannedValidator);
  contentValidator = _wrapValidator(contentValidator);

  return async function(res) {
    const content = await listResConverter(res);
    if(bannedValidator(content)) {
      throw new BannedError();
    }
    if(!contentValidator(content)) {
      throw new InvalidError();
    }
    return content;
  };
}

function _makeHeadersParser(headersParser={}, COOKIE) {
  return page => {
    let headers = headersParser;
    if(typeof(headers)==='function') {
      headers = headers(page);
    }
    return Object.assign({Cookie:COOKIE}, headers);
  };
}