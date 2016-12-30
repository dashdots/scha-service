const BASE_TIME = new Date('2016/10/01').getTime();

export default class LeecherCache {
  opts = {};

  static getScore(page, item) {
    const timeTag = 70000-Math.floor(((Date.now()-BASE_TIME)/1000) / (12*3600));
    return `${page-1}${(item)+1000}${timeTag+10000}`-100010000;
  }

  constructor({leechType, name, listContentType, listLinkCount}) {
    name = name.toUpperCase();
    leechType = leechType.toUpperCase();
    /**
     OPTS:

     leechStoreKey
     resourceKey
     dumpIndexKey
     parsedKey
     dumpKey
     name
     listContentType
     listLinkCount
     */
  }

  async getListCount() {
    const {name, listLinkCount} = this.opts;
    const db = Cache.dumpDB;
    const totalPageCount = await db.zcardAsync(`DUMP_INDEX:${name}`);
    return Math.ceil(totalPageCount / listLinkCount);
  }


  async loadListDump({page, lang}={}) { throw new Error();}
  async loadPageDump({pageId, lang}={}) { throw new Error();}

}