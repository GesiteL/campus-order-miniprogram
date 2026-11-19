// 公共工具方法

// 后端返回的图片路径形如 "../../images/001.png" 或 "../../../images/she.jpg"，
// 均以相对路径书写；而项目图片实际存放在 /images/images/ 目录下。
// 这里统一把任意图片路径转换为小程序可识别的绝对路径。
function imgUrl(p) {
  if (!p) return '';
  // 已经是网络地址或已修正过的绝对路径则原样返回
  if (/^https?:\/\//.test(p) || p.indexOf('/images/images/') === 0) {
    return p;
  }
  // 取文件名，拼接到实际存放目录
  const name = p.split('/').filter(Boolean).pop();
  return '/images/images/' + name;
}

module.exports = {
  imgUrl: imgUrl
};
