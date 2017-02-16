import {EventEmitter} from 'events';
import ProxyDistributor, {BannedError, InvalidError, ProxyDistributorEvent} from 'scha.dump.proxy';


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

        LIST_LINK_COUNT,
        LIST_CONTENT_TYPE='HTML',
        LIST_DOM_SELECTOR,
        LIST_DOM_REMOVAL_SELECTOR,
        listDomModifier,
        listValidator,
        listHeadersParser,
        listResConverter,
        getListUrl,
        parseListItem,

        PAGE_CONTENT_TYPE='HTML',
        PAGE_DOM_SELECTOR,
        PAGE_DOM_REMOVAL_SELECTOR,
        pageDomModifier,
        pageValidator,
        pageHeadersParser,
        pageResConverter,
        getPageUrl,
        parsePage,

    } = leecher;

    assert(LIST_CONTENT_TYPE !== 'JSON' || LIST_CONTENT_TYPE !== 'HTML', `unknown LIST_CONTENT_TYPE: ${LIST_CONTENT_TYPE}`);

    const NAME = siteName;
    LEECH_TYPE = LEECH_TYPE.toUpperCase();

    if(Array.isArray(LIST_DOM_REMOVAL_SELECTOR)) {
      LIST_DOM_REMOVAL_SELECTOR = LIST_DOM_REMOVAL_SELECTOR.join(',');
    }
    if(Array.isArray(PAGE_DOM_REMOVAL_SELECTOR)) {
      PAGE_DOM_REMOVAL_SELECTOR = PAGE_DOM_REMOVAL_SELECTOR.join(',');
    }
    if(!listValidator) {
      listValidator = x=>x && x.length>1024*5;
    }
    listValidator = wrapValidator(listValidator);

    if(!pageValidator) {
      pageValidator = x=>x && x.length>1024*5;
    }
    pageValidator = wrapValidator(pageValidator);

    if(!bannedValidator) {
      bannedValidator = /your ip /i;
    }
    bannedValidator = wrapValidator(bannedValidator);

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
    this._bannedValidator = bannedValidator;
    this._proxy = new ProxyDistributor(NAME);
    this._proxy.on(ProxyDistributorEvent.notice, msg=>this.emit(ProxyDistributorEvent.notice, msg));
    this._proxy.on(ProxyDistributorEvent.warning, msg=>this.emit(ProxyDistributorEvent.warning, msg));

    this._listLinkCount = LIST_LINK_COUNT;
    this._listContentType = LIST_CONTENT_TYPE;
    this._listDomSelector = LIST_DOM_SELECTOR;
    this._listDomRemovalSelector = LIST_DOM_REMOVAL_SELECTOR;
    this._listOnly = LIST_ONLY;
    this._listValidator = listValidator;
    this._listDomModifier = listDomModifier;
    this._listResConverter = this._makeResConverter(listResConverter, listValidator);
    this._listHeadersParser = this._makeHeadersParser(listHeadersParser);
    this._getListUrl = getListUrl;
    this._parseListItem = parseListItem;

    this._pageContentType = PAGE_CONTENT_TYPE;
    this._pageDomSelector = PAGE_DOM_SELECTOR;
    this._pageDomRemovalSelector = PAGE_DOM_REMOVAL_SELECTOR;
    this._pageDomModifier = pageDomModifier;
    this._pageValidator = pageValidator;
    this._pageResConverter = this._makeResConverter(pageResConverter, pageValidator);
    this._pageHeadersParser = this._makeHeadersParser(pageHeadersParser);
    this._getPageUrl = getPageUrl;
    this._parsePage = parsePage;

    this._leechStoreKey = `${LEECH_TYPE}:${NAME}`;
    this._dumpIndexKey = `DUMP_INDEX:${NAME}`;
    this._dumpKey = `DUMP:${NAME}`;
  }

  _makeResConverter(resConverter, contentValidator) {

    if(!resConverter) {
      resConverter = x=>x.text();
    }
    let bannedValidator = this._bannedValidator;

    return async function(res) {
      const content = await resConverter(res);
      if(!bannedValidator(content)) {
        throw new BannedError();
      }
      if(!contentValidator(content)) {
        throw new InvalidError();
      }
      return content;
    };
  }

  _makeHeadersParser(headersParser={}) {
    return page => {
      let headers = headersParser;
      headers = headers(page);
      return Object.assign({Cookie:this._cookie}, headers);
    };
  }

  async getListCount() {
    const db = Cache.dumpDB;
    //noinspection JSUnresolvedFunction
    const totalPageCount = await db.zcardAsync(this._dumpIndexKey);
    return Math.ceil(totalPageCount / this._listLinkCount);
  }

  _cleanHtml(content) {
    return content.replace(/href\s*=\s*"javascript:void\(0?\);?"/ig,'href="#"')
                  .replace(/>\n?[\s\t]+\n?</g,'><')
                  .replace(/&nbsp;/g,' ').replace(/\r/g,'\n').replace(/\n+/g,'\n').replace(/ {3,}/g,' ')
                  .replace(new RegExp(this._homeUrl.replace('.','\\.'),'ig'), '/');
  }

  get listLinkCount() {return this._listLinkCount;}

  getListUrl(page) { return this._getListUrl(page).replace(/^\/+/, this._homeUrl);}

  getPageUrl(pageId) { return this._getPageUrl(pageId).replace(/^\/+/, this._homeUrl);}
}