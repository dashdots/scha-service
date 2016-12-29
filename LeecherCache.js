const BASE_TIME = new Date('2016/10/01').getTime();

export default class LeecherCache {
  static getScore(page, item) {
    const timeTag = 70000-Math.floor(((Date.now()-BASE_TIME)/1000) / (12*3600));
    return `${page-1}${(item)+1000}${timeTag+10000}`-100010000;
  }
}