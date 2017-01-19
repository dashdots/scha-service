import Cache from './Cache';
import JSON from 'scha.lib/lib/JSON';
import zip from 'scha.lib/lib/zip';

const BASE_TIME = new Date('2016/10/01').getTime();

/**
 * Leecher cache for Scha service
 */
export default class LeecherCache {

  /**
   * Get score from page & item count
   * @param {Number} page
   * @param {Number} item
   * @returns {number}
   */
  static getScore(page, item) {
    const timeTag = 70000-Math.floor(((Date.now()-BASE_TIME)/1000) / (12*3600));
    return `${page-1}${(item)+1000}${timeTag+10000}`-100010000;
  }

  /**
   *
   * Leecher cache for Scha service
   * @param {String} leechType
   * @param {String} name
   * @param {String} listContentType
   * @param {Number} listLinkCount
   */
  constructor({leechType, name, listContentType, listLinkCount}) {
    name = name.toUpperCase();
    leechType = leechType.toUpperCase();

    this.opts = {
      leechStoreKey: `${leechType}:${name}`,
      resourceKey: `RESOURCE:${name}`,
      dumpIndexKey: `DUMP_INDEX:${name}`,
      parsedKey: `PARSED:${name}`,
      dumpKey: `DUMP:${name}`,
      name,
      listContentType,
      listLinkCount
    }
  }

  /**
   * Get list count
   * @returns {Promise.<number>}
   */
  async getListCount() {
    const {name, listLinkCount} = this.opts;
    const db = Cache.dumpDB;
    const totalPageCount = await db.zcardAsync(`DUMP_INDEX:${name}`);
    return Math.ceil(totalPageCount / listLinkCount);
  }

  /**
   * Load list dump from db
   * @param {String} page
   * @param {String} lang
   * @returns {Promise.<*>}
   */
  async loadListDump({page, lang}={}) {
    const db = Cache.dumpDB;
    const {dumpIndexKey, dumpKey, name, listContentType, listLinkCount} = this.opts;

    const pageIds = await db.zrangeAsync(dumpIndexKey, Math.max(0,(page-1)*listLinkCount), Math.max(0, page*listLinkCount-1));

    if(pageIds.length) {
      let data = await db.hmgetAsync(dumpKey, ...pageIds.map(pageId=>`${pageId}.${lang}.overview`));
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

        } catch(e){}
      }
    }
    return null;
  }

  /**
   * Load page dump from db
   * @param {String} pageId
   * @param {String} lang
   * @returns {Promise.<String>}
   */
  async loadPageDump({pageId, lang}={}) {
    const {dumpKey} = this.opts;
    let data = await Cache.dumpDB.hgetAsync(dumpKey, `${pageId}.${lang}.detail`);
    if(data) {
      try {
        return zip.extract(data);
      } catch(e) {

      }
    }
  }

  /**
   * Get hashed ids from parsed pages
   * @param {Number[]} pageIds
   * @returns {Promise.<Array>}
   */
  async getHashedIdsParsed(pageIds=[]) {
    const dataCmd = Cache.dataCmd;
    pageIds.forEach(pageId=>dataCmd.sismember(this.opts.parsedKey, pageId));
    const rtn = await dataCmd.execAsync();
    return rtn.map(x=>!!x);
  }

  /**
   * Save leech result to db
   * @param {Cache} dataCmd
   * @param leechResult
   * @param leechResultArray
   * @returns {Promise.<void>}
   */
  async saveLeechResult({dataCmd, leechResult, leechResultArray=[]}={}) {
    //const allResources = {};
    let allDumpData = [];
    let allPageId = [];
    let allPageData = [];
    const {dumpKey, leechStoreKey, dumpIndexKey} = this.opts;

    if(!dataCmd) {
      dataCmd = Cache.dataCmd;
    }

    if(leechResult) {
      leechResultArray = [leechResult];
    }

    leechResultArray.forEach(leechResult=>{
      const keyName = `${leechResult.pageId}.${leechResult.sourceType}.${leechResult.lang}`;
      if(leechResult.dump) {
        allDumpData = allDumpData.concat([keyName, leechResult.dump]);
      }
      allPageData = allPageData.concat([keyName, JSON.stringify(leechResult.toJSON())]);
      allPageId = allPageId.concat([0, leechResult.pageId]);
    });

    if(allPageData.length) {
      await Cache.runDataCmd(dataCmd, function(cmd) {
        if(allDumpData.length) {
          cmd.hmset(dumpKey, allDumpData)
        }
        cmd.zadd(dumpIndexKey, allPageId, 0);
        cmd.hmset(leechStoreKey, allPageData);
      });
      //await this.saveResources({dataCmd, resourcesMapping: allResources});
      await dataCmd.execAsync();
    }
  }

  /**
   * Load leech result by page id
   * @param {Number} pageId
   * @returns {Promise.<?Object>}
   */
  async loadLeechResult(pageId) {
    const parsed = await Cache.dataDB.hgetAsync(this.opts.leechStoreKey, pageId);
    if(parsed) {
      try {
        return JSON.parse(parsed);
      } catch(e) {
      }
    }
  }

  /**
   * Load page id by range
   * @param {Number} begin
   * @param {Number} end
   * @returns {Promise.<?Object>}
   */
  async loadPageIdsByRange(begin, end) {
    if(begin >= 0) {
      if(end===undefined || end===false || end===null) {
        end = await Cache.dataDB.zcardAsync(this.opts.dumpIndexKey)
      }
      if(end < begin) {
        return [];
      }
      return await Cache.dataDB.zRevRangeAsync(this.opts.dumpIndexKey, begin, end);
    }
    return [];
  }

}