import {EventEmitter} from 'events';

function _wrapValidator(validator) {
  if(validator instanceof RegExp) {
    return function(text) { return !validator.test(text); }
  } else if(typeof(validator) === 'function') {
    return validator;
  }
  return false;
}
/**
 *
 * @enum
 */
export const LeecherEvent = {
  leechLeak: 'leechLeak',
  message: 'message',
};

export default class Leecher extends EventEmitter{


  _proxy;
  _leechType;
  _siteName;
  _listOnly;
  _cookie;
  _timeout;
  _protocol;
  _hostName;
  _leechStoreKey;
  _dumpIndexKey;
  _dumpKey;


  get proxy() {return this._proxy;}
  get leechType() {return this._leechType;}
  get siteName() {return this._siteName;}
  get listOnly() {return this._listOnly;}
  get cookie() {return this._cookie;}
  get timeout() {return this._timeout;}
  get protocol() {return this._protocol;}
  get hostName() {return this._hostName;}

  get leechStoreKey() {return this._leechStoreKey; }
  get dumpIndexKey(){ return this._dumpIndexKey; }
  get dumpKey(){ return this._dumpKey; }

  constructor(siteName) {
    super();
    const leecher = require(`scha.dump.sites/lib/${siteName}`);

    let {
        HOST_NAME,
        PROTOCOL,
        TIMEOUT,
        COOKIE,
        LEECH_TYPE,
        LIST_ONLY,
        DOM_DECODE_ENTITIES=false,
        LANG,
        bannedValidator,
        listDomModifier,
        listValidator,
        listHeadersParser,
        listResConverter,
        getListUrl,
        parseListItem,
        pageDomModifier,
        pageValidator,
        pageHeadersParser,
        pageResConverter,
        getPageUrl,
        parsePage,

    } = leecher;


    const NAME = siteName;
    this._siteName = NAME;
    this._lang = LANG;
    this._homeUrl = PROTOCOL+'://'+HOST_NAME.replace(/\/+$/,'')+'/';
    this._hostName = HOST_NAME;
    this._protocol = PROTOCOL;
    this._timeout = TIMEOUT;
    this._cookie = COOKIE;
    this._leechType = LEECH_TYPE;
    this._listOnly = LIST_ONLY;
    this._domDecodeEntities = DOM_DECODE_ENTITIES;
    if(!listValidator) {
      listValidator = x=>x && x.length>1024*5;
    }
    listValidator = _wrapValidator(listValidator);

    if(!pageValidator) {
      pageValidator = x=>x && x.length>1024*5;
    }
    pageValidator = _wrapValidator(pageValidator);

    if(!bannedValidator) {
      bannedValidator = /your ip /i;
    }
    bannedValidator = _wrapValidator(bannedValidator);
  }

  async getListCount() {
    const db = Cache.dumpDB;
    //noinspection JSUnresolvedFunction
    const totalPageCount = await db.zcardAsync(this._dumpIndexKey);
    return Math.ceil(totalPageCount / this._listLinkCount);
  }

  get listLinkCount() {return this._listLinkCount;}

  getListUrl(page) { return this._getListUrl(page).replace(/^\/+/, this._homeUrl);}

  getPageUrl(pageId) { return this._getPageUrl(pageId).replace(/^\/+/, this._homeUrl);}
}