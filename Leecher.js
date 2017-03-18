import {EventEmitter} from 'events';
import ProxyDistributor, {BannedError, InvalidError, ProxyDistributorEvent} from 'scha.dump.proxy';
import assert from 'assert';
import {readFile, writeFile, makeDirectory, exists, removeFile} from 'scha.lib/lib/fs';
import parseDOM from 'scha.lib/lib/DOM';
import LeechResult, {LeechResultSourceType} from 'scha.dump.sites/lib/LeechResult';
import Cache from './Cache';
import arrayUnique from 'scha.lib/lib/array/arrayUnique';
import JSON from 'scha.lib/lib/JSON';

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

export default class Leecher extends EventEmitter {

  get proxy() {
    return this._proxy;
  }

  get leechType() {
    return this._leechType;
  }

  get siteName() {
    return this._siteName;
  }

  get listOnly() {
    return this._listOnly;
  }

  get cookie() {
    return this._cookie;
  }

  get timeout() {
    return this._timeout;
  }

  get protocol() {
    return this._protocol;
  }

  get hostName() {
    return this._hostName;
  }

  get leechStoreKey() {
    return this._leechStoreKey;
  }

  get dumpIndexKey() {
    return this._dumpIndexKey;
  }

  get dumpKey() {
    return this._dumpKey;
  }

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
        DOM_DECODE_ENTITIES = false,
        LANG,
        bannedValidator,

        LIST_LINK_COUNT,
        LIST_CONTENT_TYPE = 'HTML',
        LIST_DOM_SELECTOR,
        LIST_DOM_REMOVAL_SELECTOR,
        listDomModifier,
        listValidator,
        listHeadersParser,
        listResConverter,
        getListUrl,
        parseListItem,

