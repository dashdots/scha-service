/**
 * Leecher script loader
 */

import {BannedError, InvalidError} from 'scha.dump.proxy';
import stringHash from 'string-hash';
import BigNumber from 'bignumber.js';
import LeecherCache from './LeecherCache';
import parseDOM from 'scha.lib/lib/DOM';

// region tools
/**
 * Wrap regexp or function to validator
 * @param {RegExp|Function} validator
 * @returns {Function|Boolean}
 */
function _wrapValidator(validator) {
  if(validator instanceof RegExp) {
    return function(text) { return validator.test(text); }
  } else if(typeof(validator) === 'function') {
    return validator;
  }
  return false;
}

/**
 * Make a resource converter
 * @param {Function} listResConverter
 * @param {RegExp|Function} bannedValidator
 * @param {RegExp|Function} contentValidator
 * @returns {Function}
 */
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

/**
 * Make http headers parser
 * @param {Object} headersParser - an object container header key-value pairs
 * @param {String} COOKIE - set cookie string in header
 * @returns {function(*=)}
 */
function _makeHeadersParser(headersParser={}, COOKIE) {
  return page => {
    let headers = headersParser;
    if(typeof(headers)==='function') {
      headers = headers(page);
    }
    return Object.assign({Cookie:COOKIE}, headers);
  };
}

/**
 * load leecher scripts
 * @param {String} siteName
 * @returns {*}
 */
function _loadLeecher(siteName) {
  const leechModule = require(`scha.dump.sites/lib/${siteName}`);
  return leechModule;
}

/**
 * Generate hash key
 * @param {String} name
 * @param {String} key
 * @returns {string}
 */
function _hashKey(name, key) {
  let hash = stringHash(name+'|'+key);
  hash = new BigNumber(hash, 10);
  return hash.toString(62);
}

/**
 * Generate hash resource key
 * @param {String} name
 * @param {String} resource
 * @returns {string}
 * @private
 */
function _hashResource(name, resource){
  return _hashKey(name, resource.url);
}
// endregion

/**
 * Load page leecher
 * @param {String} siteName
 * @returns {Object}
 */
export function pageLeecherLoader(siteName) {
  const leecher = _loadLeecher(siteName);

  let {
      HOST_NAME, PROTOCOL, TIMEOUT, COOKIE, LEECH_TYPE, PAGE_LANG=['en'], PAGE_CONTENT_TYPE='HTML',
      PAGE_DOM_SELECTOR: DOM_SELECTOR,
      PAGE_DOM_REMOVAL_SELECTOR: DOM_REMOVAL_SELECTOR,
      LIST_ONLY=false,
      DOM_DECODE_ENTITIES=false,

      pageDomModifier: domModifier,
      bannedValidator,
      pageValidator,
      pageHeadersParser,
      pageResConverter,
      getPageUrl,
      parsePage: parse,
  } = leecher;

  LEECH_TYPE = LEECH_TYPE.toUpperCase();
  const NAME = siteName.toUpperCase();

  const HOME_URL = PROTOCOL+'://'+HOST_NAME.replace(/\/+$/,'')+'/';
  const resConverter = _makeResConverter(pageResConverter, bannedValidator, pageValidator);
  const headersParser = _makeHeadersParser(pageHeadersParser, COOKIE);
  const getUrl = (page, lang) => getPageUrl(page, lang).replace(/^\/+/,HOME_URL);
  const getSign = page => `${LEECH_TYPE}:${siteName}:${page}`;
  const cache = new LeecherCache(LEECH_TYPE, NAME);

  if(Array.isArray(DOM_REMOVAL_SELECTOR)) {
    DOM_REMOVAL_SELECTOR = DOM_REMOVAL_SELECTOR.join(',');
  }

  const getDOM = content => {
    content = content.replace(/href\s*=\s*"javascript:void\(0?\);?"/ig,'href="#"')
                     .replace(/&nbsp;/g,' ').replace(/\r/g,'\n').replace(/\n+/g,'\n').replace(/ {3,}/g,' ')
                     .replace(new RegExp(HOME_URL.replace('.','\\.'),'ig'), '/');

    const $ = parseDOM(content,{decodeEntities: DOM_DECODE_ENTITIES});

    let main = $('.__DUMP__');
    let newDump = !main.length;
    if(newDump) {
      main = $(DOM_SELECTOR);
      if(!main.length) {
        throw new Error('main not existed')
      }
    }

    if(newDump) {
      if(domModifier) {
        domModifier(main);
      }
      if(DOM_REMOVAL_SELECTOR) {
        main.find(DOM_REMOVAL_SELECTOR).remove();
      }
      main.addClass('__DUMP__');
      main.cleanDOM();
    }

    if(!main.length) {
      throw new Error('main not existed')
    }
    return main;
  };

  const getLeechResult = (content, lang, pageId, existedData)=>{
    const leechResult = new LeechResult(lang, HOME_URL);
    leechResult.pageId = pageId;
    const main = getDOM(content);
    if(parse(main, {lang, pageId, existedData, result:leechResult})===false) {
      throw new Error('page parse error');
    }
    return leechResult;
  };

  const leechResult = leecher.getLeechResult(lang, pageId);
  leechResult.on('warning', msg=>log.warn(`${pageId}.${lang} leechResult: ${msg}`));

  if(leecher.parse(main, {lang, pageId, existedData: mergedData, result:leechResult})===false) {
    throw new Error('page parse error');
  }

  return {
    HOST_NAME, PROTOCOL, TIMEOUT, COOKIE, LEECH_TYPE, LANG:PAGE_LANG, HOME_URL, NAME, CONTENT_TYPE: PAGE_CONTENT_TYPE,
    DOM_SELECTOR,
    DOM_REMOVAL_SELECTOR,
    LIST_ONLY,
    DOM_DECODE_ENTITIES,

    domModifier,
    resConverter,
    headersParser,
    getUrl,
    getSign,
    getDOM,
    getLeechResult,
    parse,
    _hashResource:x=>_hashResource(NAME,x),
    _hashKey:x=>_hashKey(NAME,x),
    cache,
  }
}

/**
 * Load list leecher
 * @param {String} siteName
 * @returns {Object}
 */
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
