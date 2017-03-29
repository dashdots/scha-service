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

function _loadLeecher(siteName) {
  const leechModule = require(`scha.dump.sites/lib/${siteName}`);
  return leechModule;
}

function _hashKey(name, key) {
  let hash = stringHash(name+'|'+key);
  hash = new BigNumber(hash, 10);
  return hash.toString(62);
}

function _hashResource(name, resource){
  return _hashKey(name, resource.url);
}

export function listLeecherLoader(siteName) {
  const leecher = _loadLeecher(siteName);

  let {
      HOST_NAME, PROTOCOL, TIMEOUT, COOKIE, LEECH_TYPE, LIST_LANG=['en'], LIST_LINK_COUNT, LIST_CONTENT_TYPE='HTML',
      LIST_DOM_SELECTOR: DOM_SELECTOR,
      LIST_DOM_REMOVAL_SELECTOR: DOM_REMOVAL_SELECTOR,
      LIST_ONLY=false,
      DOM_DECODE_ENTITIES=false,

      listDomModifier: domModifier,
      bannedValidator,
      listValidator,
      listHeadersParser,
      listResConverter,
      getListUrl,
      parseListItem: parse,
  } = leecher;
  LEECH_TYPE = LEECH_TYPE.toUpperCase();

  const HOME_URL = PROTOCOL+'://'+HOST_NAME.replace(/\/+$/,'')+'/';
  const resConverter = _makeResConverter(listResConverter, bannedValidator, listValidator);
  const headersParser = _makeHeadersParser(listHeadersParser, COOKIE);
  const getUrl = list => getListUrl(list).replace(/^\/+/, HOME_URL);
  const getSign = list => `${LEECH_TYPE}:${siteName}:${list}`;
  const NAME = siteName.toUpperCase();

  if(Array.isArray(DOM_REMOVAL_SELECTOR)) {
    DOM_REMOVAL_SELECTOR = DOM_REMOVAL_SELECTOR.join(',');
  }

  return {
    HOST_NAME, PROTOCOL, TIMEOUT, COOKIE, LEECH_TYPE, LANG:LIST_LANG, HOME_URL, LIST_LINK_COUNT, NAME, CONTENT_TYPE: LIST_CONTENT_TYPE,
    DOM_SELECTOR,
    DOM_REMOVAL_SELECTOR,
    LIST_ONLY,
    DOM_DECODE_ENTITIES,

    domModifier,
    resConverter,
    headersParser,
    getUrl,
    getSign,
    parse,
    _hashResource:x=>_hashResource(NAME,x),
    _hashKey:x=>_hashKey(NAME,x),
  }
}