        PAGE_CONTENT_TYPE = 'HTML',
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
      listValidator = x => x && x.length > 1024 * 5;
    }
    listValidator = wrapValidator(listValidator);

    if(!pageValidator) {
      pageValidator = x => x && x.length > 1024 * 5;
    }
    pageValidator = wrapValidator(pageValidator);

    if(!bannedValidator) {
      bannedValidator = /your ip /i;
    }
    bannedValidator = wrapValidator(bannedValidator);

    this._siteName = NAME;
    this._lang = LANG;
    this._homeUrl = PROTOCOL + '://' + HOST_NAME.replace(/\/+$/, '') + '/';
    this._hostName = HOST_NAME;
    this._protocol = PROTOCOL;
    this._timeout = TIMEOUT;
    this._cookie = COOKIE;
    this._leechType = LEECH_TYPE;
    this._listOnly = LIST_ONLY;
    this._domDecodeEntities = DOM_DECODE_ENTITIES;
    this._bannedValidator = bannedValidator;
    this._proxy = new ProxyDistributor(NAME);
    this._proxy.on(ProxyDistributorEvent.notice, msg => this.emit(ProxyDistributorEvent.notice, msg));
    this._proxy.on(ProxyDistributorEvent.warning, msg => this.emit(ProxyDistributorEvent.warning, msg));

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
      resConverter = x => x.text();
    }

    const bannedValidator = this._bannedValidator;

    return async function (res) {
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

  _makeHeadersParser(headersParser = {}) {
    return page => {
      let headers = headersParser;
      headers = headers(page);
      return Object.assign({Cookie: this._cookie}, headers);
    };
  }

  async loadLeechResult({pageId}) {
    const db = Cache.dataDB;
    const lang = this._lang;
    //noinspection JSUnresolvedFunction
    const results = await db.hmgetAsync(
        this._leechStoreKey,
        this._listOnly ? `${pageId}.list` : [
              `${pageId}.list`,
              `${pageId}.page`
            ]
    );

    const merged = {lang, pageId, resources:{}, actors:[], genre:[], label:[]};
    results.forEach((result)=>{
      if(!result) {
        throw new Error(`\`${pageId}\` leech result incomplete`);
      }
      result = JSON.parse(result);

      if(result.resources) {
        Object.keys(result.resources).forEach(mediaType=>{
          if(!merged.resources.hasOwnProperty(mediaType)) {
            merged.resources[mediaType] = {};
          }
          Object.keys(result.resources[mediaType]).forEach(type=>{
            if(!merged.resources[mediaType].hasOwnProperty(type)) {
              merged.resources[mediaType][type] = [];
            }
            merged.resources[mediaType][type] = arrayUnique(merged.resources[mediaType][type].concat(result.resources[mediaType][type]||[]));
          })
        });
      }

      if(result.title) {
        merged.title = result.title;
      }

      if(result.intro) {
        merged.intro = result.intro;
      }

      if(result.studio) {
        merged.studio = result.studio;
      }

      if(result.director) {
        merged.director = result.director;
      }

      if(result.prefix) {
        merged.prefix = result.prefix;
      }

    });
    return merged;
  }

  async loadPageIdsByRange(begin, end) {
    if(begin >= 0) {
      if(end===undefined || end===false || end===null) {
        //noinspection JSUnresolvedFunction
        end = await Cache.dataDB.zcardAsync(this._dumpIndexKey)
      }
      if(end < begin) {
        return [];
      }
      //noinspection JSUnresolvedFunction
      return await Cache.dataDB.zrevrangeAsync(this._dumpIndexKey, begin, end);
    }
    return [];
  }

  async getListCount() {
    const db = Cache.dumpDB;
    //noinspection JSUnresolvedFunction
    const totalPageCount = await db.zcardAsync(this._dumpIndexKey);
    return Math.ceil(totalPageCount / this._listLinkCount);
  }

  _getListItemsDOM(content) {
    content = this._cleanHtml(content);

    const $ = parseDOM(content,{decodeEntities: this._domDecodeEntities});

    const main = $('.__DUMP__');
    let items;
    let newDump = !main.length;
    if(newDump) {
      items = $(this._listDomSelector);
    } else {
      items = main.find('>*');
    }

    if(!items.length) {
      throw new Error('list item DOM not existed')
    }

    if(newDump) {
      if(this._listDomModifier) {
        this._listDomModifier(items);
      }
      if(this._listDomRemovalSelector) {
        items.find(this._listDomRemovalSelector).remove();
      }
      //noinspection JSUnresolvedFunction
      main.addClass('__DUMP__');
      main.cleanDOM();
    }

    if(!items.length) {
      throw new Error('list item DOM not existed')
    }
    items.isNewDump = newDump;
    return items;
  }

  _getPageDOM(content) {
    content = this._cleanHtml(content);

    const $ = parseDOM(content,{decodeEntities: this._domDecodeEntities});

    let main = $('.__DUMP__');
    let newDump = !main.length;
    if(newDump) {
      main = $(this._pageDomSelector);
      if(!main.length) {
        throw new Error('page dom not existed')
      }
    }

    if(newDump) {
      if(this._pageDomModifier) {
        this._pageDomModifier(main);
      }
      if(this._pageDomRemovalSelector) {
        main.find(this._pageDomRemovalSelector).remove();
      }
      //noinspection JSUnresolvedFunction
      main.addClass('__DUMP__');
      main.cleanDOM();
    }

    if(!main.length) {
      throw new Error('page dom not existed')
    }
    return main;
  }

  _cleanHtml(content) {
    return content.replace(/href\s*=\s*"javascript:void\(0?\);?"/ig, 'href="#"')
                  .replace(/>\n?[\s\t]+\n?</g, '><')
                  .replace(/&nbsp;/g, ' ').replace(/\r/g, '\n').replace(/\n+/g, '\n').replace(/ {3,}/g, ' ')
                  .replace(new RegExp(this._homeUrl.replace('.', '\\.'), 'ig'), '/');
  }

  get listLinkCount() {return this._listLinkCount;}

  getListUrl(page) {
    return this._getListUrl(page).replace(/^\/+/, this._homeUrl);
  }

  getPageUrl(pageId) {
    return this._getPageUrl(pageId).replace(/^\/+/, this._homeUrl);
  }

  async _loadDumpFile({dumpFileDir, page, pageId}) {
    page = page || pageId;
    let content;
    this.emit(LeecherEvent.message, `load dump file: ${page}`);
    content = await readFile(`${dumpFileDir}/${page}`);
    return content;
  }


  async _fetchRemoteFile({dumpFileDir, url, page, pageId, resConverter, headersParser}) {
    page = page || pageId;
    this.emit(LeecherEvent.message, `fetch remote: ${page}`);
    let content = await this._proxy.fetch(url, {
      timeout: this._timeout,
      converter: resConverter,
      headers: headersParser(page),
    }, {notFoundRetries: 3});

    if(content) {
      try {
        if(!await exists(dumpFileDir)) {
          await makeDirectory(dumpFileDir);
        }
        this.emit(LeecherEvent.message, `write dump file: ${page}`);
        await writeFile(`${dumpFileDir}/${page}`, content);
      }
      catch (e) {
      }
    }
    return content;
  }

  async fetchListResult({page, dumpPath, loadDumpFile, loadDumpCache}) {
    let content;
    let dumpFileDir = `${dumpPath}/${this._siteName}/list`;

    // load dump cache
    if(loadDumpCache) {
      this.emit(LeecherEvent.message, `load dump cache: ${page}`);
      content = await this._loadListDump({page});
      if(!content) {
        this.emit(LeecherEvent.message, `dump cache not found: ${page}`);
      }
    }

    // load dump file
    if(!content && loadDumpFile) {
      content = await this._loadDumpFile({dumpFileDir, page, validator: this._listValidator});
    }

    // fetch from remote
    if(!content) {
      const url = this.getListUrl(page);
      content = await this._fetchRemoteFile({dumpFileDir, url, page, resConverter: this._listResConverter, headersParser: this._listHeadersParser});
    }

    assert(!!content,'content not null');

    let results = [];

    if(this._listContentType === 'JSON') {
      results = this._parseListItem(JSON.parse(content), {});
    }

    if(this._listContentType === 'HTML') {
      const items = this._getListItemsDOM(content);
      const self = this;
      items.travel(item=>{
        const result = new LeechResult('list', this._homeUrl);
        result.on('warning', msg=>{
          self.emit(LeecherEvent.leechLeak, msg);
        });

        if(self._parseListItem(item, {result})!==false) {
          if(result.pageId) {
            result.dump = item.outerHtml();
          } else {
            self.emit(LeecherEvent.leechLeak, `page id not found`);
          }
          results.push(result);
        }
      });
    }

    if(results.length!== this._listLinkCount) {
      this.emit(LeecherEvent.leechLeak, `list ${page} may miss pages (${results.length}/${this._listLinkCount})`)
    }

    if(results.length > 0) {
      await this._saveLeechResult({leechResultArray: results});
    }

    return results;
  }

  async _loadListDump({page}={}) {
    const db = Cache.dumpDB;
    const listContentType = this._listContentType;
    const listLinkCount = this._listLinkCount;
    const dumpIndexKey = this._dumpIndexKey;
    const dumpKey = this._dumpKey;
    const lang = this._lang;

    //const pageIds = await db.zRangeByScoreAsync(dumpIndexKey, (page-1)*1000000000, page*1000000000);
    //noinspection JSUnresolvedFunction
    const pageIds = await db.zrangeAsync(dumpIndexKey, Math.max(0,(page-1)*listLinkCount), Math.max(0, page*listLinkCount-1));

    if(pageIds.length) {
      //noinspection JSUnresolvedFunction
      let data = await db.hmgetAsync(dumpKey, pageIds.map(pageId=>`${pageId}.${lang}.overview`));
      data = data.filter(x=>!!x);

      if(data.length) {
        try {
          switch(listContentType) {
            case 'JSON':
              return `[${data.map(x=>zip.extract(x)).join(',')}]`;
            case 'HTML':
            default:
              return `<div class="__DUMP__">${data.map(x=>zip.extract(x)).join('')}</div>`;
              break;
          }

        } catch(e){ console.log(e)}
      }
    }
    return null;
  }


  async _loadPageDump({pageId}={}) {
    const dumpKey = this._dumpKey;
    const lang = this._lang;
    //noinspection JSUnresolvedFunction
    let data = await Cache.dumpDB.hgetAsync(dumpKey, `${pageId}.${lang}.detail`);
    if(data) {
      try {
        return zip.extract(data);
      } catch(e) {

      }
    }
  }


  async fetchPageResult({pageId, dumpPath, loadDumpFile, loadDumpCache}) {
    if(this._listOnly) {
      this.emit(LeecherEvent.message, 'list only leecher');
      return false;
    }

    let content;
    const dumpFileDir = `${dumpPath}/${this._siteName}/page`;

    // load dump cache
    if(loadDumpCache) {
      this.emit(LeecherEvent.message, `load dump cache: ${pageId}`);
      content = await this._loadPageDump({pageId});
      if(!content) {
        this.emit(LeecherEvent.message, `dump cache not found: ${pageId}`);
      }
    }

    // load dump file
    if(!content && loadDumpFile) {
      content = await this._loadDumpFile({dumpFileDir, pageId, validator: this._pageValidator});
    }

    // fetch from remote
    if(!content) {
      const url = this.getPageUrl(pageId);
      content = await this._fetchRemoteFile({dumpFileDir, url, pageId, resConverter: this._pageResConverter, headersParser: this._pageHeadersParser});
    }

    assert(!!content,'content not null');

    const dom = this._getPageDOM(content);
    const self = this;
    const result = new LeechResult('page', this._homeUrl);
    result.pageId = pageId;
    result.dump = dom.html();

    if(this._parsePage(dom, {pageId, result})===false) {
      throw new Error('page parse failed');
    }

    await this._saveLeechResult({leechResult:result});
    return result;
  }
}