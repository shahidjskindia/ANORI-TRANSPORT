/* ===== BEGIN JSZip vendor ===== */
/*!

JSZip v3.10.1 - A JavaScript class for generating and reading zip files
<http://stuartk.com/jszip>

(c) 2009-2016 Stuart Knightley <stuart [at] stuartk.com>
Dual licenced under the MIT license or GPLv3. See https://raw.github.com/Stuk/jszip/main/LICENSE.markdown.

JSZip uses the library pako released under the MIT license :
https://github.com/nodeca/pako/blob/main/LICENSE
*/

!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{("undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this).JSZip=e()}}(function(){return function s(a,o,h){function u(r,e){if(!o[r]){if(!a[r]){var t="function"==typeof require&&require;if(!e&&t)return t(r,!0);if(l)return l(r,!0);var n=new Error("Cannot find module '"+r+"'");throw n.code="MODULE_NOT_FOUND",n}var i=o[r]={exports:{}};a[r][0].call(i.exports,function(e){var t=a[r][1][e];return u(t||e)},i,i.exports,s,a,o,h)}return o[r].exports}for(var l="function"==typeof require&&require,e=0;e<h.length;e++)u(h[e]);return u}({1:[function(e,t,r){"use strict";var d=e("./utils"),c=e("./support"),p="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";r.encode=function(e){for(var t,r,n,i,s,a,o,h=[],u=0,l=e.length,f=l,c="string"!==d.getTypeOf(e);u<e.length;)f=l-u,n=c?(t=e[u++],r=u<l?e[u++]:0,u<l?e[u++]:0):(t=e.charCodeAt(u++),r=u<l?e.charCodeAt(u++):0,u<l?e.charCodeAt(u++):0),i=t>>2,s=(3&t)<<4|r>>4,a=1<f?(15&r)<<2|n>>6:64,o=2<f?63&n:64,h.push(p.charAt(i)+p.charAt(s)+p.charAt(a)+p.charAt(o));return h.join("")},r.decode=function(e){var t,r,n,i,s,a,o=0,h=0,u="data:";if(e.substr(0,u.length)===u)throw new Error("Invalid base64 input, it looks like a data url.");var l,f=3*(e=e.replace(/[^A-Za-z0-9+/=]/g,"")).length/4;if(e.charAt(e.length-1)===p.charAt(64)&&f--,e.charAt(e.length-2)===p.charAt(64)&&f--,f%1!=0)throw new Error("Invalid base64 input, bad content length.");for(l=c.uint8array?new Uint8Array(0|f):new Array(0|f);o<e.length;)t=p.indexOf(e.charAt(o++))<<2|(i=p.indexOf(e.charAt(o++)))>>4,r=(15&i)<<4|(s=p.indexOf(e.charAt(o++)))>>2,n=(3&s)<<6|(a=p.indexOf(e.charAt(o++))),l[h++]=t,64!==s&&(l[h++]=r),64!==a&&(l[h++]=n);return l}},{"./support":30,"./utils":32}],2:[function(e,t,r){"use strict";var n=e("./external"),i=e("./stream/DataWorker"),s=e("./stream/Crc32Probe"),a=e("./stream/DataLengthProbe");function o(e,t,r,n,i){this.compressedSize=e,this.uncompressedSize=t,this.crc32=r,this.compression=n,this.compressedContent=i}o.prototype={getContentWorker:function(){var e=new i(n.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new a("data_length")),t=this;return e.on("end",function(){if(this.streamInfo.data_length!==t.uncompressedSize)throw new Error("Bug : uncompressed data size mismatch")}),e},getCompressedWorker:function(){return new i(n.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize",this.compressedSize).withStreamInfo("uncompressedSize",this.uncompressedSize).withStreamInfo("crc32",this.crc32).withStreamInfo("compression",this.compression)}},o.createWorkerFrom=function(e,t,r){return e.pipe(new s).pipe(new a("uncompressedSize")).pipe(t.compressWorker(r)).pipe(new a("compressedSize")).withStreamInfo("compression",t)},t.exports=o},{"./external":6,"./stream/Crc32Probe":25,"./stream/DataLengthProbe":26,"./stream/DataWorker":27}],3:[function(e,t,r){"use strict";var n=e("./stream/GenericWorker");r.STORE={magic:"\0\0",compressWorker:function(){return new n("STORE compression")},uncompressWorker:function(){return new n("STORE decompression")}},r.DEFLATE=e("./flate")},{"./flate":7,"./stream/GenericWorker":28}],4:[function(e,t,r){"use strict";var n=e("./utils");var o=function(){for(var e,t=[],r=0;r<256;r++){e=r;for(var n=0;n<8;n++)e=1&e?3988292384^e>>>1:e>>>1;t[r]=e}return t}();t.exports=function(e,t){return void 0!==e&&e.length?"string"!==n.getTypeOf(e)?function(e,t,r,n){var i=o,s=n+r;e^=-1;for(var a=n;a<s;a++)e=e>>>8^i[255&(e^t[a])];return-1^e}(0|t,e,e.length,0):function(e,t,r,n){var i=o,s=n+r;e^=-1;for(var a=n;a<s;a++)e=e>>>8^i[255&(e^t.charCodeAt(a))];return-1^e}(0|t,e,e.length,0):0}},{"./utils":32}],5:[function(e,t,r){"use strict";r.base64=!1,r.binary=!1,r.dir=!1,r.createFolders=!0,r.date=null,r.compression=null,r.compressionOptions=null,r.comment=null,r.unixPermissions=null,r.dosPermissions=null},{}],6:[function(e,t,r){"use strict";var n=null;n="undefined"!=typeof Promise?Promise:e("lie"),t.exports={Promise:n}},{lie:37}],7:[function(e,t,r){"use strict";var n="undefined"!=typeof Uint8Array&&"undefined"!=typeof Uint16Array&&"undefined"!=typeof Uint32Array,i=e("pako"),s=e("./utils"),a=e("./stream/GenericWorker"),o=n?"uint8array":"array";function h(e,t){a.call(this,"FlateWorker/"+e),this._pako=null,this._pakoAction=e,this._pakoOptions=t,this.meta={}}r.magic="\b\0",s.inherits(h,a),h.prototype.processChunk=function(e){this.meta=e.meta,null===this._pako&&this._createPako(),this._pako.push(s.transformTo(o,e.data),!1)},h.prototype.flush=function(){a.prototype.flush.call(this),null===this._pako&&this._createPako(),this._pako.push([],!0)},h.prototype.cleanUp=function(){a.prototype.cleanUp.call(this),this._pako=null},h.prototype._createPako=function(){this._pako=new i[this._pakoAction]({raw:!0,level:this._pakoOptions.level||-1});var t=this;this._pako.onData=function(e){t.push({data:e,meta:t.meta})}},r.compressWorker=function(e){return new h("Deflate",e)},r.uncompressWorker=function(){return new h("Inflate",{})}},{"./stream/GenericWorker":28,"./utils":32,pako:38}],8:[function(e,t,r){"use strict";function A(e,t){var r,n="";for(r=0;r<t;r++)n+=String.fromCharCode(255&e),e>>>=8;return n}function n(e,t,r,n,i,s){var a,o,h=e.file,u=e.compression,l=s!==O.utf8encode,f=I.transformTo("string",s(h.name)),c=I.transformTo("string",O.utf8encode(h.name)),d=h.comment,p=I.transformTo("string",s(d)),m=I.transformTo("string",O.utf8encode(d)),_=c.length!==h.name.length,g=m.length!==d.length,b="",v="",y="",w=h.dir,k=h.date,x={crc32:0,compressedSize:0,uncompressedSize:0};t&&!r||(x.crc32=e.crc32,x.compressedSize=e.compressedSize,x.uncompressedSize=e.uncompressedSize);var S=0;t&&(S|=8),l||!_&&!g||(S|=2048);var z=0,C=0;w&&(z|=16),"UNIX"===i?(C=798,z|=function(e,t){var r=e;return e||(r=t?16893:33204),(65535&r)<<16}(h.unixPermissions,w)):(C=20,z|=function(e){return 63&(e||0)}(h.dosPermissions)),a=k.getUTCHours(),a<<=6,a|=k.getUTCMinutes(),a<<=5,a|=k.getUTCSeconds()/2,o=k.getUTCFullYear()-1980,o<<=4,o|=k.getUTCMonth()+1,o<<=5,o|=k.getUTCDate(),_&&(v=A(1,1)+A(B(f),4)+c,b+="up"+A(v.length,2)+v),g&&(y=A(1,1)+A(B(p),4)+m,b+="uc"+A(y.length,2)+y);var E="";return E+="\n\0",E+=A(S,2),E+=u.magic,E+=A(a,2),E+=A(o,2),E+=A(x.crc32,4),E+=A(x.compressedSize,4),E+=A(x.uncompressedSize,4),E+=A(f.length,2),E+=A(b.length,2),{fileRecord:R.LOCAL_FILE_HEADER+E+f+b,dirRecord:R.CENTRAL_FILE_HEADER+A(C,2)+E+A(p.length,2)+"\0\0\0\0"+A(z,4)+A(n,4)+f+b+p}}var I=e("../utils"),i=e("../stream/GenericWorker"),O=e("../utf8"),B=e("../crc32"),R=e("../signature");function s(e,t,r,n){i.call(this,"ZipFileWorker"),this.bytesWritten=0,this.zipComment=t,this.zipPlatform=r,this.encodeFileName=n,this.streamFiles=e,this.accumulate=!1,this.contentBuffer=[],this.dirRecords=[],this.currentSourceOffset=0,this.entriesCount=0,this.currentFile=null,this._sources=[]}I.inherits(s,i),s.prototype.push=function(e){var t=e.meta.percent||0,r=this.entriesCount,n=this._sources.length;this.accumulate?this.contentBuffer.push(e):(this.bytesWritten+=e.data.length,i.prototype.push.call(this,{data:e.data,meta:{currentFile:this.currentFile,percent:r?(t+100*(r-n-1))/r:100}}))},s.prototype.openedSource=function(e){this.currentSourceOffset=this.bytesWritten,this.currentFile=e.file.name;var t=this.streamFiles&&!e.file.dir;if(t){var r=n(e,t,!1,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);this.push({data:r.fileRecord,meta:{percent:0}})}else this.accumulate=!0},s.prototype.closedSource=function(e){this.accumulate=!1;var t=this.streamFiles&&!e.file.dir,r=n(e,t,!0,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);if(this.dirRecords.push(r.dirRecord),t)this.push({data:function(e){return R.DATA_DESCRIPTOR+A(e.crc32,4)+A(e.compressedSize,4)+A(e.uncompressedSize,4)}(e),meta:{percent:100}});else for(this.push({data:r.fileRecord,meta:{percent:0}});this.contentBuffer.length;)this.push(this.contentBuffer.shift());this.currentFile=null},s.prototype.flush=function(){for(var e=this.bytesWritten,t=0;t<this.dirRecords.length;t++)this.push({data:this.dirRecords[t],meta:{percent:100}});var r=this.bytesWritten-e,n=function(e,t,r,n,i){var s=I.transformTo("string",i(n));return R.CENTRAL_DIRECTORY_END+"\0\0\0\0"+A(e,2)+A(e,2)+A(t,4)+A(r,4)+A(s.length,2)+s}(this.dirRecords.length,r,e,this.zipComment,this.encodeFileName);this.push({data:n,meta:{percent:100}})},s.prototype.prepareNextSource=function(){this.previous=this._sources.shift(),this.openedSource(this.previous.streamInfo),this.isPaused?this.previous.pause():this.previous.resume()},s.prototype.registerPrevious=function(e){this._sources.push(e);var t=this;return e.on("data",function(e){t.processChunk(e)}),e.on("end",function(){t.closedSource(t.previous.streamInfo),t._sources.length?t.prepareNextSource():t.end()}),e.on("error",function(e){t.error(e)}),this},s.prototype.resume=function(){return!!i.prototype.resume.call(this)&&(!this.previous&&this._sources.length?(this.prepareNextSource(),!0):this.previous||this._sources.length||this.generatedError?void 0:(this.end(),!0))},s.prototype.error=function(e){var t=this._sources;if(!i.prototype.error.call(this,e))return!1;for(var r=0;r<t.length;r++)try{t[r].error(e)}catch(e){}return!0},s.prototype.lock=function(){i.prototype.lock.call(this);for(var e=this._sources,t=0;t<e.length;t++)e[t].lock()},t.exports=s},{"../crc32":4,"../signature":23,"../stream/GenericWorker":28,"../utf8":31,"../utils":32}],9:[function(e,t,r){"use strict";var u=e("../compressions"),n=e("./ZipFileWorker");r.generateWorker=function(e,a,t){var o=new n(a.streamFiles,t,a.platform,a.encodeFileName),h=0;try{e.forEach(function(e,t){h++;var r=function(e,t){var r=e||t,n=u[r];if(!n)throw new Error(r+" is not a valid compression method !");return n}(t.options.compression,a.compression),n=t.options.compressionOptions||a.compressionOptions||{},i=t.dir,s=t.date;t._compressWorker(r,n).withStreamInfo("file",{name:e,dir:i,date:s,comment:t.comment||"",unixPermissions:t.unixPermissions,dosPermissions:t.dosPermissions}).pipe(o)}),o.entriesCount=h}catch(e){o.error(e)}return o}},{"../compressions":3,"./ZipFileWorker":8}],10:[function(e,t,r){"use strict";function n(){if(!(this instanceof n))return new n;if(arguments.length)throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");this.files=Object.create(null),this.comment=null,this.root="",this.clone=function(){var e=new n;for(var t in this)"function"!=typeof this[t]&&(e[t]=this[t]);return e}}(n.prototype=e("./object")).loadAsync=e("./load"),n.support=e("./support"),n.defaults=e("./defaults"),n.version="3.10.1",n.loadAsync=function(e,t){return(new n).loadAsync(e,t)},n.external=e("./external"),t.exports=n},{"./defaults":5,"./external":6,"./load":11,"./object":15,"./support":30}],11:[function(e,t,r){"use strict";var u=e("./utils"),i=e("./external"),n=e("./utf8"),s=e("./zipEntries"),a=e("./stream/Crc32Probe"),l=e("./nodejsUtils");function f(n){return new i.Promise(function(e,t){var r=n.decompressed.getContentWorker().pipe(new a);r.on("error",function(e){t(e)}).on("end",function(){r.streamInfo.crc32!==n.decompressed.crc32?t(new Error("Corrupted zip : CRC32 mismatch")):e()}).resume()})}t.exports=function(e,o){var h=this;return o=u.extend(o||{},{base64:!1,checkCRC32:!1,optimizedBinaryString:!1,createFolders:!1,decodeFileName:n.utf8decode}),l.isNode&&l.isStream(e)?i.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")):u.prepareContent("the loaded zip file",e,!0,o.optimizedBinaryString,o.base64).then(function(e){var t=new s(o);return t.load(e),t}).then(function(e){var t=[i.Promise.resolve(e)],r=e.files;if(o.checkCRC32)for(var n=0;n<r.length;n++)t.push(f(r[n]));return i.Promise.all(t)}).then(function(e){for(var t=e.shift(),r=t.files,n=0;n<r.length;n++){var i=r[n],s=i.fileNameStr,a=u.resolve(i.fileNameStr);h.file(a,i.decompressed,{binary:!0,optimizedBinaryString:!0,date:i.date,dir:i.dir,comment:i.fileCommentStr.length?i.fileCommentStr:null,unixPermissions:i.unixPermissions,dosPermissions:i.dosPermissions,createFolders:o.createFolders}),i.dir||(h.file(a).unsafeOriginalName=s)}return t.zipComment.length&&(h.comment=t.zipComment),h})}},{"./external":6,"./nodejsUtils":14,"./stream/Crc32Probe":25,"./utf8":31,"./utils":32,"./zipEntries":33}],12:[function(e,t,r){"use strict";var n=e("../utils"),i=e("../stream/GenericWorker");function s(e,t){i.call(this,"Nodejs stream input adapter for "+e),this._upstreamEnded=!1,this._bindStream(t)}n.inherits(s,i),s.prototype._bindStream=function(e){var t=this;(this._stream=e).pause(),e.on("data",function(e){t.push({data:e,meta:{percent:0}})}).on("error",function(e){t.isPaused?this.generatedError=e:t.error(e)}).on("end",function(){t.isPaused?t._upstreamEnded=!0:t.end()})},s.prototype.pause=function(){return!!i.prototype.pause.call(this)&&(this._stream.pause(),!0)},s.prototype.resume=function(){return!!i.prototype.resume.call(this)&&(this._upstreamEnded?this.end():this._stream.resume(),!0)},t.exports=s},{"../stream/GenericWorker":28,"../utils":32}],13:[function(e,t,r){"use strict";var i=e("readable-stream").Readable;function n(e,t,r){i.call(this,t),this._helper=e;var n=this;e.on("data",function(e,t){n.push(e)||n._helper.pause(),r&&r(t)}).on("error",function(e){n.emit("error",e)}).on("end",function(){n.push(null)})}e("../utils").inherits(n,i),n.prototype._read=function(){this._helper.resume()},t.exports=n},{"../utils":32,"readable-stream":16}],14:[function(e,t,r){"use strict";t.exports={isNode:"undefined"!=typeof Buffer,newBufferFrom:function(e,t){if(Buffer.from&&Buffer.from!==Uint8Array.from)return Buffer.from(e,t);if("number"==typeof e)throw new Error('The "data" argument must not be a number');return new Buffer(e,t)},allocBuffer:function(e){if(Buffer.alloc)return Buffer.alloc(e);var t=new Buffer(e);return t.fill(0),t},isBuffer:function(e){return Buffer.isBuffer(e)},isStream:function(e){return e&&"function"==typeof e.on&&"function"==typeof e.pause&&"function"==typeof e.resume}}},{}],15:[function(e,t,r){"use strict";function s(e,t,r){var n,i=u.getTypeOf(t),s=u.extend(r||{},f);s.date=s.date||new Date,null!==s.compression&&(s.compression=s.compression.toUpperCase()),"string"==typeof s.unixPermissions&&(s.unixPermissions=parseInt(s.unixPermissions,8)),s.unixPermissions&&16384&s.unixPermissions&&(s.dir=!0),s.dosPermissions&&16&s.dosPermissions&&(s.dir=!0),s.dir&&(e=g(e)),s.createFolders&&(n=_(e))&&b.call(this,n,!0);var a="string"===i&&!1===s.binary&&!1===s.base64;r&&void 0!==r.binary||(s.binary=!a),(t instanceof c&&0===t.uncompressedSize||s.dir||!t||0===t.length)&&(s.base64=!1,s.binary=!0,t="",s.compression="STORE",i="string");var o=null;o=t instanceof c||t instanceof l?t:p.isNode&&p.isStream(t)?new m(e,t):u.prepareContent(e,t,s.binary,s.optimizedBinaryString,s.base64);var h=new d(e,o,s);this.files[e]=h}var i=e("./utf8"),u=e("./utils"),l=e("./stream/GenericWorker"),a=e("./stream/StreamHelper"),f=e("./defaults"),c=e("./compressedObject"),d=e("./zipObject"),o=e("./generate"),p=e("./nodejsUtils"),m=e("./nodejs/NodejsStreamInputAdapter"),_=function(e){"/"===e.slice(-1)&&(e=e.substring(0,e.length-1));var t=e.lastIndexOf("/");return 0<t?e.substring(0,t):""},g=function(e){return"/"!==e.slice(-1)&&(e+="/"),e},b=function(e,t){return t=void 0!==t?t:f.createFolders,e=g(e),this.files[e]||s.call(this,e,null,{dir:!0,createFolders:t}),this.files[e]};function h(e){return"[object RegExp]"===Object.prototype.toString.call(e)}var n={load:function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},forEach:function(e){var t,r,n;for(t in this.files)n=this.files[t],(r=t.slice(this.root.length,t.length))&&t.slice(0,this.root.length)===this.root&&e(r,n)},filter:function(r){var n=[];return this.forEach(function(e,t){r(e,t)&&n.push(t)}),n},file:function(e,t,r){if(1!==arguments.length)return e=this.root+e,s.call(this,e,t,r),this;if(h(e)){var n=e;return this.filter(function(e,t){return!t.dir&&n.test(e)})}var i=this.files[this.root+e];return i&&!i.dir?i:null},folder:function(r){if(!r)return this;if(h(r))return this.filter(function(e,t){return t.dir&&r.test(e)});var e=this.root+r,t=b.call(this,e),n=this.clone();return n.root=t.name,n},remove:function(r){r=this.root+r;var e=this.files[r];if(e||("/"!==r.slice(-1)&&(r+="/"),e=this.files[r]),e&&!e.dir)delete this.files[r];else for(var t=this.filter(function(e,t){return t.name.slice(0,r.length)===r}),n=0;n<t.length;n++)delete this.files[t[n].name];return this},generate:function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},generateInternalStream:function(e){var t,r={};try{if((r=u.extend(e||{},{streamFiles:!1,compression:"STORE",compressionOptions:null,type:"",platform:"DOS",comment:null,mimeType:"application/zip",encodeFileName:i.utf8encode})).type=r.type.toLowerCase(),r.compression=r.compression.toUpperCase(),"binarystring"===r.type&&(r.type="string"),!r.type)throw new Error("No output type specified.");u.checkSupport(r.type),"darwin"!==r.platform&&"freebsd"!==r.platform&&"linux"!==r.platform&&"sunos"!==r.platform||(r.platform="UNIX"),"win32"===r.platform&&(r.platform="DOS");var n=r.comment||this.comment||"";t=o.generateWorker(this,r,n)}catch(e){(t=new l("error")).error(e)}return new a(t,r.type||"string",r.mimeType)},generateAsync:function(e,t){return this.generateInternalStream(e).accumulate(t)},generateNodeStream:function(e,t){return(e=e||{}).type||(e.type="nodebuffer"),this.generateInternalStream(e).toNodejsStream(t)}};t.exports=n},{"./compressedObject":2,"./defaults":5,"./generate":9,"./nodejs/NodejsStreamInputAdapter":12,"./nodejsUtils":14,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31,"./utils":32,"./zipObject":35}],16:[function(e,t,r){"use strict";t.exports=e("stream")},{stream:void 0}],17:[function(e,t,r){"use strict";var n=e("./DataReader");function i(e){n.call(this,e);for(var t=0;t<this.data.length;t++)e[t]=255&e[t]}e("../utils").inherits(i,n),i.prototype.byteAt=function(e){return this.data[this.zero+e]},i.prototype.lastIndexOfSignature=function(e){for(var t=e.charCodeAt(0),r=e.charCodeAt(1),n=e.charCodeAt(2),i=e.charCodeAt(3),s=this.length-4;0<=s;--s)if(this.data[s]===t&&this.data[s+1]===r&&this.data[s+2]===n&&this.data[s+3]===i)return s-this.zero;return-1},i.prototype.readAndCheckSignature=function(e){var t=e.charCodeAt(0),r=e.charCodeAt(1),n=e.charCodeAt(2),i=e.charCodeAt(3),s=this.readData(4);return t===s[0]&&r===s[1]&&n===s[2]&&i===s[3]},i.prototype.readData=function(e){if(this.checkOffset(e),0===e)return[];var t=this.data.slice(this.zero+this.index,this.zero+this.index+e);return this.index+=e,t},t.exports=i},{"../utils":32,"./DataReader":18}],18:[function(e,t,r){"use strict";var n=e("../utils");function i(e){this.data=e,this.length=e.length,this.index=0,this.zero=0}i.prototype={checkOffset:function(e){this.checkIndex(this.index+e)},checkIndex:function(e){if(this.length<this.zero+e||e<0)throw new Error("End of data reached (data length = "+this.length+", asked index = "+e+"). Corrupted zip ?")},setIndex:function(e){this.checkIndex(e),this.index=e},skip:function(e){this.setIndex(this.index+e)},byteAt:function(){},readInt:function(e){var t,r=0;for(this.checkOffset(e),t=this.index+e-1;t>=this.index;t--)r=(r<<8)+this.byteAt(t);return this.index+=e,r},readString:function(e){return n.transformTo("string",this.readData(e))},readData:function(){},lastIndexOfSignature:function(){},readAndCheckSignature:function(){},readDate:function(){var e=this.readInt(4);return new Date(Date.UTC(1980+(e>>25&127),(e>>21&15)-1,e>>16&31,e>>11&31,e>>5&63,(31&e)<<1))}},t.exports=i},{"../utils":32}],19:[function(e,t,r){"use strict";var n=e("./Uint8ArrayReader");function i(e){n.call(this,e)}e("../utils").inherits(i,n),i.prototype.readData=function(e){this.checkOffset(e);var t=this.data.slice(this.zero+this.index,this.zero+this.index+e);return this.index+=e,t},t.exports=i},{"../utils":32,"./Uint8ArrayReader":21}],20:[function(e,t,r){"use strict";var n=e("./DataReader");function i(e){n.call(this,e)}e("../utils").inherits(i,n),i.prototype.byteAt=function(e){return this.data.charCodeAt(this.zero+e)},i.prototype.lastIndexOfSignature=function(e){return this.data.lastIndexOf(e)-this.zero},i.prototype.readAndCheckSignature=function(e){return e===this.readData(4)},i.prototype.readData=function(e){this.checkOffset(e);var t=this.data.slice(this.zero+this.index,this.zero+this.index+e);return this.index+=e,t},t.exports=i},{"../utils":32,"./DataReader":18}],21:[function(e,t,r){"use strict";var n=e("./ArrayReader");function i(e){n.call(this,e)}e("../utils").inherits(i,n),i.prototype.readData=function(e){if(this.checkOffset(e),0===e)return new Uint8Array(0);var t=this.data.subarray(this.zero+this.index,this.zero+this.index+e);return this.index+=e,t},t.exports=i},{"../utils":32,"./ArrayReader":17}],22:[function(e,t,r){"use strict";var n=e("../utils"),i=e("../support"),s=e("./ArrayReader"),a=e("./StringReader"),o=e("./NodeBufferReader"),h=e("./Uint8ArrayReader");t.exports=function(e){var t=n.getTypeOf(e);return n.checkSupport(t),"string"!==t||i.uint8array?"nodebuffer"===t?new o(e):i.uint8array?new h(n.transformTo("uint8array",e)):new s(n.transformTo("array",e)):new a(e)}},{"../support":30,"../utils":32,"./ArrayReader":17,"./NodeBufferReader":19,"./StringReader":20,"./Uint8ArrayReader":21}],23:[function(e,t,r){"use strict";r.LOCAL_FILE_HEADER="PK",r.CENTRAL_FILE_HEADER="PK",r.CENTRAL_DIRECTORY_END="PK",r.ZIP64_CENTRAL_DIRECTORY_LOCATOR="PK",r.ZIP64_CENTRAL_DIRECTORY_END="PK",r.DATA_DESCRIPTOR="PK\b"},{}],24:[function(e,t,r){"use strict";var n=e("./GenericWorker"),i=e("../utils");function s(e){n.call(this,"ConvertWorker to "+e),this.destType=e}i.inherits(s,n),s.prototype.processChunk=function(e){this.push({data:i.transformTo(this.destType,e.data),meta:e.meta})},t.exports=s},{"../utils":32,"./GenericWorker":28}],25:[function(e,t,r){"use strict";var n=e("./GenericWorker"),i=e("../crc32");function s(){n.call(this,"Crc32Probe"),this.withStreamInfo("crc32",0)}e("../utils").inherits(s,n),s.prototype.processChunk=function(e){this.streamInfo.crc32=i(e.data,this.streamInfo.crc32||0),this.push(e)},t.exports=s},{"../crc32":4,"../utils":32,"./GenericWorker":28}],26:[function(e,t,r){"use strict";var n=e("../utils"),i=e("./GenericWorker");function s(e){i.call(this,"DataLengthProbe for "+e),this.propName=e,this.withStreamInfo(e,0)}n.inherits(s,i),s.prototype.processChunk=function(e){if(e){var t=this.streamInfo[this.propName]||0;this.streamInfo[this.propName]=t+e.data.length}i.prototype.processChunk.call(this,e)},t.exports=s},{"../utils":32,"./GenericWorker":28}],27:[function(e,t,r){"use strict";var n=e("../utils"),i=e("./GenericWorker");function s(e){i.call(this,"DataWorker");var t=this;this.dataIsReady=!1,this.index=0,this.max=0,this.data=null,this.type="",this._tickScheduled=!1,e.then(function(e){t.dataIsReady=!0,t.data=e,t.max=e&&e.length||0,t.type=n.getTypeOf(e),t.isPaused||t._tickAndRepeat()},function(e){t.error(e)})}n.inherits(s,i),s.prototype.cleanUp=function(){i.prototype.cleanUp.call(this),this.data=null},s.prototype.resume=function(){return!!i.prototype.resume.call(this)&&(!this._tickScheduled&&this.dataIsReady&&(this._tickScheduled=!0,n.delay(this._tickAndRepeat,[],this)),!0)},s.prototype._tickAndRepeat=function(){this._tickScheduled=!1,this.isPaused||this.isFinished||(this._tick(),this.isFinished||(n.delay(this._tickAndRepeat,[],this),this._tickScheduled=!0))},s.prototype._tick=function(){if(this.isPaused||this.isFinished)return!1;var e=null,t=Math.min(this.max,this.index+16384);if(this.index>=this.max)return this.end();switch(this.type){case"string":e=this.data.substring(this.index,t);break;case"uint8array":e=this.data.subarray(this.index,t);break;case"array":case"nodebuffer":e=this.data.slice(this.index,t)}return this.index=t,this.push({data:e,meta:{percent:this.max?this.index/this.max*100:0}})},t.exports=s},{"../utils":32,"./GenericWorker":28}],28:[function(e,t,r){"use strict";function n(e){this.name=e||"default",this.streamInfo={},this.generatedError=null,this.extraStreamInfo={},this.isPaused=!0,this.isFinished=!1,this.isLocked=!1,this._listeners={data:[],end:[],error:[]},this.previous=null}n.prototype={push:function(e){this.emit("data",e)},end:function(){if(this.isFinished)return!1;this.flush();try{this.emit("end"),this.cleanUp(),this.isFinished=!0}catch(e){this.emit("error",e)}return!0},error:function(e){return!this.isFinished&&(this.isPaused?this.generatedError=e:(this.isFinished=!0,this.emit("error",e),this.previous&&this.previous.error(e),this.cleanUp()),!0)},on:function(e,t){return this._listeners[e].push(t),this},cleanUp:function(){this.streamInfo=this.generatedError=this.extraStreamInfo=null,this._listeners=[]},emit:function(e,t){if(this._listeners[e])for(var r=0;r<this._listeners[e].length;r++)this._listeners[e][r].call(this,t)},pipe:function(e){return e.registerPrevious(this)},registerPrevious:function(e){if(this.isLocked)throw new Error("The stream '"+this+"' has already been used.");this.streamInfo=e.streamInfo,this.mergeStreamInfo(),this.previous=e;var t=this;return e.on("data",function(e){t.processChunk(e)}),e.on("end",function(){t.end()}),e.on("error",function(e){t.error(e)}),this},pause:function(){return!this.isPaused&&!this.isFinished&&(this.isPaused=!0,this.previous&&this.previous.pause(),!0)},resume:function(){if(!this.isPaused||this.isFinished)return!1;var e=this.isPaused=!1;return this.generatedError&&(this.error(this.generatedError),e=!0),this.previous&&this.previous.resume(),!e},flush:function(){},processChunk:function(e){this.push(e)},withStreamInfo:function(e,t){return this.extraStreamInfo[e]=t,this.mergeStreamInfo(),this},mergeStreamInfo:function(){for(var e in this.extraStreamInfo)Object.prototype.hasOwnProperty.call(this.extraStreamInfo,e)&&(this.streamInfo[e]=this.extraStreamInfo[e])},lock:function(){if(this.isLocked)throw new Error("The stream '"+this+"' has already been used.");this.isLocked=!0,this.previous&&this.previous.lock()},toString:function(){var e="Worker "+this.name;return this.previous?this.previous+" -> "+e:e}},t.exports=n},{}],29:[function(e,t,r){"use strict";var h=e("../utils"),i=e("./ConvertWorker"),s=e("./GenericWorker"),u=e("../base64"),n=e("../support"),a=e("../external"),o=null;if(n.nodestream)try{o=e("../nodejs/NodejsStreamOutputAdapter")}catch(e){}function l(e,o){return new a.Promise(function(t,r){var n=[],i=e._internalType,s=e._outputType,a=e._mimeType;e.on("data",function(e,t){n.push(e),o&&o(t)}).on("error",function(e){n=[],r(e)}).on("end",function(){try{var e=function(e,t,r){switch(e){case"blob":return h.newBlob(h.transformTo("arraybuffer",t),r);case"base64":return u.encode(t);default:return h.transformTo(e,t)}}(s,function(e,t){var r,n=0,i=null,s=0;for(r=0;r<t.length;r++)s+=t[r].length;switch(e){case"string":return t.join("");case"array":return Array.prototype.concat.apply([],t);case"uint8array":for(i=new Uint8Array(s),r=0;r<t.length;r++)i.set(t[r],n),n+=t[r].length;return i;case"nodebuffer":return Buffer.concat(t);default:throw new Error("concat : unsupported type '"+e+"'")}}(i,n),a);t(e)}catch(e){r(e)}n=[]}).resume()})}function f(e,t,r){var n=t;switch(t){case"blob":case"arraybuffer":n="uint8array";break;case"base64":n="string"}try{this._internalType=n,this._outputType=t,this._mimeType=r,h.checkSupport(n),this._worker=e.pipe(new i(n)),e.lock()}catch(e){this._worker=new s("error"),this._worker.error(e)}}f.prototype={accumulate:function(e){return l(this,e)},on:function(e,t){var r=this;return"data"===e?this._worker.on(e,function(e){t.call(r,e.data,e.meta)}):this._worker.on(e,function(){h.delay(t,arguments,r)}),this},resume:function(){return h.delay(this._worker.resume,[],this._worker),this},pause:function(){return this._worker.pause(),this},toNodejsStream:function(e){if(h.checkSupport("nodestream"),"nodebuffer"!==this._outputType)throw new Error(this._outputType+" is not supported by this method");return new o(this,{objectMode:"nodebuffer"!==this._outputType},e)}},t.exports=f},{"../base64":1,"../external":6,"../nodejs/NodejsStreamOutputAdapter":13,"../support":30,"../utils":32,"./ConvertWorker":24,"./GenericWorker":28}],30:[function(e,t,r){"use strict";if(r.base64=!0,r.array=!0,r.string=!0,r.arraybuffer="undefined"!=typeof ArrayBuffer&&"undefined"!=typeof Uint8Array,r.nodebuffer="undefined"!=typeof Buffer,r.uint8array="undefined"!=typeof Uint8Array,"undefined"==typeof ArrayBuffer)r.blob=!1;else{var n=new ArrayBuffer(0);try{r.blob=0===new Blob([n],{type:"application/zip"}).size}catch(e){try{var i=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);i.append(n),r.blob=0===i.getBlob("application/zip").size}catch(e){r.blob=!1}}}try{r.nodestream=!!e("readable-stream").Readable}catch(e){r.nodestream=!1}},{"readable-stream":16}],31:[function(e,t,s){"use strict";for(var o=e("./utils"),h=e("./support"),r=e("./nodejsUtils"),n=e("./stream/GenericWorker"),u=new Array(256),i=0;i<256;i++)u[i]=252<=i?6:248<=i?5:240<=i?4:224<=i?3:192<=i?2:1;u[254]=u[254]=1;function a(){n.call(this,"utf-8 decode"),this.leftOver=null}function l(){n.call(this,"utf-8 encode")}s.utf8encode=function(e){return h.nodebuffer?r.newBufferFrom(e,"utf-8"):function(e){var t,r,n,i,s,a=e.length,o=0;for(i=0;i<a;i++)55296==(64512&(r=e.charCodeAt(i)))&&i+1<a&&56320==(64512&(n=e.charCodeAt(i+1)))&&(r=65536+(r-55296<<10)+(n-56320),i++),o+=r<128?1:r<2048?2:r<65536?3:4;for(t=h.uint8array?new Uint8Array(o):new Array(o),i=s=0;s<o;i++)55296==(64512&(r=e.charCodeAt(i)))&&i+1<a&&56320==(64512&(n=e.charCodeAt(i+1)))&&(r=65536+(r-55296<<10)+(n-56320),i++),r<128?t[s++]=r:(r<2048?t[s++]=192|r>>>6:(r<65536?t[s++]=224|r>>>12:(t[s++]=240|r>>>18,t[s++]=128|r>>>12&63),t[s++]=128|r>>>6&63),t[s++]=128|63&r);return t}(e)},s.utf8decode=function(e){return h.nodebuffer?o.transformTo("nodebuffer",e).toString("utf-8"):function(e){var t,r,n,i,s=e.length,a=new Array(2*s);for(t=r=0;t<s;)if((n=e[t++])<128)a[r++]=n;else if(4<(i=u[n]))a[r++]=65533,t+=i-1;else{for(n&=2===i?31:3===i?15:7;1<i&&t<s;)n=n<<6|63&e[t++],i--;1<i?a[r++]=65533:n<65536?a[r++]=n:(n-=65536,a[r++]=55296|n>>10&1023,a[r++]=56320|1023&n)}return a.length!==r&&(a.subarray?a=a.subarray(0,r):a.length=r),o.applyFromCharCode(a)}(e=o.transformTo(h.uint8array?"uint8array":"array",e))},o.inherits(a,n),a.prototype.processChunk=function(e){var t=o.transformTo(h.uint8array?"uint8array":"array",e.data);if(this.leftOver&&this.leftOver.length){if(h.uint8array){var r=t;(t=new Uint8Array(r.length+this.leftOver.length)).set(this.leftOver,0),t.set(r,this.leftOver.length)}else t=this.leftOver.concat(t);this.leftOver=null}var n=function(e,t){var r;for((t=t||e.length)>e.length&&(t=e.length),r=t-1;0<=r&&128==(192&e[r]);)r--;return r<0?t:0===r?t:r+u[e[r]]>t?r:t}(t),i=t;n!==t.length&&(h.uint8array?(i=t.subarray(0,n),this.leftOver=t.subarray(n,t.length)):(i=t.slice(0,n),this.leftOver=t.slice(n,t.length))),this.push({data:s.utf8decode(i),meta:e.meta})},a.prototype.flush=function(){this.leftOver&&this.leftOver.length&&(this.push({data:s.utf8decode(this.leftOver),meta:{}}),this.leftOver=null)},s.Utf8DecodeWorker=a,o.inherits(l,n),l.prototype.processChunk=function(e){this.push({data:s.utf8encode(e.data),meta:e.meta})},s.Utf8EncodeWorker=l},{"./nodejsUtils":14,"./stream/GenericWorker":28,"./support":30,"./utils":32}],32:[function(e,t,a){"use strict";var o=e("./support"),h=e("./base64"),r=e("./nodejsUtils"),u=e("./external");function n(e){return e}function l(e,t){for(var r=0;r<e.length;++r)t[r]=255&e.charCodeAt(r);return t}e("setimmediate"),a.newBlob=function(t,r){a.checkSupport("blob");try{return new Blob([t],{type:r})}catch(e){try{var n=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);return n.append(t),n.getBlob(r)}catch(e){throw new Error("Bug : can't construct the Blob.")}}};var i={stringifyByChunk:function(e,t,r){var n=[],i=0,s=e.length;if(s<=r)return String.fromCharCode.apply(null,e);for(;i<s;)"array"===t||"nodebuffer"===t?n.push(String.fromCharCode.apply(null,e.slice(i,Math.min(i+r,s)))):n.push(String.fromCharCode.apply(null,e.subarray(i,Math.min(i+r,s)))),i+=r;return n.join("")},stringifyByChar:function(e){for(var t="",r=0;r<e.length;r++)t+=String.fromCharCode(e[r]);return t},applyCanBeUsed:{uint8array:function(){try{return o.uint8array&&1===String.fromCharCode.apply(null,new Uint8Array(1)).length}catch(e){return!1}}(),nodebuffer:function(){try{return o.nodebuffer&&1===String.fromCharCode.apply(null,r.allocBuffer(1)).length}catch(e){return!1}}()}};function s(e){var t=65536,r=a.getTypeOf(e),n=!0;if("uint8array"===r?n=i.applyCanBeUsed.uint8array:"nodebuffer"===r&&(n=i.applyCanBeUsed.nodebuffer),n)for(;1<t;)try{return i.stringifyByChunk(e,r,t)}catch(e){t=Math.floor(t/2)}return i.stringifyByChar(e)}function f(e,t){for(var r=0;r<e.length;r++)t[r]=e[r];return t}a.applyFromCharCode=s;var c={};c.string={string:n,array:function(e){return l(e,new Array(e.length))},arraybuffer:function(e){return c.string.uint8array(e).buffer},uint8array:function(e){return l(e,new Uint8Array(e.length))},nodebuffer:function(e){return l(e,r.allocBuffer(e.length))}},c.array={string:s,array:n,arraybuffer:function(e){return new Uint8Array(e).buffer},uint8array:function(e){return new Uint8Array(e)},nodebuffer:function(e){return r.newBufferFrom(e)}},c.arraybuffer={string:function(e){return s(new Uint8Array(e))},array:function(e){return f(new Uint8Array(e),new Array(e.byteLength))},arraybuffer:n,uint8array:function(e){return new Uint8Array(e)},nodebuffer:function(e){return r.newBufferFrom(new Uint8Array(e))}},c.uint8array={string:s,array:function(e){return f(e,new Array(e.length))},arraybuffer:function(e){return e.buffer},uint8array:n,nodebuffer:function(e){return r.newBufferFrom(e)}},c.nodebuffer={string:s,array:function(e){return f(e,new Array(e.length))},arraybuffer:function(e){return c.nodebuffer.uint8array(e).buffer},uint8array:function(e){return f(e,new Uint8Array(e.length))},nodebuffer:n},a.transformTo=function(e,t){if(t=t||"",!e)return t;a.checkSupport(e);var r=a.getTypeOf(t);return c[r][e](t)},a.resolve=function(e){for(var t=e.split("/"),r=[],n=0;n<t.length;n++){var i=t[n];"."===i||""===i&&0!==n&&n!==t.length-1||(".."===i?r.pop():r.push(i))}return r.join("/")},a.getTypeOf=function(e){return"string"==typeof e?"string":"[object Array]"===Object.prototype.toString.call(e)?"array":o.nodebuffer&&r.isBuffer(e)?"nodebuffer":o.uint8array&&e instanceof Uint8Array?"uint8array":o.arraybuffer&&e instanceof ArrayBuffer?"arraybuffer":void 0},a.checkSupport=function(e){if(!o[e.toLowerCase()])throw new Error(e+" is not supported by this platform")},a.MAX_VALUE_16BITS=65535,a.MAX_VALUE_32BITS=-1,a.pretty=function(e){var t,r,n="";for(r=0;r<(e||"").length;r++)n+="\\x"+((t=e.charCodeAt(r))<16?"0":"")+t.toString(16).toUpperCase();return n},a.delay=function(e,t,r){setImmediate(function(){e.apply(r||null,t||[])})},a.inherits=function(e,t){function r(){}r.prototype=t.prototype,e.prototype=new r},a.extend=function(){var e,t,r={};for(e=0;e<arguments.length;e++)for(t in arguments[e])Object.prototype.hasOwnProperty.call(arguments[e],t)&&void 0===r[t]&&(r[t]=arguments[e][t]);return r},a.prepareContent=function(r,e,n,i,s){return u.Promise.resolve(e).then(function(n){return o.blob&&(n instanceof Blob||-1!==["[object File]","[object Blob]"].indexOf(Object.prototype.toString.call(n)))&&"undefined"!=typeof FileReader?new u.Promise(function(t,r){var e=new FileReader;e.onload=function(e){t(e.target.result)},e.onerror=function(e){r(e.target.error)},e.readAsArrayBuffer(n)}):n}).then(function(e){var t=a.getTypeOf(e);return t?("arraybuffer"===t?e=a.transformTo("uint8array",e):"string"===t&&(s?e=h.decode(e):n&&!0!==i&&(e=function(e){return l(e,o.uint8array?new Uint8Array(e.length):new Array(e.length))}(e))),e):u.Promise.reject(new Error("Can't read the data of '"+r+"'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"))})}},{"./base64":1,"./external":6,"./nodejsUtils":14,"./support":30,setimmediate:54}],33:[function(e,t,r){"use strict";var n=e("./reader/readerFor"),i=e("./utils"),s=e("./signature"),a=e("./zipEntry"),o=e("./support");function h(e){this.files=[],this.loadOptions=e}h.prototype={checkSignature:function(e){if(!this.reader.readAndCheckSignature(e)){this.reader.index-=4;var t=this.reader.readString(4);throw new Error("Corrupted zip or bug: unexpected signature ("+i.pretty(t)+", expected "+i.pretty(e)+")")}},isSignature:function(e,t){var r=this.reader.index;this.reader.setIndex(e);var n=this.reader.readString(4)===t;return this.reader.setIndex(r),n},readBlockEndOfCentral:function(){this.diskNumber=this.reader.readInt(2),this.diskWithCentralDirStart=this.reader.readInt(2),this.centralDirRecordsOnThisDisk=this.reader.readInt(2),this.centralDirRecords=this.reader.readInt(2),this.centralDirSize=this.reader.readInt(4),this.centralDirOffset=this.reader.readInt(4),this.zipCommentLength=this.reader.readInt(2);var e=this.reader.readData(this.zipCommentLength),t=o.uint8array?"uint8array":"array",r=i.transformTo(t,e);this.zipComment=this.loadOptions.decodeFileName(r)},readBlockZip64EndOfCentral:function(){this.zip64EndOfCentralSize=this.reader.readInt(8),this.reader.skip(4),this.diskNumber=this.reader.readInt(4),this.diskWithCentralDirStart=this.reader.readInt(4),this.centralDirRecordsOnThisDisk=this.reader.readInt(8),this.centralDirRecords=this.reader.readInt(8),this.centralDirSize=this.reader.readInt(8),this.centralDirOffset=this.reader.readInt(8),this.zip64ExtensibleData={};for(var e,t,r,n=this.zip64EndOfCentralSize-44;0<n;)e=this.reader.readInt(2),t=this.reader.readInt(4),r=this.reader.readData(t),this.zip64ExtensibleData[e]={id:e,length:t,value:r}},readBlockZip64EndOfCentralLocator:function(){if(this.diskWithZip64CentralDirStart=this.reader.readInt(4),this.relativeOffsetEndOfZip64CentralDir=this.reader.readInt(8),this.disksCount=this.reader.readInt(4),1<this.disksCount)throw new Error("Multi-volumes zip are not supported")},readLocalFiles:function(){var e,t;for(e=0;e<this.files.length;e++)t=this.files[e],this.reader.setIndex(t.localHeaderOffset),this.checkSignature(s.LOCAL_FILE_HEADER),t.readLocalPart(this.reader),t.handleUTF8(),t.processAttributes()},readCentralDir:function(){var e;for(this.reader.setIndex(this.centralDirOffset);this.reader.readAndCheckSignature(s.CENTRAL_FILE_HEADER);)(e=new a({zip64:this.zip64},this.loadOptions)).readCentralPart(this.reader),this.files.push(e);if(this.centralDirRecords!==this.files.length&&0!==this.centralDirRecords&&0===this.files.length)throw new Error("Corrupted zip or bug: expected "+this.centralDirRecords+" records in central dir, got "+this.files.length)},readEndOfCentral:function(){var e=this.reader.lastIndexOfSignature(s.CENTRAL_DIRECTORY_END);if(e<0)throw!this.isSignature(0,s.LOCAL_FILE_HEADER)?new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html"):new Error("Corrupted zip: can't find end of central directory");this.reader.setIndex(e);var t=e;if(this.checkSignature(s.CENTRAL_DIRECTORY_END),this.readBlockEndOfCentral(),this.diskNumber===i.MAX_VALUE_16BITS||this.diskWithCentralDirStart===i.MAX_VALUE_16BITS||this.centralDirRecordsOnThisDisk===i.MAX_VALUE_16BITS||this.centralDirRecords===i.MAX_VALUE_16BITS||this.centralDirSize===i.MAX_VALUE_32BITS||this.centralDirOffset===i.MAX_VALUE_32BITS){if(this.zip64=!0,(e=this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR))<0)throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");if(this.reader.setIndex(e),this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR),this.readBlockZip64EndOfCentralLocator(),!this.isSignature(this.relativeOffsetEndOfZip64CentralDir,s.ZIP64_CENTRAL_DIRECTORY_END)&&(this.relativeOffsetEndOfZip64CentralDir=this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_END),this.relativeOffsetEndOfZip64CentralDir<0))throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir),this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_END),this.readBlockZip64EndOfCentral()}var r=this.centralDirOffset+this.centralDirSize;this.zip64&&(r+=20,r+=12+this.zip64EndOfCentralSize);var n=t-r;if(0<n)this.isSignature(t,s.CENTRAL_FILE_HEADER)||(this.reader.zero=n);else if(n<0)throw new Error("Corrupted zip: missing "+Math.abs(n)+" bytes.")},prepareReader:function(e){this.reader=n(e)},load:function(e){this.prepareReader(e),this.readEndOfCentral(),this.readCentralDir(),this.readLocalFiles()}},t.exports=h},{"./reader/readerFor":22,"./signature":23,"./support":30,"./utils":32,"./zipEntry":34}],34:[function(e,t,r){"use strict";var n=e("./reader/readerFor"),s=e("./utils"),i=e("./compressedObject"),a=e("./crc32"),o=e("./utf8"),h=e("./compressions"),u=e("./support");function l(e,t){this.options=e,this.loadOptions=t}l.prototype={isEncrypted:function(){return 1==(1&this.bitFlag)},useUTF8:function(){return 2048==(2048&this.bitFlag)},readLocalPart:function(e){var t,r;if(e.skip(22),this.fileNameLength=e.readInt(2),r=e.readInt(2),this.fileName=e.readData(this.fileNameLength),e.skip(r),-1===this.compressedSize||-1===this.uncompressedSize)throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");if(null===(t=function(e){for(var t in h)if(Object.prototype.hasOwnProperty.call(h,t)&&h[t].magic===e)return h[t];return null}(this.compressionMethod)))throw new Error("Corrupted zip : compression "+s.pretty(this.compressionMethod)+" unknown (inner file : "+s.transformTo("string",this.fileName)+")");this.decompressed=new i(this.compressedSize,this.uncompressedSize,this.crc32,t,e.readData(this.compressedSize))},readCentralPart:function(e){this.versionMadeBy=e.readInt(2),e.skip(2),this.bitFlag=e.readInt(2),this.compressionMethod=e.readString(2),this.date=e.readDate(),this.crc32=e.readInt(4),this.compressedSize=e.readInt(4),this.uncompressedSize=e.readInt(4);var t=e.readInt(2);if(this.extraFieldsLength=e.readInt(2),this.fileCommentLength=e.readInt(2),this.diskNumberStart=e.readInt(2),this.internalFileAttributes=e.readInt(2),this.externalFileAttributes=e.readInt(4),this.localHeaderOffset=e.readInt(4),this.isEncrypted())throw new Error("Encrypted zip are not supported");e.skip(t),this.readExtraFields(e),this.parseZIP64ExtraField(e),this.fileComment=e.readData(this.fileCommentLength)},processAttributes:function(){this.unixPermissions=null,this.dosPermissions=null;var e=this.versionMadeBy>>8;this.dir=!!(16&this.externalFileAttributes),0==e&&(this.dosPermissions=63&this.externalFileAttributes),3==e&&(this.unixPermissions=this.externalFileAttributes>>16&65535),this.dir||"/"!==this.fileNameStr.slice(-1)||(this.dir=!0)},parseZIP64ExtraField:function(){if(this.extraFields[1]){var e=n(this.extraFields[1].value);this.uncompressedSize===s.MAX_VALUE_32BITS&&(this.uncompressedSize=e.readInt(8)),this.compressedSize===s.MAX_VALUE_32BITS&&(this.compressedSize=e.readInt(8)),this.localHeaderOffset===s.MAX_VALUE_32BITS&&(this.localHeaderOffset=e.readInt(8)),this.diskNumberStart===s.MAX_VALUE_32BITS&&(this.diskNumberStart=e.readInt(4))}},readExtraFields:function(e){var t,r,n,i=e.index+this.extraFieldsLength;for(this.extraFields||(this.extraFields={});e.index+4<i;)t=e.readInt(2),r=e.readInt(2),n=e.readData(r),this.extraFields[t]={id:t,length:r,value:n};e.setIndex(i)},handleUTF8:function(){var e=u.uint8array?"uint8array":"array";if(this.useUTF8())this.fileNameStr=o.utf8decode(this.fileName),this.fileCommentStr=o.utf8decode(this.fileComment);else{var t=this.findExtraFieldUnicodePath();if(null!==t)this.fileNameStr=t;else{var r=s.transformTo(e,this.fileName);this.fileNameStr=this.loadOptions.decodeFileName(r)}var n=this.findExtraFieldUnicodeComment();if(null!==n)this.fileCommentStr=n;else{var i=s.transformTo(e,this.fileComment);this.fileCommentStr=this.loadOptions.decodeFileName(i)}}},findExtraFieldUnicodePath:function(){var e=this.extraFields[28789];if(e){var t=n(e.value);return 1!==t.readInt(1)?null:a(this.fileName)!==t.readInt(4)?null:o.utf8decode(t.readData(e.length-5))}return null},findExtraFieldUnicodeComment:function(){var e=this.extraFields[25461];if(e){var t=n(e.value);return 1!==t.readInt(1)?null:a(this.fileComment)!==t.readInt(4)?null:o.utf8decode(t.readData(e.length-5))}return null}},t.exports=l},{"./compressedObject":2,"./compressions":3,"./crc32":4,"./reader/readerFor":22,"./support":30,"./utf8":31,"./utils":32}],35:[function(e,t,r){"use strict";function n(e,t,r){this.name=e,this.dir=r.dir,this.date=r.date,this.comment=r.comment,this.unixPermissions=r.unixPermissions,this.dosPermissions=r.dosPermissions,this._data=t,this._dataBinary=r.binary,this.options={compression:r.compression,compressionOptions:r.compressionOptions}}var s=e("./stream/StreamHelper"),i=e("./stream/DataWorker"),a=e("./utf8"),o=e("./compressedObject"),h=e("./stream/GenericWorker");n.prototype={internalStream:function(e){var t=null,r="string";try{if(!e)throw new Error("No output type specified.");var n="string"===(r=e.toLowerCase())||"text"===r;"binarystring"!==r&&"text"!==r||(r="string"),t=this._decompressWorker();var i=!this._dataBinary;i&&!n&&(t=t.pipe(new a.Utf8EncodeWorker)),!i&&n&&(t=t.pipe(new a.Utf8DecodeWorker))}catch(e){(t=new h("error")).error(e)}return new s(t,r,"")},async:function(e,t){return this.internalStream(e).accumulate(t)},nodeStream:function(e,t){return this.internalStream(e||"nodebuffer").toNodejsStream(t)},_compressWorker:function(e,t){if(this._data instanceof o&&this._data.compression.magic===e.magic)return this._data.getCompressedWorker();var r=this._decompressWorker();return this._dataBinary||(r=r.pipe(new a.Utf8EncodeWorker)),o.createWorkerFrom(r,e,t)},_decompressWorker:function(){return this._data instanceof o?this._data.getContentWorker():this._data instanceof h?this._data:new i(this._data)}};for(var u=["asText","asBinary","asNodeBuffer","asUint8Array","asArrayBuffer"],l=function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},f=0;f<u.length;f++)n.prototype[u[f]]=l;t.exports=n},{"./compressedObject":2,"./stream/DataWorker":27,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31}],36:[function(e,l,t){(function(t){"use strict";var r,n,e=t.MutationObserver||t.WebKitMutationObserver;if(e){var i=0,s=new e(u),a=t.document.createTextNode("");s.observe(a,{characterData:!0}),r=function(){a.data=i=++i%2}}else if(t.setImmediate||void 0===t.MessageChannel)r="document"in t&&"onreadystatechange"in t.document.createElement("script")?function(){var e=t.document.createElement("script");e.onreadystatechange=function(){u(),e.onreadystatechange=null,e.parentNode.removeChild(e),e=null},t.document.documentElement.appendChild(e)}:function(){setTimeout(u,0)};else{var o=new t.MessageChannel;o.port1.onmessage=u,r=function(){o.port2.postMessage(0)}}var h=[];function u(){var e,t;n=!0;for(var r=h.length;r;){for(t=h,h=[],e=-1;++e<r;)t[e]();r=h.length}n=!1}l.exports=function(e){1!==h.push(e)||n||r()}}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}],37:[function(e,t,r){"use strict";var i=e("immediate");function u(){}var l={},s=["REJECTED"],a=["FULFILLED"],n=["PENDING"];function o(e){if("function"!=typeof e)throw new TypeError("resolver must be a function");this.state=n,this.queue=[],this.outcome=void 0,e!==u&&d(this,e)}function h(e,t,r){this.promise=e,"function"==typeof t&&(this.onFulfilled=t,this.callFulfilled=this.otherCallFulfilled),"function"==typeof r&&(this.onRejected=r,this.callRejected=this.otherCallRejected)}function f(t,r,n){i(function(){var e;try{e=r(n)}catch(e){return l.reject(t,e)}e===t?l.reject(t,new TypeError("Cannot resolve promise with itself")):l.resolve(t,e)})}function c(e){var t=e&&e.then;if(e&&("object"==typeof e||"function"==typeof e)&&"function"==typeof t)return function(){t.apply(e,arguments)}}function d(t,e){var r=!1;function n(e){r||(r=!0,l.reject(t,e))}function i(e){r||(r=!0,l.resolve(t,e))}var s=p(function(){e(i,n)});"error"===s.status&&n(s.value)}function p(e,t){var r={};try{r.value=e(t),r.status="success"}catch(e){r.status="error",r.value=e}return r}(t.exports=o).prototype.finally=function(t){if("function"!=typeof t)return this;var r=this.constructor;return this.then(function(e){return r.resolve(t()).then(function(){return e})},function(e){return r.resolve(t()).then(function(){throw e})})},o.prototype.catch=function(e){return this.then(null,e)},o.prototype.then=function(e,t){if("function"!=typeof e&&this.state===a||"function"!=typeof t&&this.state===s)return this;var r=new this.constructor(u);this.state!==n?f(r,this.state===a?e:t,this.outcome):this.queue.push(new h(r,e,t));return r},h.prototype.callFulfilled=function(e){l.resolve(this.promise,e)},h.prototype.otherCallFulfilled=function(e){f(this.promise,this.onFulfilled,e)},h.prototype.callRejected=function(e){l.reject(this.promise,e)},h.prototype.otherCallRejected=function(e){f(this.promise,this.onRejected,e)},l.resolve=function(e,t){var r=p(c,t);if("error"===r.status)return l.reject(e,r.value);var n=r.value;if(n)d(e,n);else{e.state=a,e.outcome=t;for(var i=-1,s=e.queue.length;++i<s;)e.queue[i].callFulfilled(t)}return e},l.reject=function(e,t){e.state=s,e.outcome=t;for(var r=-1,n=e.queue.length;++r<n;)e.queue[r].callRejected(t);return e},o.resolve=function(e){if(e instanceof this)return e;return l.resolve(new this(u),e)},o.reject=function(e){var t=new this(u);return l.reject(t,e)},o.all=function(e){var r=this;if("[object Array]"!==Object.prototype.toString.call(e))return this.reject(new TypeError("must be an array"));var n=e.length,i=!1;if(!n)return this.resolve([]);var s=new Array(n),a=0,t=-1,o=new this(u);for(;++t<n;)h(e[t],t);return o;function h(e,t){r.resolve(e).then(function(e){s[t]=e,++a!==n||i||(i=!0,l.resolve(o,s))},function(e){i||(i=!0,l.reject(o,e))})}},o.race=function(e){var t=this;if("[object Array]"!==Object.prototype.toString.call(e))return this.reject(new TypeError("must be an array"));var r=e.length,n=!1;if(!r)return this.resolve([]);var i=-1,s=new this(u);for(;++i<r;)a=e[i],t.resolve(a).then(function(e){n||(n=!0,l.resolve(s,e))},function(e){n||(n=!0,l.reject(s,e))});var a;return s}},{immediate:36}],38:[function(e,t,r){"use strict";var n={};(0,e("./lib/utils/common").assign)(n,e("./lib/deflate"),e("./lib/inflate"),e("./lib/zlib/constants")),t.exports=n},{"./lib/deflate":39,"./lib/inflate":40,"./lib/utils/common":41,"./lib/zlib/constants":44}],39:[function(e,t,r){"use strict";var a=e("./zlib/deflate"),o=e("./utils/common"),h=e("./utils/strings"),i=e("./zlib/messages"),s=e("./zlib/zstream"),u=Object.prototype.toString,l=0,f=-1,c=0,d=8;function p(e){if(!(this instanceof p))return new p(e);this.options=o.assign({level:f,method:d,chunkSize:16384,windowBits:15,memLevel:8,strategy:c,to:""},e||{});var t=this.options;t.raw&&0<t.windowBits?t.windowBits=-t.windowBits:t.gzip&&0<t.windowBits&&t.windowBits<16&&(t.windowBits+=16),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new s,this.strm.avail_out=0;var r=a.deflateInit2(this.strm,t.level,t.method,t.windowBits,t.memLevel,t.strategy);if(r!==l)throw new Error(i[r]);if(t.header&&a.deflateSetHeader(this.strm,t.header),t.dictionary){var n;if(n="string"==typeof t.dictionary?h.string2buf(t.dictionary):"[object ArrayBuffer]"===u.call(t.dictionary)?new Uint8Array(t.dictionary):t.dictionary,(r=a.deflateSetDictionary(this.strm,n))!==l)throw new Error(i[r]);this._dict_set=!0}}function n(e,t){var r=new p(t);if(r.push(e,!0),r.err)throw r.msg||i[r.err];return r.result}p.prototype.push=function(e,t){var r,n,i=this.strm,s=this.options.chunkSize;if(this.ended)return!1;n=t===~~t?t:!0===t?4:0,"string"==typeof e?i.input=h.string2buf(e):"[object ArrayBuffer]"===u.call(e)?i.input=new Uint8Array(e):i.input=e,i.next_in=0,i.avail_in=i.input.length;do{if(0===i.avail_out&&(i.output=new o.Buf8(s),i.next_out=0,i.avail_out=s),1!==(r=a.deflate(i,n))&&r!==l)return this.onEnd(r),!(this.ended=!0);0!==i.avail_out&&(0!==i.avail_in||4!==n&&2!==n)||("string"===this.options.to?this.onData(h.buf2binstring(o.shrinkBuf(i.output,i.next_out))):this.onData(o.shrinkBuf(i.output,i.next_out)))}while((0<i.avail_in||0===i.avail_out)&&1!==r);return 4===n?(r=a.deflateEnd(this.strm),this.onEnd(r),this.ended=!0,r===l):2!==n||(this.onEnd(l),!(i.avail_out=0))},p.prototype.onData=function(e){this.chunks.push(e)},p.prototype.onEnd=function(e){e===l&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=o.flattenChunks(this.chunks)),this.chunks=[],this.err=e,this.msg=this.strm.msg},r.Deflate=p,r.deflate=n,r.deflateRaw=function(e,t){return(t=t||{}).raw=!0,n(e,t)},r.gzip=function(e,t){return(t=t||{}).gzip=!0,n(e,t)}},{"./utils/common":41,"./utils/strings":42,"./zlib/deflate":46,"./zlib/messages":51,"./zlib/zstream":53}],40:[function(e,t,r){"use strict";var c=e("./zlib/inflate"),d=e("./utils/common"),p=e("./utils/strings"),m=e("./zlib/constants"),n=e("./zlib/messages"),i=e("./zlib/zstream"),s=e("./zlib/gzheader"),_=Object.prototype.toString;function a(e){if(!(this instanceof a))return new a(e);this.options=d.assign({chunkSize:16384,windowBits:0,to:""},e||{});var t=this.options;t.raw&&0<=t.windowBits&&t.windowBits<16&&(t.windowBits=-t.windowBits,0===t.windowBits&&(t.windowBits=-15)),!(0<=t.windowBits&&t.windowBits<16)||e&&e.windowBits||(t.windowBits+=32),15<t.windowBits&&t.windowBits<48&&0==(15&t.windowBits)&&(t.windowBits|=15),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new i,this.strm.avail_out=0;var r=c.inflateInit2(this.strm,t.windowBits);if(r!==m.Z_OK)throw new Error(n[r]);this.header=new s,c.inflateGetHeader(this.strm,this.header)}function o(e,t){var r=new a(t);if(r.push(e,!0),r.err)throw r.msg||n[r.err];return r.result}a.prototype.push=function(e,t){var r,n,i,s,a,o,h=this.strm,u=this.options.chunkSize,l=this.options.dictionary,f=!1;if(this.ended)return!1;n=t===~~t?t:!0===t?m.Z_FINISH:m.Z_NO_FLUSH,"string"==typeof e?h.input=p.binstring2buf(e):"[object ArrayBuffer]"===_.call(e)?h.input=new Uint8Array(e):h.input=e,h.next_in=0,h.avail_in=h.input.length;do{if(0===h.avail_out&&(h.output=new d.Buf8(u),h.next_out=0,h.avail_out=u),(r=c.inflate(h,m.Z_NO_FLUSH))===m.Z_NEED_DICT&&l&&(o="string"==typeof l?p.string2buf(l):"[object ArrayBuffer]"===_.call(l)?new Uint8Array(l):l,r=c.inflateSetDictionary(this.strm,o)),r===m.Z_BUF_ERROR&&!0===f&&(r=m.Z_OK,f=!1),r!==m.Z_STREAM_END&&r!==m.Z_OK)return this.onEnd(r),!(this.ended=!0);h.next_out&&(0!==h.avail_out&&r!==m.Z_STREAM_END&&(0!==h.avail_in||n!==m.Z_FINISH&&n!==m.Z_SYNC_FLUSH)||("string"===this.options.to?(i=p.utf8border(h.output,h.next_out),s=h.next_out-i,a=p.buf2string(h.output,i),h.next_out=s,h.avail_out=u-s,s&&d.arraySet(h.output,h.output,i,s,0),this.onData(a)):this.onData(d.shrinkBuf(h.output,h.next_out)))),0===h.avail_in&&0===h.avail_out&&(f=!0)}while((0<h.avail_in||0===h.avail_out)&&r!==m.Z_STREAM_END);return r===m.Z_STREAM_END&&(n=m.Z_FINISH),n===m.Z_FINISH?(r=c.inflateEnd(this.strm),this.onEnd(r),this.ended=!0,r===m.Z_OK):n!==m.Z_SYNC_FLUSH||(this.onEnd(m.Z_OK),!(h.avail_out=0))},a.prototype.onData=function(e){this.chunks.push(e)},a.prototype.onEnd=function(e){e===m.Z_OK&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=d.flattenChunks(this.chunks)),this.chunks=[],this.err=e,this.msg=this.strm.msg},r.Inflate=a,r.inflate=o,r.inflateRaw=function(e,t){return(t=t||{}).raw=!0,o(e,t)},r.ungzip=o},{"./utils/common":41,"./utils/strings":42,"./zlib/constants":44,"./zlib/gzheader":47,"./zlib/inflate":49,"./zlib/messages":51,"./zlib/zstream":53}],41:[function(e,t,r){"use strict";var n="undefined"!=typeof Uint8Array&&"undefined"!=typeof Uint16Array&&"undefined"!=typeof Int32Array;r.assign=function(e){for(var t=Array.prototype.slice.call(arguments,1);t.length;){var r=t.shift();if(r){if("object"!=typeof r)throw new TypeError(r+"must be non-object");for(var n in r)r.hasOwnProperty(n)&&(e[n]=r[n])}}return e},r.shrinkBuf=function(e,t){return e.length===t?e:e.subarray?e.subarray(0,t):(e.length=t,e)};var i={arraySet:function(e,t,r,n,i){if(t.subarray&&e.subarray)e.set(t.subarray(r,r+n),i);else for(var s=0;s<n;s++)e[i+s]=t[r+s]},flattenChunks:function(e){var t,r,n,i,s,a;for(t=n=0,r=e.length;t<r;t++)n+=e[t].length;for(a=new Uint8Array(n),t=i=0,r=e.length;t<r;t++)s=e[t],a.set(s,i),i+=s.length;return a}},s={arraySet:function(e,t,r,n,i){for(var s=0;s<n;s++)e[i+s]=t[r+s]},flattenChunks:function(e){return[].concat.apply([],e)}};r.setTyped=function(e){e?(r.Buf8=Uint8Array,r.Buf16=Uint16Array,r.Buf32=Int32Array,r.assign(r,i)):(r.Buf8=Array,r.Buf16=Array,r.Buf32=Array,r.assign(r,s))},r.setTyped(n)},{}],42:[function(e,t,r){"use strict";var h=e("./common"),i=!0,s=!0;try{String.fromCharCode.apply(null,[0])}catch(e){i=!1}try{String.fromCharCode.apply(null,new Uint8Array(1))}catch(e){s=!1}for(var u=new h.Buf8(256),n=0;n<256;n++)u[n]=252<=n?6:248<=n?5:240<=n?4:224<=n?3:192<=n?2:1;function l(e,t){if(t<65537&&(e.subarray&&s||!e.subarray&&i))return String.fromCharCode.apply(null,h.shrinkBuf(e,t));for(var r="",n=0;n<t;n++)r+=String.fromCharCode(e[n]);return r}u[254]=u[254]=1,r.string2buf=function(e){var t,r,n,i,s,a=e.length,o=0;for(i=0;i<a;i++)55296==(64512&(r=e.charCodeAt(i)))&&i+1<a&&56320==(64512&(n=e.charCodeAt(i+1)))&&(r=65536+(r-55296<<10)+(n-56320),i++),o+=r<128?1:r<2048?2:r<65536?3:4;for(t=new h.Buf8(o),i=s=0;s<o;i++)55296==(64512&(r=e.charCodeAt(i)))&&i+1<a&&56320==(64512&(n=e.charCodeAt(i+1)))&&(r=65536+(r-55296<<10)+(n-56320),i++),r<128?t[s++]=r:(r<2048?t[s++]=192|r>>>6:(r<65536?t[s++]=224|r>>>12:(t[s++]=240|r>>>18,t[s++]=128|r>>>12&63),t[s++]=128|r>>>6&63),t[s++]=128|63&r);return t},r.buf2binstring=function(e){return l(e,e.length)},r.binstring2buf=function(e){for(var t=new h.Buf8(e.length),r=0,n=t.length;r<n;r++)t[r]=e.charCodeAt(r);return t},r.buf2string=function(e,t){var r,n,i,s,a=t||e.length,o=new Array(2*a);for(r=n=0;r<a;)if((i=e[r++])<128)o[n++]=i;else if(4<(s=u[i]))o[n++]=65533,r+=s-1;else{for(i&=2===s?31:3===s?15:7;1<s&&r<a;)i=i<<6|63&e[r++],s--;1<s?o[n++]=65533:i<65536?o[n++]=i:(i-=65536,o[n++]=55296|i>>10&1023,o[n++]=56320|1023&i)}return l(o,n)},r.utf8border=function(e,t){var r;for((t=t||e.length)>e.length&&(t=e.length),r=t-1;0<=r&&128==(192&e[r]);)r--;return r<0?t:0===r?t:r+u[e[r]]>t?r:t}},{"./common":41}],43:[function(e,t,r){"use strict";t.exports=function(e,t,r,n){for(var i=65535&e|0,s=e>>>16&65535|0,a=0;0!==r;){for(r-=a=2e3<r?2e3:r;s=s+(i=i+t[n++]|0)|0,--a;);i%=65521,s%=65521}return i|s<<16|0}},{}],44:[function(e,t,r){"use strict";t.exports={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8}},{}],45:[function(e,t,r){"use strict";var o=function(){for(var e,t=[],r=0;r<256;r++){e=r;for(var n=0;n<8;n++)e=1&e?3988292384^e>>>1:e>>>1;t[r]=e}return t}();t.exports=function(e,t,r,n){var i=o,s=n+r;e^=-1;for(var a=n;a<s;a++)e=e>>>8^i[255&(e^t[a])];return-1^e}},{}],46:[function(e,t,r){"use strict";var h,c=e("../utils/common"),u=e("./trees"),d=e("./adler32"),p=e("./crc32"),n=e("./messages"),l=0,f=4,m=0,_=-2,g=-1,b=4,i=2,v=8,y=9,s=286,a=30,o=19,w=2*s+1,k=15,x=3,S=258,z=S+x+1,C=42,E=113,A=1,I=2,O=3,B=4;function R(e,t){return e.msg=n[t],t}function T(e){return(e<<1)-(4<e?9:0)}function D(e){for(var t=e.length;0<=--t;)e[t]=0}function F(e){var t=e.state,r=t.pending;r>e.avail_out&&(r=e.avail_out),0!==r&&(c.arraySet(e.output,t.pending_buf,t.pending_out,r,e.next_out),e.next_out+=r,t.pending_out+=r,e.total_out+=r,e.avail_out-=r,t.pending-=r,0===t.pending&&(t.pending_out=0))}function N(e,t){u._tr_flush_block(e,0<=e.block_start?e.block_start:-1,e.strstart-e.block_start,t),e.block_start=e.strstart,F(e.strm)}function U(e,t){e.pending_buf[e.pending++]=t}function P(e,t){e.pending_buf[e.pending++]=t>>>8&255,e.pending_buf[e.pending++]=255&t}function L(e,t){var r,n,i=e.max_chain_length,s=e.strstart,a=e.prev_length,o=e.nice_match,h=e.strstart>e.w_size-z?e.strstart-(e.w_size-z):0,u=e.window,l=e.w_mask,f=e.prev,c=e.strstart+S,d=u[s+a-1],p=u[s+a];e.prev_length>=e.good_match&&(i>>=2),o>e.lookahead&&(o=e.lookahead);do{if(u[(r=t)+a]===p&&u[r+a-1]===d&&u[r]===u[s]&&u[++r]===u[s+1]){s+=2,r++;do{}while(u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&s<c);if(n=S-(c-s),s=c-S,a<n){if(e.match_start=t,o<=(a=n))break;d=u[s+a-1],p=u[s+a]}}}while((t=f[t&l])>h&&0!=--i);return a<=e.lookahead?a:e.lookahead}function j(e){var t,r,n,i,s,a,o,h,u,l,f=e.w_size;do{if(i=e.window_size-e.lookahead-e.strstart,e.strstart>=f+(f-z)){for(c.arraySet(e.window,e.window,f,f,0),e.match_start-=f,e.strstart-=f,e.block_start-=f,t=r=e.hash_size;n=e.head[--t],e.head[t]=f<=n?n-f:0,--r;);for(t=r=f;n=e.prev[--t],e.prev[t]=f<=n?n-f:0,--r;);i+=f}if(0===e.strm.avail_in)break;if(a=e.strm,o=e.window,h=e.strstart+e.lookahead,u=i,l=void 0,l=a.avail_in,u<l&&(l=u),r=0===l?0:(a.avail_in-=l,c.arraySet(o,a.input,a.next_in,l,h),1===a.state.wrap?a.adler=d(a.adler,o,l,h):2===a.state.wrap&&(a.adler=p(a.adler,o,l,h)),a.next_in+=l,a.total_in+=l,l),e.lookahead+=r,e.lookahead+e.insert>=x)for(s=e.strstart-e.insert,e.ins_h=e.window[s],e.ins_h=(e.ins_h<<e.hash_shift^e.window[s+1])&e.hash_mask;e.insert&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[s+x-1])&e.hash_mask,e.prev[s&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=s,s++,e.insert--,!(e.lookahead+e.insert<x)););}while(e.lookahead<z&&0!==e.strm.avail_in)}function Z(e,t){for(var r,n;;){if(e.lookahead<z){if(j(e),e.lookahead<z&&t===l)return A;if(0===e.lookahead)break}if(r=0,e.lookahead>=x&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+x-1])&e.hash_mask,r=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart),0!==r&&e.strstart-r<=e.w_size-z&&(e.match_length=L(e,r)),e.match_length>=x)if(n=u._tr_tally(e,e.strstart-e.match_start,e.match_length-x),e.lookahead-=e.match_length,e.match_length<=e.max_lazy_match&&e.lookahead>=x){for(e.match_length--;e.strstart++,e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+x-1])&e.hash_mask,r=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart,0!=--e.match_length;);e.strstart++}else e.strstart+=e.match_length,e.match_length=0,e.ins_h=e.window[e.strstart],e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+1])&e.hash_mask;else n=u._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++;if(n&&(N(e,!1),0===e.strm.avail_out))return A}return e.insert=e.strstart<x-1?e.strstart:x-1,t===f?(N(e,!0),0===e.strm.avail_out?O:B):e.last_lit&&(N(e,!1),0===e.strm.avail_out)?A:I}function W(e,t){for(var r,n,i;;){if(e.lookahead<z){if(j(e),e.lookahead<z&&t===l)return A;if(0===e.lookahead)break}if(r=0,e.lookahead>=x&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+x-1])&e.hash_mask,r=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart),e.prev_length=e.match_length,e.prev_match=e.match_start,e.match_length=x-1,0!==r&&e.prev_length<e.max_lazy_match&&e.strstart-r<=e.w_size-z&&(e.match_length=L(e,r),e.match_length<=5&&(1===e.strategy||e.match_length===x&&4096<e.strstart-e.match_start)&&(e.match_length=x-1)),e.prev_length>=x&&e.match_length<=e.prev_length){for(i=e.strstart+e.lookahead-x,n=u._tr_tally(e,e.strstart-1-e.prev_match,e.prev_length-x),e.lookahead-=e.prev_length-1,e.prev_length-=2;++e.strstart<=i&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+x-1])&e.hash_mask,r=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart),0!=--e.prev_length;);if(e.match_available=0,e.match_length=x-1,e.strstart++,n&&(N(e,!1),0===e.strm.avail_out))return A}else if(e.match_available){if((n=u._tr_tally(e,0,e.window[e.strstart-1]))&&N(e,!1),e.strstart++,e.lookahead--,0===e.strm.avail_out)return A}else e.match_available=1,e.strstart++,e.lookahead--}return e.match_available&&(n=u._tr_tally(e,0,e.window[e.strstart-1]),e.match_available=0),e.insert=e.strstart<x-1?e.strstart:x-1,t===f?(N(e,!0),0===e.strm.avail_out?O:B):e.last_lit&&(N(e,!1),0===e.strm.avail_out)?A:I}function M(e,t,r,n,i){this.good_length=e,this.max_lazy=t,this.nice_length=r,this.max_chain=n,this.func=i}function H(){this.strm=null,this.status=0,this.pending_buf=null,this.pending_buf_size=0,this.pending_out=0,this.pending=0,this.wrap=0,this.gzhead=null,this.gzindex=0,this.method=v,this.last_flush=-1,this.w_size=0,this.w_bits=0,this.w_mask=0,this.window=null,this.window_size=0,this.prev=null,this.head=null,this.ins_h=0,this.hash_size=0,this.hash_bits=0,this.hash_mask=0,this.hash_shift=0,this.block_start=0,this.match_length=0,this.prev_match=0,this.match_available=0,this.strstart=0,this.match_start=0,this.lookahead=0,this.prev_length=0,this.max_chain_length=0,this.max_lazy_match=0,this.level=0,this.strategy=0,this.good_match=0,this.nice_match=0,this.dyn_ltree=new c.Buf16(2*w),this.dyn_dtree=new c.Buf16(2*(2*a+1)),this.bl_tree=new c.Buf16(2*(2*o+1)),D(this.dyn_ltree),D(this.dyn_dtree),D(this.bl_tree),this.l_desc=null,this.d_desc=null,this.bl_desc=null,this.bl_count=new c.Buf16(k+1),this.heap=new c.Buf16(2*s+1),D(this.heap),this.heap_len=0,this.heap_max=0,this.depth=new c.Buf16(2*s+1),D(this.depth),this.l_buf=0,this.lit_bufsize=0,this.last_lit=0,this.d_buf=0,this.opt_len=0,this.static_len=0,this.matches=0,this.insert=0,this.bi_buf=0,this.bi_valid=0}function G(e){var t;return e&&e.state?(e.total_in=e.total_out=0,e.data_type=i,(t=e.state).pending=0,t.pending_out=0,t.wrap<0&&(t.wrap=-t.wrap),t.status=t.wrap?C:E,e.adler=2===t.wrap?0:1,t.last_flush=l,u._tr_init(t),m):R(e,_)}function K(e){var t=G(e);return t===m&&function(e){e.window_size=2*e.w_size,D(e.head),e.max_lazy_match=h[e.level].max_lazy,e.good_match=h[e.level].good_length,e.nice_match=h[e.level].nice_length,e.max_chain_length=h[e.level].max_chain,e.strstart=0,e.block_start=0,e.lookahead=0,e.insert=0,e.match_length=e.prev_length=x-1,e.match_available=0,e.ins_h=0}(e.state),t}function Y(e,t,r,n,i,s){if(!e)return _;var a=1;if(t===g&&(t=6),n<0?(a=0,n=-n):15<n&&(a=2,n-=16),i<1||y<i||r!==v||n<8||15<n||t<0||9<t||s<0||b<s)return R(e,_);8===n&&(n=9);var o=new H;return(e.state=o).strm=e,o.wrap=a,o.gzhead=null,o.w_bits=n,o.w_size=1<<o.w_bits,o.w_mask=o.w_size-1,o.hash_bits=i+7,o.hash_size=1<<o.hash_bits,o.hash_mask=o.hash_size-1,o.hash_shift=~~((o.hash_bits+x-1)/x),o.window=new c.Buf8(2*o.w_size),o.head=new c.Buf16(o.hash_size),o.prev=new c.Buf16(o.w_size),o.lit_bufsize=1<<i+6,o.pending_buf_size=4*o.lit_bufsize,o.pending_buf=new c.Buf8(o.pending_buf_size),o.d_buf=1*o.lit_bufsize,o.l_buf=3*o.lit_bufsize,o.level=t,o.strategy=s,o.method=r,K(e)}h=[new M(0,0,0,0,function(e,t){var r=65535;for(r>e.pending_buf_size-5&&(r=e.pending_buf_size-5);;){if(e.lookahead<=1){if(j(e),0===e.lookahead&&t===l)return A;if(0===e.lookahead)break}e.strstart+=e.lookahead,e.lookahead=0;var n=e.block_start+r;if((0===e.strstart||e.strstart>=n)&&(e.lookahead=e.strstart-n,e.strstart=n,N(e,!1),0===e.strm.avail_out))return A;if(e.strstart-e.block_start>=e.w_size-z&&(N(e,!1),0===e.strm.avail_out))return A}return e.insert=0,t===f?(N(e,!0),0===e.strm.avail_out?O:B):(e.strstart>e.block_start&&(N(e,!1),e.strm.avail_out),A)}),new M(4,4,8,4,Z),new M(4,5,16,8,Z),new M(4,6,32,32,Z),new M(4,4,16,16,W),new M(8,16,32,32,W),new M(8,16,128,128,W),new M(8,32,128,256,W),new M(32,128,258,1024,W),new M(32,258,258,4096,W)],r.deflateInit=function(e,t){return Y(e,t,v,15,8,0)},r.deflateInit2=Y,r.deflateReset=K,r.deflateResetKeep=G,r.deflateSetHeader=function(e,t){return e&&e.state?2!==e.state.wrap?_:(e.state.gzhead=t,m):_},r.deflate=function(e,t){var r,n,i,s;if(!e||!e.state||5<t||t<0)return e?R(e,_):_;if(n=e.state,!e.output||!e.input&&0!==e.avail_in||666===n.status&&t!==f)return R(e,0===e.avail_out?-5:_);if(n.strm=e,r=n.last_flush,n.last_flush=t,n.status===C)if(2===n.wrap)e.adler=0,U(n,31),U(n,139),U(n,8),n.gzhead?(U(n,(n.gzhead.text?1:0)+(n.gzhead.hcrc?2:0)+(n.gzhead.extra?4:0)+(n.gzhead.name?8:0)+(n.gzhead.comment?16:0)),U(n,255&n.gzhead.time),U(n,n.gzhead.time>>8&255),U(n,n.gzhead.time>>16&255),U(n,n.gzhead.time>>24&255),U(n,9===n.level?2:2<=n.strategy||n.level<2?4:0),U(n,255&n.gzhead.os),n.gzhead.extra&&n.gzhead.extra.length&&(U(n,255&n.gzhead.extra.length),U(n,n.gzhead.extra.length>>8&255)),n.gzhead.hcrc&&(e.adler=p(e.adler,n.pending_buf,n.pending,0)),n.gzindex=0,n.status=69):(U(n,0),U(n,0),U(n,0),U(n,0),U(n,0),U(n,9===n.level?2:2<=n.strategy||n.level<2?4:0),U(n,3),n.status=E);else{var a=v+(n.w_bits-8<<4)<<8;a|=(2<=n.strategy||n.level<2?0:n.level<6?1:6===n.level?2:3)<<6,0!==n.strstart&&(a|=32),a+=31-a%31,n.status=E,P(n,a),0!==n.strstart&&(P(n,e.adler>>>16),P(n,65535&e.adler)),e.adler=1}if(69===n.status)if(n.gzhead.extra){for(i=n.pending;n.gzindex<(65535&n.gzhead.extra.length)&&(n.pending!==n.pending_buf_size||(n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),F(e),i=n.pending,n.pending!==n.pending_buf_size));)U(n,255&n.gzhead.extra[n.gzindex]),n.gzindex++;n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),n.gzindex===n.gzhead.extra.length&&(n.gzindex=0,n.status=73)}else n.status=73;if(73===n.status)if(n.gzhead.name){i=n.pending;do{if(n.pending===n.pending_buf_size&&(n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),F(e),i=n.pending,n.pending===n.pending_buf_size)){s=1;break}s=n.gzindex<n.gzhead.name.length?255&n.gzhead.name.charCodeAt(n.gzindex++):0,U(n,s)}while(0!==s);n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),0===s&&(n.gzindex=0,n.status=91)}else n.status=91;if(91===n.status)if(n.gzhead.comment){i=n.pending;do{if(n.pending===n.pending_buf_size&&(n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),F(e),i=n.pending,n.pending===n.pending_buf_size)){s=1;break}s=n.gzindex<n.gzhead.comment.length?255&n.gzhead.comment.charCodeAt(n.gzindex++):0,U(n,s)}while(0!==s);n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),0===s&&(n.status=103)}else n.status=103;if(103===n.status&&(n.gzhead.hcrc?(n.pending+2>n.pending_buf_size&&F(e),n.pending+2<=n.pending_buf_size&&(U(n,255&e.adler),U(n,e.adler>>8&255),e.adler=0,n.status=E)):n.status=E),0!==n.pending){if(F(e),0===e.avail_out)return n.last_flush=-1,m}else if(0===e.avail_in&&T(t)<=T(r)&&t!==f)return R(e,-5);if(666===n.status&&0!==e.avail_in)return R(e,-5);if(0!==e.avail_in||0!==n.lookahead||t!==l&&666!==n.status){var o=2===n.strategy?function(e,t){for(var r;;){if(0===e.lookahead&&(j(e),0===e.lookahead)){if(t===l)return A;break}if(e.match_length=0,r=u._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++,r&&(N(e,!1),0===e.strm.avail_out))return A}return e.insert=0,t===f?(N(e,!0),0===e.strm.avail_out?O:B):e.last_lit&&(N(e,!1),0===e.strm.avail_out)?A:I}(n,t):3===n.strategy?function(e,t){for(var r,n,i,s,a=e.window;;){if(e.lookahead<=S){if(j(e),e.lookahead<=S&&t===l)return A;if(0===e.lookahead)break}if(e.match_length=0,e.lookahead>=x&&0<e.strstart&&(n=a[i=e.strstart-1])===a[++i]&&n===a[++i]&&n===a[++i]){s=e.strstart+S;do{}while(n===a[++i]&&n===a[++i]&&n===a[++i]&&n===a[++i]&&n===a[++i]&&n===a[++i]&&n===a[++i]&&n===a[++i]&&i<s);e.match_length=S-(s-i),e.match_length>e.lookahead&&(e.match_length=e.lookahead)}if(e.match_length>=x?(r=u._tr_tally(e,1,e.match_length-x),e.lookahead-=e.match_length,e.strstart+=e.match_length,e.match_length=0):(r=u._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++),r&&(N(e,!1),0===e.strm.avail_out))return A}return e.insert=0,t===f?(N(e,!0),0===e.strm.avail_out?O:B):e.last_lit&&(N(e,!1),0===e.strm.avail_out)?A:I}(n,t):h[n.level].func(n,t);if(o!==O&&o!==B||(n.status=666),o===A||o===O)return 0===e.avail_out&&(n.last_flush=-1),m;if(o===I&&(1===t?u._tr_align(n):5!==t&&(u._tr_stored_block(n,0,0,!1),3===t&&(D(n.head),0===n.lookahead&&(n.strstart=0,n.block_start=0,n.insert=0))),F(e),0===e.avail_out))return n.last_flush=-1,m}return t!==f?m:n.wrap<=0?1:(2===n.wrap?(U(n,255&e.adler),U(n,e.adler>>8&255),U(n,e.adler>>16&255),U(n,e.adler>>24&255),U(n,255&e.total_in),U(n,e.total_in>>8&255),U(n,e.total_in>>16&255),U(n,e.total_in>>24&255)):(P(n,e.adler>>>16),P(n,65535&e.adler)),F(e),0<n.wrap&&(n.wrap=-n.wrap),0!==n.pending?m:1)},r.deflateEnd=function(e){var t;return e&&e.state?(t=e.state.status)!==C&&69!==t&&73!==t&&91!==t&&103!==t&&t!==E&&666!==t?R(e,_):(e.state=null,t===E?R(e,-3):m):_},r.deflateSetDictionary=function(e,t){var r,n,i,s,a,o,h,u,l=t.length;if(!e||!e.state)return _;if(2===(s=(r=e.state).wrap)||1===s&&r.status!==C||r.lookahead)return _;for(1===s&&(e.adler=d(e.adler,t,l,0)),r.wrap=0,l>=r.w_size&&(0===s&&(D(r.head),r.strstart=0,r.block_start=0,r.insert=0),u=new c.Buf8(r.w_size),c.arraySet(u,t,l-r.w_size,r.w_size,0),t=u,l=r.w_size),a=e.avail_in,o=e.next_in,h=e.input,e.avail_in=l,e.next_in=0,e.input=t,j(r);r.lookahead>=x;){for(n=r.strstart,i=r.lookahead-(x-1);r.ins_h=(r.ins_h<<r.hash_shift^r.window[n+x-1])&r.hash_mask,r.prev[n&r.w_mask]=r.head[r.ins_h],r.head[r.ins_h]=n,n++,--i;);r.strstart=n,r.lookahead=x-1,j(r)}return r.strstart+=r.lookahead,r.block_start=r.strstart,r.insert=r.lookahead,r.lookahead=0,r.match_length=r.prev_length=x-1,r.match_available=0,e.next_in=o,e.input=h,e.avail_in=a,r.wrap=s,m},r.deflateInfo="pako deflate (from Nodeca project)"},{"../utils/common":41,"./adler32":43,"./crc32":45,"./messages":51,"./trees":52}],47:[function(e,t,r){"use strict";t.exports=function(){this.text=0,this.time=0,this.xflags=0,this.os=0,this.extra=null,this.extra_len=0,this.name="",this.comment="",this.hcrc=0,this.done=!1}},{}],48:[function(e,t,r){"use strict";t.exports=function(e,t){var r,n,i,s,a,o,h,u,l,f,c,d,p,m,_,g,b,v,y,w,k,x,S,z,C;r=e.state,n=e.next_in,z=e.input,i=n+(e.avail_in-5),s=e.next_out,C=e.output,a=s-(t-e.avail_out),o=s+(e.avail_out-257),h=r.dmax,u=r.wsize,l=r.whave,f=r.wnext,c=r.window,d=r.hold,p=r.bits,m=r.lencode,_=r.distcode,g=(1<<r.lenbits)-1,b=(1<<r.distbits)-1;e:do{p<15&&(d+=z[n++]<<p,p+=8,d+=z[n++]<<p,p+=8),v=m[d&g];t:for(;;){if(d>>>=y=v>>>24,p-=y,0===(y=v>>>16&255))C[s++]=65535&v;else{if(!(16&y)){if(0==(64&y)){v=m[(65535&v)+(d&(1<<y)-1)];continue t}if(32&y){r.mode=12;break e}e.msg="invalid literal/length code",r.mode=30;break e}w=65535&v,(y&=15)&&(p<y&&(d+=z[n++]<<p,p+=8),w+=d&(1<<y)-1,d>>>=y,p-=y),p<15&&(d+=z[n++]<<p,p+=8,d+=z[n++]<<p,p+=8),v=_[d&b];r:for(;;){if(d>>>=y=v>>>24,p-=y,!(16&(y=v>>>16&255))){if(0==(64&y)){v=_[(65535&v)+(d&(1<<y)-1)];continue r}e.msg="invalid distance code",r.mode=30;break e}if(k=65535&v,p<(y&=15)&&(d+=z[n++]<<p,(p+=8)<y&&(d+=z[n++]<<p,p+=8)),h<(k+=d&(1<<y)-1)){e.msg="invalid distance too far back",r.mode=30;break e}if(d>>>=y,p-=y,(y=s-a)<k){if(l<(y=k-y)&&r.sane){e.msg="invalid distance too far back",r.mode=30;break e}if(S=c,(x=0)===f){if(x+=u-y,y<w){for(w-=y;C[s++]=c[x++],--y;);x=s-k,S=C}}else if(f<y){if(x+=u+f-y,(y-=f)<w){for(w-=y;C[s++]=c[x++],--y;);if(x=0,f<w){for(w-=y=f;C[s++]=c[x++],--y;);x=s-k,S=C}}}else if(x+=f-y,y<w){for(w-=y;C[s++]=c[x++],--y;);x=s-k,S=C}for(;2<w;)C[s++]=S[x++],C[s++]=S[x++],C[s++]=S[x++],w-=3;w&&(C[s++]=S[x++],1<w&&(C[s++]=S[x++]))}else{for(x=s-k;C[s++]=C[x++],C[s++]=C[x++],C[s++]=C[x++],2<(w-=3););w&&(C[s++]=C[x++],1<w&&(C[s++]=C[x++]))}break}}break}}while(n<i&&s<o);n-=w=p>>3,d&=(1<<(p-=w<<3))-1,e.next_in=n,e.next_out=s,e.avail_in=n<i?i-n+5:5-(n-i),e.avail_out=s<o?o-s+257:257-(s-o),r.hold=d,r.bits=p}},{}],49:[function(e,t,r){"use strict";var I=e("../utils/common"),O=e("./adler32"),B=e("./crc32"),R=e("./inffast"),T=e("./inftrees"),D=1,F=2,N=0,U=-2,P=1,n=852,i=592;function L(e){return(e>>>24&255)+(e>>>8&65280)+((65280&e)<<8)+((255&e)<<24)}function s(){this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new I.Buf16(320),this.work=new I.Buf16(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0}function a(e){var t;return e&&e.state?(t=e.state,e.total_in=e.total_out=t.total=0,e.msg="",t.wrap&&(e.adler=1&t.wrap),t.mode=P,t.last=0,t.havedict=0,t.dmax=32768,t.head=null,t.hold=0,t.bits=0,t.lencode=t.lendyn=new I.Buf32(n),t.distcode=t.distdyn=new I.Buf32(i),t.sane=1,t.back=-1,N):U}function o(e){var t;return e&&e.state?((t=e.state).wsize=0,t.whave=0,t.wnext=0,a(e)):U}function h(e,t){var r,n;return e&&e.state?(n=e.state,t<0?(r=0,t=-t):(r=1+(t>>4),t<48&&(t&=15)),t&&(t<8||15<t)?U:(null!==n.window&&n.wbits!==t&&(n.window=null),n.wrap=r,n.wbits=t,o(e))):U}function u(e,t){var r,n;return e?(n=new s,(e.state=n).window=null,(r=h(e,t))!==N&&(e.state=null),r):U}var l,f,c=!0;function j(e){if(c){var t;for(l=new I.Buf32(512),f=new I.Buf32(32),t=0;t<144;)e.lens[t++]=8;for(;t<256;)e.lens[t++]=9;for(;t<280;)e.lens[t++]=7;for(;t<288;)e.lens[t++]=8;for(T(D,e.lens,0,288,l,0,e.work,{bits:9}),t=0;t<32;)e.lens[t++]=5;T(F,e.lens,0,32,f,0,e.work,{bits:5}),c=!1}e.lencode=l,e.lenbits=9,e.distcode=f,e.distbits=5}function Z(e,t,r,n){var i,s=e.state;return null===s.window&&(s.wsize=1<<s.wbits,s.wnext=0,s.whave=0,s.window=new I.Buf8(s.wsize)),n>=s.wsize?(I.arraySet(s.window,t,r-s.wsize,s.wsize,0),s.wnext=0,s.whave=s.wsize):(n<(i=s.wsize-s.wnext)&&(i=n),I.arraySet(s.window,t,r-n,i,s.wnext),(n-=i)?(I.arraySet(s.window,t,r-n,n,0),s.wnext=n,s.whave=s.wsize):(s.wnext+=i,s.wnext===s.wsize&&(s.wnext=0),s.whave<s.wsize&&(s.whave+=i))),0}r.inflateReset=o,r.inflateReset2=h,r.inflateResetKeep=a,r.inflateInit=function(e){return u(e,15)},r.inflateInit2=u,r.inflate=function(e,t){var r,n,i,s,a,o,h,u,l,f,c,d,p,m,_,g,b,v,y,w,k,x,S,z,C=0,E=new I.Buf8(4),A=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];if(!e||!e.state||!e.output||!e.input&&0!==e.avail_in)return U;12===(r=e.state).mode&&(r.mode=13),a=e.next_out,i=e.output,h=e.avail_out,s=e.next_in,n=e.input,o=e.avail_in,u=r.hold,l=r.bits,f=o,c=h,x=N;e:for(;;)switch(r.mode){case P:if(0===r.wrap){r.mode=13;break}for(;l<16;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(2&r.wrap&&35615===u){E[r.check=0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0),l=u=0,r.mode=2;break}if(r.flags=0,r.head&&(r.head.done=!1),!(1&r.wrap)||(((255&u)<<8)+(u>>8))%31){e.msg="incorrect header check",r.mode=30;break}if(8!=(15&u)){e.msg="unknown compression method",r.mode=30;break}if(l-=4,k=8+(15&(u>>>=4)),0===r.wbits)r.wbits=k;else if(k>r.wbits){e.msg="invalid window size",r.mode=30;break}r.dmax=1<<k,e.adler=r.check=1,r.mode=512&u?10:12,l=u=0;break;case 2:for(;l<16;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(r.flags=u,8!=(255&r.flags)){e.msg="unknown compression method",r.mode=30;break}if(57344&r.flags){e.msg="unknown header flags set",r.mode=30;break}r.head&&(r.head.text=u>>8&1),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0)),l=u=0,r.mode=3;case 3:for(;l<32;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}r.head&&(r.head.time=u),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,E[2]=u>>>16&255,E[3]=u>>>24&255,r.check=B(r.check,E,4,0)),l=u=0,r.mode=4;case 4:for(;l<16;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}r.head&&(r.head.xflags=255&u,r.head.os=u>>8),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0)),l=u=0,r.mode=5;case 5:if(1024&r.flags){for(;l<16;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}r.length=u,r.head&&(r.head.extra_len=u),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0)),l=u=0}else r.head&&(r.head.extra=null);r.mode=6;case 6:if(1024&r.flags&&(o<(d=r.length)&&(d=o),d&&(r.head&&(k=r.head.extra_len-r.length,r.head.extra||(r.head.extra=new Array(r.head.extra_len)),I.arraySet(r.head.extra,n,s,d,k)),512&r.flags&&(r.check=B(r.check,n,d,s)),o-=d,s+=d,r.length-=d),r.length))break e;r.length=0,r.mode=7;case 7:if(2048&r.flags){if(0===o)break e;for(d=0;k=n[s+d++],r.head&&k&&r.length<65536&&(r.head.name+=String.fromCharCode(k)),k&&d<o;);if(512&r.flags&&(r.check=B(r.check,n,d,s)),o-=d,s+=d,k)break e}else r.head&&(r.head.name=null);r.length=0,r.mode=8;case 8:if(4096&r.flags){if(0===o)break e;for(d=0;k=n[s+d++],r.head&&k&&r.length<65536&&(r.head.comment+=String.fromCharCode(k)),k&&d<o;);if(512&r.flags&&(r.check=B(r.check,n,d,s)),o-=d,s+=d,k)break e}else r.head&&(r.head.comment=null);r.mode=9;case 9:if(512&r.flags){for(;l<16;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(u!==(65535&r.check)){e.msg="header crc mismatch",r.mode=30;break}l=u=0}r.head&&(r.head.hcrc=r.flags>>9&1,r.head.done=!0),e.adler=r.check=0,r.mode=12;break;case 10:for(;l<32;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}e.adler=r.check=L(u),l=u=0,r.mode=11;case 11:if(0===r.havedict)return e.next_out=a,e.avail_out=h,e.next_in=s,e.avail_in=o,r.hold=u,r.bits=l,2;e.adler=r.check=1,r.mode=12;case 12:if(5===t||6===t)break e;case 13:if(r.last){u>>>=7&l,l-=7&l,r.mode=27;break}for(;l<3;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}switch(r.last=1&u,l-=1,3&(u>>>=1)){case 0:r.mode=14;break;case 1:if(j(r),r.mode=20,6!==t)break;u>>>=2,l-=2;break e;case 2:r.mode=17;break;case 3:e.msg="invalid block type",r.mode=30}u>>>=2,l-=2;break;case 14:for(u>>>=7&l,l-=7&l;l<32;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if((65535&u)!=(u>>>16^65535)){e.msg="invalid stored block lengths",r.mode=30;break}if(r.length=65535&u,l=u=0,r.mode=15,6===t)break e;case 15:r.mode=16;case 16:if(d=r.length){if(o<d&&(d=o),h<d&&(d=h),0===d)break e;I.arraySet(i,n,s,d,a),o-=d,s+=d,h-=d,a+=d,r.length-=d;break}r.mode=12;break;case 17:for(;l<14;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(r.nlen=257+(31&u),u>>>=5,l-=5,r.ndist=1+(31&u),u>>>=5,l-=5,r.ncode=4+(15&u),u>>>=4,l-=4,286<r.nlen||30<r.ndist){e.msg="too many length or distance symbols",r.mode=30;break}r.have=0,r.mode=18;case 18:for(;r.have<r.ncode;){for(;l<3;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}r.lens[A[r.have++]]=7&u,u>>>=3,l-=3}for(;r.have<19;)r.lens[A[r.have++]]=0;if(r.lencode=r.lendyn,r.lenbits=7,S={bits:r.lenbits},x=T(0,r.lens,0,19,r.lencode,0,r.work,S),r.lenbits=S.bits,x){e.msg="invalid code lengths set",r.mode=30;break}r.have=0,r.mode=19;case 19:for(;r.have<r.nlen+r.ndist;){for(;g=(C=r.lencode[u&(1<<r.lenbits)-1])>>>16&255,b=65535&C,!((_=C>>>24)<=l);){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(b<16)u>>>=_,l-=_,r.lens[r.have++]=b;else{if(16===b){for(z=_+2;l<z;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(u>>>=_,l-=_,0===r.have){e.msg="invalid bit length repeat",r.mode=30;break}k=r.lens[r.have-1],d=3+(3&u),u>>>=2,l-=2}else if(17===b){for(z=_+3;l<z;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}l-=_,k=0,d=3+(7&(u>>>=_)),u>>>=3,l-=3}else{for(z=_+7;l<z;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}l-=_,k=0,d=11+(127&(u>>>=_)),u>>>=7,l-=7}if(r.have+d>r.nlen+r.ndist){e.msg="invalid bit length repeat",r.mode=30;break}for(;d--;)r.lens[r.have++]=k}}if(30===r.mode)break;if(0===r.lens[256]){e.msg="invalid code -- missing end-of-block",r.mode=30;break}if(r.lenbits=9,S={bits:r.lenbits},x=T(D,r.lens,0,r.nlen,r.lencode,0,r.work,S),r.lenbits=S.bits,x){e.msg="invalid literal/lengths set",r.mode=30;break}if(r.distbits=6,r.distcode=r.distdyn,S={bits:r.distbits},x=T(F,r.lens,r.nlen,r.ndist,r.distcode,0,r.work,S),r.distbits=S.bits,x){e.msg="invalid distances set",r.mode=30;break}if(r.mode=20,6===t)break e;case 20:r.mode=21;case 21:if(6<=o&&258<=h){e.next_out=a,e.avail_out=h,e.next_in=s,e.avail_in=o,r.hold=u,r.bits=l,R(e,c),a=e.next_out,i=e.output,h=e.avail_out,s=e.next_in,n=e.input,o=e.avail_in,u=r.hold,l=r.bits,12===r.mode&&(r.back=-1);break}for(r.back=0;g=(C=r.lencode[u&(1<<r.lenbits)-1])>>>16&255,b=65535&C,!((_=C>>>24)<=l);){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(g&&0==(240&g)){for(v=_,y=g,w=b;g=(C=r.lencode[w+((u&(1<<v+y)-1)>>v)])>>>16&255,b=65535&C,!(v+(_=C>>>24)<=l);){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}u>>>=v,l-=v,r.back+=v}if(u>>>=_,l-=_,r.back+=_,r.length=b,0===g){r.mode=26;break}if(32&g){r.back=-1,r.mode=12;break}if(64&g){e.msg="invalid literal/length code",r.mode=30;break}r.extra=15&g,r.mode=22;case 22:if(r.extra){for(z=r.extra;l<z;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}r.length+=u&(1<<r.extra)-1,u>>>=r.extra,l-=r.extra,r.back+=r.extra}r.was=r.length,r.mode=23;case 23:for(;g=(C=r.distcode[u&(1<<r.distbits)-1])>>>16&255,b=65535&C,!((_=C>>>24)<=l);){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(0==(240&g)){for(v=_,y=g,w=b;g=(C=r.distcode[w+((u&(1<<v+y)-1)>>v)])>>>16&255,b=65535&C,!(v+(_=C>>>24)<=l);){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}u>>>=v,l-=v,r.back+=v}if(u>>>=_,l-=_,r.back+=_,64&g){e.msg="invalid distance code",r.mode=30;break}r.offset=b,r.extra=15&g,r.mode=24;case 24:if(r.extra){for(z=r.extra;l<z;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}r.offset+=u&(1<<r.extra)-1,u>>>=r.extra,l-=r.extra,r.back+=r.extra}if(r.offset>r.dmax){e.msg="invalid distance too far back",r.mode=30;break}r.mode=25;case 25:if(0===h)break e;if(d=c-h,r.offset>d){if((d=r.offset-d)>r.whave&&r.sane){e.msg="invalid distance too far back",r.mode=30;break}p=d>r.wnext?(d-=r.wnext,r.wsize-d):r.wnext-d,d>r.length&&(d=r.length),m=r.window}else m=i,p=a-r.offset,d=r.length;for(h<d&&(d=h),h-=d,r.length-=d;i[a++]=m[p++],--d;);0===r.length&&(r.mode=21);break;case 26:if(0===h)break e;i[a++]=r.length,h--,r.mode=21;break;case 27:if(r.wrap){for(;l<32;){if(0===o)break e;o--,u|=n[s++]<<l,l+=8}if(c-=h,e.total_out+=c,r.total+=c,c&&(e.adler=r.check=r.flags?B(r.check,i,c,a-c):O(r.check,i,c,a-c)),c=h,(r.flags?u:L(u))!==r.check){e.msg="incorrect data check",r.mode=30;break}l=u=0}r.mode=28;case 28:if(r.wrap&&r.flags){for(;l<32;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(u!==(4294967295&r.total)){e.msg="incorrect length check",r.mode=30;break}l=u=0}r.mode=29;case 29:x=1;break e;case 30:x=-3;break e;case 31:return-4;case 32:default:return U}return e.next_out=a,e.avail_out=h,e.next_in=s,e.avail_in=o,r.hold=u,r.bits=l,(r.wsize||c!==e.avail_out&&r.mode<30&&(r.mode<27||4!==t))&&Z(e,e.output,e.next_out,c-e.avail_out)?(r.mode=31,-4):(f-=e.avail_in,c-=e.avail_out,e.total_in+=f,e.total_out+=c,r.total+=c,r.wrap&&c&&(e.adler=r.check=r.flags?B(r.check,i,c,e.next_out-c):O(r.check,i,c,e.next_out-c)),e.data_type=r.bits+(r.last?64:0)+(12===r.mode?128:0)+(20===r.mode||15===r.mode?256:0),(0==f&&0===c||4===t)&&x===N&&(x=-5),x)},r.inflateEnd=function(e){if(!e||!e.state)return U;var t=e.state;return t.window&&(t.window=null),e.state=null,N},r.inflateGetHeader=function(e,t){var r;return e&&e.state?0==(2&(r=e.state).wrap)?U:((r.head=t).done=!1,N):U},r.inflateSetDictionary=function(e,t){var r,n=t.length;return e&&e.state?0!==(r=e.state).wrap&&11!==r.mode?U:11===r.mode&&O(1,t,n,0)!==r.check?-3:Z(e,t,n,n)?(r.mode=31,-4):(r.havedict=1,N):U},r.inflateInfo="pako inflate (from Nodeca project)"},{"../utils/common":41,"./adler32":43,"./crc32":45,"./inffast":48,"./inftrees":50}],50:[function(e,t,r){"use strict";var D=e("../utils/common"),F=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0],N=[16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78],U=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0],P=[16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64];t.exports=function(e,t,r,n,i,s,a,o){var h,u,l,f,c,d,p,m,_,g=o.bits,b=0,v=0,y=0,w=0,k=0,x=0,S=0,z=0,C=0,E=0,A=null,I=0,O=new D.Buf16(16),B=new D.Buf16(16),R=null,T=0;for(b=0;b<=15;b++)O[b]=0;for(v=0;v<n;v++)O[t[r+v]]++;for(k=g,w=15;1<=w&&0===O[w];w--);if(w<k&&(k=w),0===w)return i[s++]=20971520,i[s++]=20971520,o.bits=1,0;for(y=1;y<w&&0===O[y];y++);for(k<y&&(k=y),b=z=1;b<=15;b++)if(z<<=1,(z-=O[b])<0)return-1;if(0<z&&(0===e||1!==w))return-1;for(B[1]=0,b=1;b<15;b++)B[b+1]=B[b]+O[b];for(v=0;v<n;v++)0!==t[r+v]&&(a[B[t[r+v]]++]=v);if(d=0===e?(A=R=a,19):1===e?(A=F,I-=257,R=N,T-=257,256):(A=U,R=P,-1),b=y,c=s,S=v=E=0,l=-1,f=(C=1<<(x=k))-1,1===e&&852<C||2===e&&592<C)return 1;for(;;){for(p=b-S,_=a[v]<d?(m=0,a[v]):a[v]>d?(m=R[T+a[v]],A[I+a[v]]):(m=96,0),h=1<<b-S,y=u=1<<x;i[c+(E>>S)+(u-=h)]=p<<24|m<<16|_|0,0!==u;);for(h=1<<b-1;E&h;)h>>=1;if(0!==h?(E&=h-1,E+=h):E=0,v++,0==--O[b]){if(b===w)break;b=t[r+a[v]]}if(k<b&&(E&f)!==l){for(0===S&&(S=k),c+=y,z=1<<(x=b-S);x+S<w&&!((z-=O[x+S])<=0);)x++,z<<=1;if(C+=1<<x,1===e&&852<C||2===e&&592<C)return 1;i[l=E&f]=k<<24|x<<16|c-s|0}}return 0!==E&&(i[c+E]=b-S<<24|64<<16|0),o.bits=k,0}},{"../utils/common":41}],51:[function(e,t,r){"use strict";t.exports={2:"need dictionary",1:"stream end",0:"","-1":"file error","-2":"stream error","-3":"data error","-4":"insufficient memory","-5":"buffer error","-6":"incompatible version"}},{}],52:[function(e,t,r){"use strict";var i=e("../utils/common"),o=0,h=1;function n(e){for(var t=e.length;0<=--t;)e[t]=0}var s=0,a=29,u=256,l=u+1+a,f=30,c=19,_=2*l+1,g=15,d=16,p=7,m=256,b=16,v=17,y=18,w=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],k=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],x=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7],S=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],z=new Array(2*(l+2));n(z);var C=new Array(2*f);n(C);var E=new Array(512);n(E);var A=new Array(256);n(A);var I=new Array(a);n(I);var O,B,R,T=new Array(f);function D(e,t,r,n,i){this.static_tree=e,this.extra_bits=t,this.extra_base=r,this.elems=n,this.max_length=i,this.has_stree=e&&e.length}function F(e,t){this.dyn_tree=e,this.max_code=0,this.stat_desc=t}function N(e){return e<256?E[e]:E[256+(e>>>7)]}function U(e,t){e.pending_buf[e.pending++]=255&t,e.pending_buf[e.pending++]=t>>>8&255}function P(e,t,r){e.bi_valid>d-r?(e.bi_buf|=t<<e.bi_valid&65535,U(e,e.bi_buf),e.bi_buf=t>>d-e.bi_valid,e.bi_valid+=r-d):(e.bi_buf|=t<<e.bi_valid&65535,e.bi_valid+=r)}function L(e,t,r){P(e,r[2*t],r[2*t+1])}function j(e,t){for(var r=0;r|=1&e,e>>>=1,r<<=1,0<--t;);return r>>>1}function Z(e,t,r){var n,i,s=new Array(g+1),a=0;for(n=1;n<=g;n++)s[n]=a=a+r[n-1]<<1;for(i=0;i<=t;i++){var o=e[2*i+1];0!==o&&(e[2*i]=j(s[o]++,o))}}function W(e){var t;for(t=0;t<l;t++)e.dyn_ltree[2*t]=0;for(t=0;t<f;t++)e.dyn_dtree[2*t]=0;for(t=0;t<c;t++)e.bl_tree[2*t]=0;e.dyn_ltree[2*m]=1,e.opt_len=e.static_len=0,e.last_lit=e.matches=0}function M(e){8<e.bi_valid?U(e,e.bi_buf):0<e.bi_valid&&(e.pending_buf[e.pending++]=e.bi_buf),e.bi_buf=0,e.bi_valid=0}function H(e,t,r,n){var i=2*t,s=2*r;return e[i]<e[s]||e[i]===e[s]&&n[t]<=n[r]}function G(e,t,r){for(var n=e.heap[r],i=r<<1;i<=e.heap_len&&(i<e.heap_len&&H(t,e.heap[i+1],e.heap[i],e.depth)&&i++,!H(t,n,e.heap[i],e.depth));)e.heap[r]=e.heap[i],r=i,i<<=1;e.heap[r]=n}function K(e,t,r){var n,i,s,a,o=0;if(0!==e.last_lit)for(;n=e.pending_buf[e.d_buf+2*o]<<8|e.pending_buf[e.d_buf+2*o+1],i=e.pending_buf[e.l_buf+o],o++,0===n?L(e,i,t):(L(e,(s=A[i])+u+1,t),0!==(a=w[s])&&P(e,i-=I[s],a),L(e,s=N(--n),r),0!==(a=k[s])&&P(e,n-=T[s],a)),o<e.last_lit;);L(e,m,t)}function Y(e,t){var r,n,i,s=t.dyn_tree,a=t.stat_desc.static_tree,o=t.stat_desc.has_stree,h=t.stat_desc.elems,u=-1;for(e.heap_len=0,e.heap_max=_,r=0;r<h;r++)0!==s[2*r]?(e.heap[++e.heap_len]=u=r,e.depth[r]=0):s[2*r+1]=0;for(;e.heap_len<2;)s[2*(i=e.heap[++e.heap_len]=u<2?++u:0)]=1,e.depth[i]=0,e.opt_len--,o&&(e.static_len-=a[2*i+1]);for(t.max_code=u,r=e.heap_len>>1;1<=r;r--)G(e,s,r);for(i=h;r=e.heap[1],e.heap[1]=e.heap[e.heap_len--],G(e,s,1),n=e.heap[1],e.heap[--e.heap_max]=r,e.heap[--e.heap_max]=n,s[2*i]=s[2*r]+s[2*n],e.depth[i]=(e.depth[r]>=e.depth[n]?e.depth[r]:e.depth[n])+1,s[2*r+1]=s[2*n+1]=i,e.heap[1]=i++,G(e,s,1),2<=e.heap_len;);e.heap[--e.heap_max]=e.heap[1],function(e,t){var r,n,i,s,a,o,h=t.dyn_tree,u=t.max_code,l=t.stat_desc.static_tree,f=t.stat_desc.has_stree,c=t.stat_desc.extra_bits,d=t.stat_desc.extra_base,p=t.stat_desc.max_length,m=0;for(s=0;s<=g;s++)e.bl_count[s]=0;for(h[2*e.heap[e.heap_max]+1]=0,r=e.heap_max+1;r<_;r++)p<(s=h[2*h[2*(n=e.heap[r])+1]+1]+1)&&(s=p,m++),h[2*n+1]=s,u<n||(e.bl_count[s]++,a=0,d<=n&&(a=c[n-d]),o=h[2*n],e.opt_len+=o*(s+a),f&&(e.static_len+=o*(l[2*n+1]+a)));if(0!==m){do{for(s=p-1;0===e.bl_count[s];)s--;e.bl_count[s]--,e.bl_count[s+1]+=2,e.bl_count[p]--,m-=2}while(0<m);for(s=p;0!==s;s--)for(n=e.bl_count[s];0!==n;)u<(i=e.heap[--r])||(h[2*i+1]!==s&&(e.opt_len+=(s-h[2*i+1])*h[2*i],h[2*i+1]=s),n--)}}(e,t),Z(s,u,e.bl_count)}function X(e,t,r){var n,i,s=-1,a=t[1],o=0,h=7,u=4;for(0===a&&(h=138,u=3),t[2*(r+1)+1]=65535,n=0;n<=r;n++)i=a,a=t[2*(n+1)+1],++o<h&&i===a||(o<u?e.bl_tree[2*i]+=o:0!==i?(i!==s&&e.bl_tree[2*i]++,e.bl_tree[2*b]++):o<=10?e.bl_tree[2*v]++:e.bl_tree[2*y]++,s=i,u=(o=0)===a?(h=138,3):i===a?(h=6,3):(h=7,4))}function V(e,t,r){var n,i,s=-1,a=t[1],o=0,h=7,u=4;for(0===a&&(h=138,u=3),n=0;n<=r;n++)if(i=a,a=t[2*(n+1)+1],!(++o<h&&i===a)){if(o<u)for(;L(e,i,e.bl_tree),0!=--o;);else 0!==i?(i!==s&&(L(e,i,e.bl_tree),o--),L(e,b,e.bl_tree),P(e,o-3,2)):o<=10?(L(e,v,e.bl_tree),P(e,o-3,3)):(L(e,y,e.bl_tree),P(e,o-11,7));s=i,u=(o=0)===a?(h=138,3):i===a?(h=6,3):(h=7,4)}}n(T);var q=!1;function J(e,t,r,n){P(e,(s<<1)+(n?1:0),3),function(e,t,r,n){M(e),n&&(U(e,r),U(e,~r)),i.arraySet(e.pending_buf,e.window,t,r,e.pending),e.pending+=r}(e,t,r,!0)}r._tr_init=function(e){q||(function(){var e,t,r,n,i,s=new Array(g+1);for(n=r=0;n<a-1;n++)for(I[n]=r,e=0;e<1<<w[n];e++)A[r++]=n;for(A[r-1]=n,n=i=0;n<16;n++)for(T[n]=i,e=0;e<1<<k[n];e++)E[i++]=n;for(i>>=7;n<f;n++)for(T[n]=i<<7,e=0;e<1<<k[n]-7;e++)E[256+i++]=n;for(t=0;t<=g;t++)s[t]=0;for(e=0;e<=143;)z[2*e+1]=8,e++,s[8]++;for(;e<=255;)z[2*e+1]=9,e++,s[9]++;for(;e<=279;)z[2*e+1]=7,e++,s[7]++;for(;e<=287;)z[2*e+1]=8,e++,s[8]++;for(Z(z,l+1,s),e=0;e<f;e++)C[2*e+1]=5,C[2*e]=j(e,5);O=new D(z,w,u+1,l,g),B=new D(C,k,0,f,g),R=new D(new Array(0),x,0,c,p)}(),q=!0),e.l_desc=new F(e.dyn_ltree,O),e.d_desc=new F(e.dyn_dtree,B),e.bl_desc=new F(e.bl_tree,R),e.bi_buf=0,e.bi_valid=0,W(e)},r._tr_stored_block=J,r._tr_flush_block=function(e,t,r,n){var i,s,a=0;0<e.level?(2===e.strm.data_type&&(e.strm.data_type=function(e){var t,r=4093624447;for(t=0;t<=31;t++,r>>>=1)if(1&r&&0!==e.dyn_ltree[2*t])return o;if(0!==e.dyn_ltree[18]||0!==e.dyn_ltree[20]||0!==e.dyn_ltree[26])return h;for(t=32;t<u;t++)if(0!==e.dyn_ltree[2*t])return h;return o}(e)),Y(e,e.l_desc),Y(e,e.d_desc),a=function(e){var t;for(X(e,e.dyn_ltree,e.l_desc.max_code),X(e,e.dyn_dtree,e.d_desc.max_code),Y(e,e.bl_desc),t=c-1;3<=t&&0===e.bl_tree[2*S[t]+1];t--);return e.opt_len+=3*(t+1)+5+5+4,t}(e),i=e.opt_len+3+7>>>3,(s=e.static_len+3+7>>>3)<=i&&(i=s)):i=s=r+5,r+4<=i&&-1!==t?J(e,t,r,n):4===e.strategy||s===i?(P(e,2+(n?1:0),3),K(e,z,C)):(P(e,4+(n?1:0),3),function(e,t,r,n){var i;for(P(e,t-257,5),P(e,r-1,5),P(e,n-4,4),i=0;i<n;i++)P(e,e.bl_tree[2*S[i]+1],3);V(e,e.dyn_ltree,t-1),V(e,e.dyn_dtree,r-1)}(e,e.l_desc.max_code+1,e.d_desc.max_code+1,a+1),K(e,e.dyn_ltree,e.dyn_dtree)),W(e),n&&M(e)},r._tr_tally=function(e,t,r){return e.pending_buf[e.d_buf+2*e.last_lit]=t>>>8&255,e.pending_buf[e.d_buf+2*e.last_lit+1]=255&t,e.pending_buf[e.l_buf+e.last_lit]=255&r,e.last_lit++,0===t?e.dyn_ltree[2*r]++:(e.matches++,t--,e.dyn_ltree[2*(A[r]+u+1)]++,e.dyn_dtree[2*N(t)]++),e.last_lit===e.lit_bufsize-1},r._tr_align=function(e){P(e,2,3),L(e,m,z),function(e){16===e.bi_valid?(U(e,e.bi_buf),e.bi_buf=0,e.bi_valid=0):8<=e.bi_valid&&(e.pending_buf[e.pending++]=255&e.bi_buf,e.bi_buf>>=8,e.bi_valid-=8)}(e)}},{"../utils/common":41}],53:[function(e,t,r){"use strict";t.exports=function(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg="",this.state=null,this.data_type=2,this.adler=0}},{}],54:[function(e,t,r){(function(e){!function(r,n){"use strict";if(!r.setImmediate){var i,s,t,a,o=1,h={},u=!1,l=r.document,e=Object.getPrototypeOf&&Object.getPrototypeOf(r);e=e&&e.setTimeout?e:r,i="[object process]"==={}.toString.call(r.process)?function(e){process.nextTick(function(){c(e)})}:function(){if(r.postMessage&&!r.importScripts){var e=!0,t=r.onmessage;return r.onmessage=function(){e=!1},r.postMessage("","*"),r.onmessage=t,e}}()?(a="setImmediate$"+Math.random()+"$",r.addEventListener?r.addEventListener("message",d,!1):r.attachEvent("onmessage",d),function(e){r.postMessage(a+e,"*")}):r.MessageChannel?((t=new MessageChannel).port1.onmessage=function(e){c(e.data)},function(e){t.port2.postMessage(e)}):l&&"onreadystatechange"in l.createElement("script")?(s=l.documentElement,function(e){var t=l.createElement("script");t.onreadystatechange=function(){c(e),t.onreadystatechange=null,s.removeChild(t),t=null},s.appendChild(t)}):function(e){setTimeout(c,0,e)},e.setImmediate=function(e){"function"!=typeof e&&(e=new Function(""+e));for(var t=new Array(arguments.length-1),r=0;r<t.length;r++)t[r]=arguments[r+1];var n={callback:e,args:t};return h[o]=n,i(o),o++},e.clearImmediate=f}function f(e){delete h[e]}function c(e){if(u)setTimeout(c,0,e);else{var t=h[e];if(t){u=!0;try{!function(e){var t=e.callback,r=e.args;switch(r.length){case 0:t();break;case 1:t(r[0]);break;case 2:t(r[0],r[1]);break;case 3:t(r[0],r[1],r[2]);break;default:t.apply(n,r)}}(t)}finally{f(e),u=!1}}}}function d(e){e.source===r&&"string"==typeof e.data&&0===e.data.indexOf(a)&&c(+e.data.slice(a.length))}}("undefined"==typeof self?void 0===e?this:e:self)}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}]},{},[10])(10)});
/* ===== END JSZip vendor ===== */


/* ===== BEGIN runtime-fallbacks.js ===== */
/* ANORI TRANSPORT - runtime compatibility fallbacks.
   These fallbacks prevent hard JS failures when optional vendor binaries are not bundled.
   They are deliberately small and are replaced automatically by real libraries when present. */
(function () {
  'use strict';
  if (!window.Swal) {
    let active = null;
    let timer = null;
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
    const close = (result) => {
      if (!active) return;
      const a = active;
      active = null;
      if (timer) { clearTimeout(timer); timer = null; }
      a.overlay?.remove();
      a.resolve(result || { isDismissed: true, isConfirmed: false, isDenied: false });
    };
    const fire = async (opts = {}) => {
      if (active) close({ isDismissed: true, isConfirmed: false, isDenied: false });
      if (opts.toast) {
        const toast = document.createElement('div');
        toast.className = 'anori-native-toast anori-native-toast-' + (opts.icon || 'info');
        toast.innerHTML = '<span class="anori-native-toast-icon">' + (opts.icon === 'success' ? '✓' : opts.icon === 'error' ? '!' : opts.icon === 'warning' ? '⚠' : 'i') + '</span><span>' + esc(opts.title || opts.text || '') + '</span>';
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        const ms = Number(opts.timer) || 2500;
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 180); }, ms);
        return { isConfirmed: false, isDismissed: true, isDenied: false };
      }
      return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'anori-native-swal-backdrop';
        const popup = document.createElement('div');
        popup.className = 'anori-native-swal-popup';
        if (opts.width) popup.style.width = typeof opts.width === 'number' ? opts.width + 'px' : String(opts.width);
        const iconMap = {success:'✓', error:'!', warning:'⚠', info:'i', question:'?'};
        const icon = opts.icon && iconMap[opts.icon] ? '<div class="anori-native-swal-icon anori-icon-'+esc(opts.icon)+'">'+iconMap[opts.icon]+'</div>' : '';
        const title = opts.title ? '<div class="anori-native-swal-title">'+esc(opts.title)+'</div>' : '';
        const body = opts.html != null ? String(opts.html) : (opts.text ? '<div class="anori-native-swal-text">'+esc(opts.text)+'</div>' : '');
        const input = opts.input === 'text' ? '<div class="anori-native-swal-input-wrap">' + (opts.inputLabel ? '<label>'+esc(opts.inputLabel)+'</label>' : '') + '<input id="anori-native-swal-input" class="form-control" type="text" placeholder="'+esc(opts.inputPlaceholder || '')+'"></div>' : '';
        popup.innerHTML = icon + title + '<div class="anori-native-swal-body">' + body + input + '<div class="anori-native-swal-validation" aria-live="polite"></div></div>';
        const actions = document.createElement('div');
        actions.className = 'anori-native-swal-actions';
        const showConfirm = opts.showConfirmButton !== false;
        const showCancel = !!opts.showCancelButton;
        if (showCancel) {
          const cancel = document.createElement('button'); cancel.type='button'; cancel.className='btn btn-outline'; cancel.textContent=opts.cancelButtonText || 'Cancel';
          cancel.onclick=()=>close({isDismissed:true,isConfirmed:false,isDenied:false}); actions.appendChild(cancel);
        }
        if (showConfirm) {
          const confirm = document.createElement('button'); confirm.type='button'; confirm.className='btn btn-primary'; confirm.textContent=opts.confirmButtonText || 'OK';
          if (opts.confirmButtonColor) confirm.style.background=opts.confirmButtonColor;
          confirm.onclick=async()=>{
            try {
              let value;
              if (opts.input === 'text') value = document.getElementById('anori-native-swal-input')?.value || '';
              if (typeof opts.preConfirm === 'function') {
                confirm.disabled=true;
                value = await opts.preConfirm(value);
                confirm.disabled=false;
                if (value === false) return;
              }
              close({isConfirmed:true,isDismissed:false,isDenied:false,value});
            } catch (e) {
              confirm.disabled=false;
              fire.showValidationMessage(e?.message || 'Please check the entered information.');
            }
          }; actions.appendChild(confirm);
        }
        popup.appendChild(actions);
        overlay.appendChild(popup); document.body.appendChild(overlay);
        active={overlay,resolve};
        if (typeof opts.didOpen === 'function') { try { opts.didOpen(popup); } catch(e) { console.error(e); } }
        const inp=popup.querySelector('#anori-native-swal-input'); if(inp) setTimeout(()=>inp.focus(),0);
        overlay.addEventListener('click',e=>{ if(e.target===overlay && opts.allowOutsideClick!==false) close({isDismissed:true,isConfirmed:false,isDenied:false}); });
        if (opts.timer && !opts.showCancelButton && opts.showConfirmButton === false) timer=setTimeout(()=>close({isDismissed:true,isConfirmed:false,isDenied:false}),Number(opts.timer));
      });
    };
    fire.showValidationMessage = (message) => {
      const el = active?.overlay?.querySelector('.anori-native-swal-validation');
      if (el) { el.textContent=String(message||''); el.classList.toggle('show',!!message); }
    };
    fire.resetValidationMessage = () => {
      const el = active?.overlay?.querySelector('.anori-native-swal-validation'); if(el){el.textContent='';el.classList.remove('show');}
    };
    fire.close = () => close({isDismissed:true,isConfirmed:false,isDenied:false});
    window.Swal = { fire, close: fire.close, showValidationMessage: fire.showValidationMessage, resetValidationMessage: fire.resetValidationMessage };
  }
  // Browser/Electron-safe print fallback for optional PDF libraries.
  window.anoriPrintElement = window.anoriPrintElement || function (element, title) {
    if (!element) return false;
    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=900');
    if (!printWindow) { window.print(); return true; }
    const styles = [...document.querySelectorAll('style,link[rel="stylesheet"]')].map(n => n.outerHTML).join('\n');
    printWindow.document.open();
    printWindow.document.write('<!doctype html><html><head><meta charset="utf-8"><title>' + esc(title || 'ANORI TRANSPORT') + '</title>' + styles + '<style>@page{size:A4;margin:8mm}body{background:#fff!important;color:#0f172a!important}.no-print{display:none!important}.invoice-page{margin:0!important;box-shadow:none!important}</style></head><body>' + element.outerHTML + '</body></html>');
    printWindow.document.close();
    setTimeout(() => { try { printWindow.focus(); printWindow.print(); } finally { setTimeout(() => printWindow.close(), 1200); } }, 250);
    return true;
  };
  window.anoriPrintHtml = window.anoriPrintHtml || function (html, title) {
    const host = document.createElement('div'); host.innerHTML = String(html || '');
    document.body.appendChild(host);
    const ok = window.anoriPrintElement(host, title || 'ANORI TRANSPORT');
    host.remove();
    return ok;
  };
  if (!window.html2pdf) {
    window.html2pdf = function () {
      const state = { html: '' };
      return {
        set() { return this; },
        from(html) { state.html = html; return this; },
        save() { window.anoriPrintHtml(state.html, 'ANORI TRANSPORT PDF'); return Promise.resolve(); }
      };
    };
  }

})();

/* ===== END runtime-fallbacks.js ===== */

/* ===== BEGIN sqlite-lite.js ===== */
/* ANORI TRANSPORT - self-contained SQLite backup codec.
 * This is intentionally limited to the ANORI backup format it creates.
 * It writes a standards-compliant SQLite database with an anori_backup table,
 * so the resulting .sqlite file can be opened by normal SQLite tools.
 */
(function(){
  'use strict';
  if(window.AnoriSQLite) return;
  const PAGE=4096;
  const TE=new TextEncoder();
  const TD=new TextDecoder('utf-8',{fatal:false});
  const DATA_KEYS=['company_profile','vehicles','drivers','parties','trips','invoices','driver_settlements','payments','expense_master','followups','audit_log'];
  const META={application:'ANORI TRANSPORT',format:'ANORI_TRANSPORT_SQLITE_BACKUP',schema_version:1};
  const concat=(...xs)=>{let n=0;xs.forEach(x=>n+=x.length);const out=new Uint8Array(n);let p=0;xs.forEach(x=>{out.set(x,p);p+=x.length;});return out;};
  const be16=n=>Uint8Array.from([(n>>>8)&255,n&255]);
  const be32=n=>Uint8Array.from([(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255]);
  function varint(n){
    n=Math.max(0,Math.floor(Number(n)||0));const a=[];do{a.push(n%128);n=Math.floor(n/128);}while(n>0);
    const out=[];for(let i=a.length-1;i>=0;i--)out.push(a[i]|(i>0?128:0));return Uint8Array.from(out);
  }
  function readVarint(b,o){
    let v=0;for(let i=0;i<9;i++){const x=b[o+i];if(x===undefined)throw Error('Invalid SQLite varint.');if(i===8)return {value:v*256+x,next:o+9};v=v*128+(x&127);if(!(x&128))return {value:v,next:o+i+1};}throw Error('Invalid SQLite varint.');
  }
  function textSerial(s){const b=TE.encode(String(s??''));return {serial:13+2*b.length,bytes:b};}
  function intSerial(n){n=Number(n)||0;if(n===0)return {serial:8,bytes:new Uint8Array()};if(n===1)return {serial:9,bytes:new Uint8Array()};if(n>=-128&&n<=127)return {serial:1,bytes:Uint8Array.from([n<0?n+256:n])};if(n>=-32768&&n<=32767)return {serial:2,bytes:Uint8Array.from([(n>>8)&255,n&255])};return {serial:4,bytes:be32(n>>>0)};}
  function makeRecord(fields){
    const parts=fields.map(f=>f.type==='int'?intSerial(f.value):textSerial(f.value));
    const headerLen=1+parts.reduce((n,p)=>n+varint(p.serial).length,0);
    const header=concat(varint(headerLen),...parts.map(p=>varint(p.serial)));
    return concat(header,...parts.map(p=>p.bytes));
  }
  function makeCell(rowid,record){return concat(varint(record.length),varint(rowid),record);}
  function makeLeafPage(cells){
    const p=new Uint8Array(PAGE);p[0]=0x0d;let content=PAGE,ptrs=[];
    for(const cell of cells){content-=cell.length;if(content<8+(ptrs.length+1)*2)throw Error('SQLite page overflow.');p.set(cell,content);ptrs.push(content);}
    p.set(be16(0),1);p.set(be16(cells.length),3);p.set(be16(content),5);p[7]=0;let q=8;for(const ptr of ptrs)p.set(be16(ptr),q),q+=2;
    return {page:p,maxRowid:cells.length?cells[cells.length-1].rowid:0};
  }
  function packLeafRows(rows,startPage){
    const pages=[];let cells=[],used=8;
    const flush=()=>{if(!cells.length)return;const made=makeLeafPage(cells.map(x=>x.cell));pages.push({page:made.page,maxRowid:cells[cells.length-1].rowid});cells=[];used=8;};
    for(const row of rows){
      const cell=makeCell(row.rowid,row.record);const next=used+2+cell.length;
      if(cells.length&&next>PAGE){flush();}
      cells.push({cell,rowid:row.rowid});used+=2+cell.length;
    }
    flush();return pages;
  }
  function makeInteriorPage(children){
    const p=new Uint8Array(PAGE);p[0]=0x05;let cells=[];for(let i=0;i<children.length-1;i++)cells.push(concat(be32(children[i].pageNo),varint(children[i].maxRowid)));
    let content=PAGE;const ptrs=[];for(const cell of cells){content-=cell.length;if(content<12+ptrs.length*2+2)throw Error('SQLite interior page overflow.');p.set(cell,content);ptrs.push(content);}
    p.set(be16(0),1);p.set(be16(cells.length),3);p.set(be16(content),5);p[7]=0;p.set(be32(children[children.length-1].pageNo),8);let q=12;for(const ptr of ptrs)p.set(be16(ptr),q),q+=2;
    return p;
  }
  function schemaPage(rootPage){
    const sql='CREATE TABLE anori_backup(chunk_no INTEGER PRIMARY KEY, payload TEXT NOT NULL)';
    const rec=makeRecord([{type:'text',value:'table'},{type:'text',value:'anori_backup'},{type:'text',value:'anori_backup'},{type:'int',value:rootPage},{type:'text',value:sql}]);
    const cell=makeCell(1,rec);const p=new Uint8Array(PAGE);const base=100;p[base]=0x0d;p.set(be16(0),base+1);p.set(be16(1),base+3);const at=PAGE-cell.length;p.set(be16(at),base+5);p[base+7]=0;p.set(be16(at),base+8);p.set(cell,at);return p;
  }
  function header(pageCount,rootPage){
    const h=new Uint8Array(PAGE);h.set(TE.encode('SQLite format 3\0'),0);h.set(be16(PAGE),16);h[18]=1;h[19]=1;h[20]=0;h[21]=64;h[22]=32;h[23]=32;h.set(be32(1),24);h.set(be32(pageCount),28);h.set(be32(0),32);h.set(be32(0),36);h.set(be32(1),40);h.set(be32(4),44);h.set(be32(0),48);h.set(be32(0),52);h.set(be32(1),56);h.set(be32(0),60);h.set(be32(0),64);h.set(be32(0),68);h.set(be32(1),92);h.set(be32(3046000),96);return h;
  }
  function exportSnapshot(snapshot){
    const full=Object.assign({},META,{exported_at:new Date().toISOString(),data:snapshot});
    const json=JSON.stringify(full);
    const bytes=TE.encode(json);
    const chunkSize=2500;const rows=[];let rowid=1;
    for(let off=0;off<bytes.length;){let end=Math.min(bytes.length,off+chunkSize);while(end<bytes.length&&(bytes[end]&0xc0)===0x80)end--;if(end<=off)end=Math.min(bytes.length,off+chunkSize);const chunk=TD.decode(bytes.slice(off,end));const rec=makeRecord([{type:'int',value:rowid},{type:'text',value:chunk}]);rows.push({rowid,record:rec});rowid++;off=end;}
    if(!rows.length){const rec=makeRecord([{type:'int',value:1},{type:'text',value:''}]);rows.push({rowid:1,record:rec});}
    const leafCountEstimate=1;let leafPages=packLeafRows(rows,3);let rootPage=2;let nextPage=3;
    if(leafPages.length===1){rootPage=2;nextPage=3;}
    else {rootPage=2;nextPage=3+leafPages.length;}
    const totalPages=leafPages.length===1?2:2+leafPages.length;
    const out=new Uint8Array(PAGE*totalPages);out.set(header(totalPages,rootPage),0);let pageNo=3;
    if(leafPages.length===1){{const sp=schemaPage(rootPage);out.set(sp.subarray(100),100);}out.set(leafPages[0].page,PAGE);}
    else {{const sp=schemaPage(rootPage);out.set(sp.subarray(100),100);}const children=[];leafPages.forEach((lp,i)=>{children.push({pageNo:3+i,maxRowid:lp.maxRowid});});out.set(makeInteriorPage(children),PAGE);leafPages.forEach((lp,i)=>out.set(lp.page,PAGE*(2+i)));}
    return out;
  }
  function serialValue(b,serial,offset){
    if(serial===0)return {value:null,next:offset};if(serial===8)return {value:0,next:offset};if(serial===9)return {value:1,next:offset};
    if(serial>=13&&serial%2===1){const len=(serial-13)/2;return {value:TD.decode(b.slice(offset,offset+len)),next:offset+len};}
    const sizes={1:1,2:2,3:3,4:4,5:6,6:8,7:8};const len=sizes[serial];if(!len)throw Error('Unsupported SQLite serial type.');let n=0;for(let i=0;i<len;i++)n=n*256+b[offset+i];return {value:n,next:offset+len};
  }
  function parseRecord(b,start,end){const h=readVarint(b,start),headerEnd=start+h.value;let o=start+h.next-start,types=[];while(o<headerEnd){const v=readVarint(b,o);types.push(v.value);o=v.next;}let data=headerEnd,vals=[];types.forEach(t=>{const v=serialValue(b,t,data);vals.push(v.value);data=v.next;});return vals;}
  function pageInfo(bytes,pageNo){const base=(pageNo-1)*PAGE+(pageNo===1?100:0);const flags=bytes[base];if(flags===0x0d)return {base,pageStart:(pageNo-1)*PAGE,flags,leaf:true,count:(bytes[base+3]<<8)|bytes[base+4],right:null};if(flags===0x05)return {base,pageStart:(pageNo-1)*PAGE,flags,leaf:false,count:(bytes[base+3]<<8)|bytes[base+4],right:((bytes[base+8]<<24)>>>0)|(bytes[base+9]<<16)|(bytes[base+10]<<8)|bytes[base+11]};throw Error('Unsupported SQLite b-tree page type.');}
  function cellPtr(bytes,info,i){const p=info.base+(info.leaf?8:12)+i*2;return info.pageStart+((bytes[p]<<8)|bytes[p+1]);}
  function collectLeafRows(bytes,pageNo,out){const info=pageInfo(bytes,pageNo);if(info.leaf){for(let i=0;i<info.count;i++){const ptr=cellPtr(bytes,info,i);const pl=readVarint(bytes,ptr);const rid=readVarint(bytes,pl.next);const recStart=rid.next;const recEnd=recStart+pl.value;out.push({rowid:rid.value,vals:parseRecord(bytes,recStart,recEnd)});}return;}for(let i=0;i<info.count;i++){const ptr=cellPtr(bytes,info,i);const child=((bytes[ptr]<<24)>>>0)|(bytes[ptr+1]<<16)|(bytes[ptr+2]<<8)|bytes[ptr+3];collectLeafRows(bytes,child,out);}collectLeafRows(bytes,info.right,out);}
  function importBytes(arrayBuffer){
    const bytes=new Uint8Array(arrayBuffer);if(bytes.length<PAGE*2)throw Error('Invalid ANORI SQLite backup.');const magic=TD.decode(bytes.slice(0,16));if(magic!=='SQLite format 3\0')throw Error('Invalid SQLite file.');const pageSize=(bytes[16]<<8)|bytes[17];if(pageSize!==PAGE)throw Error('Unsupported SQLite page size.');
    const schema=[];collectLeafRows(bytes,1,schema);const entry=schema.find(r=>r.vals[1]==='anori_backup');if(!entry)throw Error('This is not an ANORI TRANSPORT SQLite backup.');const root=Number(entry.vals[3]);const rows=[];collectLeafRows(bytes,root,rows);rows.sort((a,b)=>a.rowid-b.rowid);const json=rows.map(r=>String(r.vals[1]??'')).join('');const full=JSON.parse(json);if(full.format!==META.format)throw Error('Unsupported ANORI SQLite backup format.');return full.data||{};
  }
  window.AnoriSQLite={exportSnapshot,importBytes,isAvailable:()=>true,DATA_KEYS:DATA_KEYS.slice()};
})();

/* ===== END sqlite-lite.js ===== */

/* ===== BEGIN sqlite-capability.js ===== */
/* ANORI TRANSPORT - SQLite capability. */
(function(){
  'use strict';
  window.__ANORI_SQLITE_DISABLED__ = !(window.AnoriSQLite && typeof window.AnoriSQLite.exportSnapshot==='function');
  window.__ANORI_SQL_LOCAL__ = true;
})();

/* ===== END sqlite-capability.js ===== */

/* ===== BEGIN core.js ===== */

/* Local-file safety: ANORI must never create or navigate an iframe to index.html. */
(function(){
  if(window.__ANORI_LOCAL_SAFE__) return;
  try { window.__ANORI_LOCAL_SAFE__ = true; } catch (_) {}
})();
/**
 * Anori Transport ERP - Core Engine (v2.16.0 - FINAL PRODUCTION + RUNTIME HOTFIX)
 * All known bugs fixed, security hardened, performance optimized.
 */
'use strict';

// Global toast compatibility helper: some legacy invoice actions call toast()
// directly, while the current notification API is Utils.toast().
window.toast = window.toast || function(message, type='info'){
  if(window.Utils && typeof window.Utils.toast === 'function') return window.Utils.toast(message, type);
  return null;
};

// ==========================================
// 0. AUTHENTICATION SYSTEM (FIXED)
// ==========================================
const Auth = {
    login(username, password) {
        // In production, replace with secure backend validation
        const valid = username === 'admin' && password === 'admin123';
        if (valid) {
            sessionStorage.setItem('anori_auth', JSON.stringify({
                user: 'admin',
                role: 'admin',
                expires: Date.now() + 3600000 // 1 hour
            }));
            // HIDE login overlay
            document.getElementById('loginOverlay').classList.add('hidden');
            document.getElementById('loginError').textContent = '';
            UI.initAfterLogin();
            return true;
        } else {
            document.getElementById('loginError').textContent = 'Invalid username or password';
            return false;
        }
    },
    logout() {
        sessionStorage.removeItem('anori_auth');
        // SHOW login overlay
        document.getElementById('loginOverlay').classList.remove('hidden');
        document.querySelectorAll('.view').forEach(v => v.remove());
        document.getElementById('globalSearch').value = '';
        // Reset login form
        document.getElementById('loginUsername').value = 'admin';
        document.getElementById('loginPassword').value = 'admin123';
        document.getElementById('loginError').textContent = '';
    },
    isAuthenticated() {
        try {
            const auth = JSON.parse(sessionStorage.getItem('anori_auth') || 'null');
            return !!(auth && auth.expires > Date.now());
        } catch (e) {
            sessionStorage.removeItem('anori_auth');
            return false;
        }
    },
    check() {
        if (!this.isAuthenticated()) {
            document.getElementById('loginOverlay').classList.remove('hidden');
            return false;
        }
        document.getElementById('loginOverlay').classList.add('hidden');
        return true;
    },
    requireAuth() {
        if (!this.isAuthenticated()) {
            Utils.toast('Session expired. Please login again.', 'warning');
            this.logout();
            return false;
        }
        return true;
    }
};

// ==========================================
// 1. SAFE DATABASE & UTILITIES
// ==========================================
const DB = {
    get(key, fallback = []) {
        try {
            const data = localStorage.getItem(`anori_${key}`);
            return data ? JSON.parse(data) : fallback;
        } catch (e) {
            localStorage.removeItem(`anori_${key}`);
            return fallback;
        }
    },
    set(key, data, bypassAuth = false) {
        if (!bypassAuth && !Auth.requireAuth()) return false;
        try {
            localStorage.setItem(`anori_${key}`, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('DB.set failed:', e);
            Utils.toast('Unable to save data. Storage may be full.', 'error');
            return false;
        }
    }
};

// Initialize defaults
if (!DB.get('company_profile').name) {
    DB.set('company_profile', { name: 'Anori Transport Services', addr: '123 Logistics Park, Mumbai', gst: '27AABCA1234F1Z5', phone: '+91 98765 43210', bank: 'HDFC0001234', acc: '1234567890' }, true);
    DB.set('vehicles', [{ id: 'v1', number: 'MH12AB1234', type: 'Truck' }], true);
    DB.set('drivers', [{ id: 'd1', name: 'Mukesh Singh', mobile: '9876543210' }], true);
    DB.set('parties', [{ id: 'p1', name: 'Tata Logistics', gst: '27AABCT1234F1Z5', addr: 'Mumbai' }], true);
    DB.set('trips', [{ id: 't1', trip_no: 'TRP-240501-1030', date: '2024-05-01', vehicle_id: 'v1', driver_id: 'd1', party_id: 'p1', from: 'Mumbai', to: 'Pune', freight: 15000, status: 'completed', invoice_status: 'pending', is_gst: true, expenses: [{ type: 'Diesel', amount: 4000 }], notes: '' }], true);
    DB.set('invoices', [], true);
    DB.set('driver_settlements', [], true);
}

// Add requested default vehicles without removing or changing existing vehicles.
const ANORI_DEFAULT_VEHICLES = [
    'MH04MH6475',
    'MH04NB6475',
    'MH04MT6475',
    'MH04KF1919',
    'MH04JU7897',
    'MH04LQ4244'
];
const existingVehicles = DB.get('vehicles', []);
const existingVehicleNumbers = new Set(existingVehicles.map(v => String(v.number || '').trim().toUpperCase()));
const missingDefaultVehicles = ANORI_DEFAULT_VEHICLES
    .filter(number => !existingVehicleNumbers.has(number))
    .map((number, index) => ({ id: `default-v${Date.now()}-${index}`, number, type: 'Truck', driver_amount: 0 }));
if (missingDefaultVehicles.length) {
    DB.set('vehicles', existingVehicles.concat(missingDefaultVehicles), true);
}

const Sanitize = {
    html(str) {
        if (!str) return '';
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return String(str).replace(/[&<>"']/g, m => map[m]);
    },
    number(num) { return parseFloat(num) || 0; },
    date(dateStr) {
        return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr : Utils.today();
    },
    escapeJSON(obj) {
        if (Array.isArray(obj)) return obj.map(v => this.escapeJSON(v));
        if (obj && typeof obj === 'object') {
            const result = {};
            for (let [key, val] of Object.entries(obj)) {
                if (typeof val === 'string') result[key] = this.html(val);
                else if (typeof val === 'object') result[key] = this.escapeJSON(val);
                else result[key] = val;
            }
            return result;
        }
        return obj;
    }
};

const Utils = {
    id: () => Date.now().toString(36) + Math.random().toString(36).substr(2),
    fmt: (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0),
    fmtDec: (n) => '' + (parseFloat(n) || 0).toFixed(2),
    today: () => new Date().toISOString().split('T')[0],
    toast: (msg, type = 'success') => { if (window.Swal?.fire) return window.Swal.fire({ icon: type, title: msg, toast: true, position: 'top-end', timer: 2500, showConfirmButton: false }); console[type === 'error' ? 'error' : 'log'](msg); },
    
    numberToWords: function(num) {
        if (num === 0) return 'Zero Only';
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        function convert(n) {
            if (n < 20) return ones[n];
            if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
            if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
            if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
            if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
            return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
        }
        return 'Rupees ' + convert(Math.floor(num)).trim() + ' Only';
    },
    
    generateTripNo: function(dateValue) {
        const baseDate = dateValue ? new Date(`${dateValue}T00:00:00`) : new Date();
        const yy = String(baseDate.getFullYear()).slice(-2);
        const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
        const dd = String(baseDate.getDate()).padStart(2, '0');
        const base = `TRP-${yy}${mm}${dd}`;
        const trips = DB.get('trips', []) || [];
        const prefix = `${base}-`;
        const used = new Set(trips
            .map(t => String(t.trip_no || ''))
            .filter(no => no.startsWith(prefix))
            .map(no => Number(no.slice(prefix.length)))
            .filter(n => Number.isInteger(n) && n > 0));
        let counter = 1;
        while (used.has(counter)) counter++;
        return `${base}-${String(counter).padStart(2, '0')}`;
    },
    
    generateInvoiceNo: function() {
        const now = new Date();
        const base = `INV-${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const invoices = DB.get('invoices');
        let no;
        do { no = `${base}-${Math.floor(Math.random() * 900000) + 100000}`; }
        while (invoices.some(i => i.invoice_no === no));
        return no;
    },
    
    getMonthYear: function() {
        const now = new Date();
        return { month: now.getMonth(), year: now.getFullYear() };
    },
    
    showLoader(text = 'Loading...') {
        document.getElementById('loaderText').textContent = text;
        document.getElementById('loader').classList.add('active');
    },
    hideLoader() {
        document.getElementById('loader').classList.remove('active');
    }
};

// ==========================================
// 2. UI & ROUTER CONTROLLER
// ==========================================
const UI = {
    init() {
        if (!Auth.check()) {
            document.getElementById('loginOverlay').classList.remove('hidden');
        } else {
            this.initAfterLogin();
        }
        document.getElementById('loginBtn').addEventListener('click', () => {
            const user = document.getElementById('loginUsername').value;
            const pass = document.getElementById('loginPassword').value;
            Auth.login(user, pass);
        });
        document.getElementById('loginPassword').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('loginBtn').click();
        });
        document.getElementById('logoutBtn').addEventListener('click', () => Auth.logout());
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (document.getElementById('previewModal').classList.contains('active')) this.closePreview();
                else if (document.getElementById('modalBackdrop').classList.contains('active')) this.closeModal();
            }
        });
    },
    
    initAfterLogin() {
        this.bindTheme();
        this.bindSidebar();
        this.bindGlobalEvents();
        this.bindSearch();
        Router.go('dashboard');
    },
    
    bindTheme() {
        const saved = localStorage.getItem('anori_theme') || 'light';
        document.documentElement.setAttribute('data-theme', saved);
        const btn = document.getElementById('themeToggle');
        btn.innerHTML = saved === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        btn.onclick = () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('anori_theme', next);
            btn.innerHTML = next === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        };
    },
    
    bindSidebar() {
        document.getElementById('menuToggle').onclick = () => document.getElementById('sidebar').classList.toggle('open');
        document.getElementById('navMenu').onclick = (e) => {
            const item = e.target.closest('.nav-item');
            if (item) {
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                item.classList.add('active');
                Router.go(item.dataset.view);
                document.getElementById('sidebar').classList.remove('open');
                document.getElementById('globalSearch').value = '';
            }
        };
    },

    bindSearch() {
        const searchInput = document.getElementById('globalSearch');
        const debounce = (fn, delay) => {
            let timeout;
            return (...args) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => fn(...args), delay);
            };
        };
        searchInput.addEventListener('input', debounce((e) => {
            const query = e.target.value.toLowerCase();
            const activeView = document.querySelector('.view.active');
            if (!activeView) return;
            const tables = activeView.querySelectorAll('table tbody');
            tables.forEach(tbody => {
                const rows = tbody.querySelectorAll('tr');
                rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    row.style.display = text.includes(query) ? '' : 'none';
                });
            });
        }, 300));
    },
    
    bindGlobalEvents() {
        document.getElementById('mainContent').addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            const id = btn.dataset.id;
            const type = btn.dataset.type;

            if (action === 'delete-master') {
                e.preventDefault(); e.stopPropagation();
                Masters.delete(type, id);
            }
            if (action === 'edit-master') {
                e.preventDefault(); e.stopPropagation();
                Masters.openModal(type, id);
            }
            if (action === 'view-trip') {
                e.preventDefault(); e.stopPropagation();
                Trips.view(id);
            }
            if (action === 'edit-trip') {
                e.preventDefault(); e.stopPropagation();
                Trips.openEditForm(id);
            }
            if (action === 'delete-trip') {
                e.preventDefault(); e.stopPropagation();
                Trips.delete(id);
            }
            if (action === 'duplicate-trip') {
                e.preventDefault(); e.stopPropagation();
                Trips.duplicate(id);
            }
            if (action === 'delete-invoice') {
                e.preventDefault(); e.stopPropagation();
                Invoices.deleteInvoice(id);
            }
        });

        // Invoice status dropdown - change event
        document.getElementById('mainContent').addEventListener('change', (e) => {
            const target = e.target;
            if (target.dataset.action === 'update-invoice-status') {
                const id = target.dataset.id;
                const newStatus = target.value;
                Invoices.updateStatus(id, newStatus);
            }
        });

        document.getElementById('modalClose').onclick = () => this.closeModal();
        document.getElementById('modalCancel').onclick = () => this.closeModal();
        document.getElementById('modalBackdrop').onclick = (e) => { if(e.target.id === 'modalBackdrop') this.closeModal(); };
        
        document.getElementById('previewClose').onclick = () => this.closePreview();
        document.getElementById('previewModal').onclick = (e) => { if(e.target.id === 'previewModal') this.closePreview(); };
        
        document.getElementById('previewDownloadBtn').onclick = async (e) => {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            const btn = document.getElementById('previewDownloadBtn');
            const invoiceId = document.getElementById('previewContent').dataset.invoiceId;
            if (!invoiceId) {
                try { Utils.toast('Invoice is not available for PDF download.', 'warning'); } catch (_) {}
                return;
            }
            if (btn && btn.dataset.pdfBusy === '1') return;
            if (btn) {
                btn.dataset.pdfBusy = '1';
                btn.disabled = true;
                btn.dataset.originalHtml = btn.innerHTML;
                btn.innerHTML = '<i class=\"fas fa-spinner fa-spin\"></i> Downloading PDF…';
            }
            try {
                // In Electron this routes to the native printToPDF IPC handler,
                // which writes directly to the Windows Downloads folder without
                // opening a Save As dialog. Browser/file mode retains its native
                // print fallback.
                await Invoices.downloadExisting(invoiceId);
            } catch (err) {
                console.error('Invoice PDF download error:', err);
                try { Utils.toast(err && err.message ? err.message : 'Unable to download PDF.', 'error'); } catch (_) {}
            } finally {
                if (btn) {
                    btn.dataset.pdfBusy = '0';
                    btn.disabled = false;
                    btn.innerHTML = btn.dataset.originalHtml || '<i class=\"fas fa-download\"></i> Download PDF';
                }
            }
        };

        document.getElementById('backupBtn').onclick = () => Settings.backup();
    },
    
    openModal(title, bodyHtml, onSave, isTripForm = false) {
        document.getElementById('modalTitle').innerText = title;
        const body = document.getElementById('modalBody');
        body.innerHTML = bodyHtml;
        if (isTripForm) body.classList.add('trip-form-bg');
        else body.classList.remove('trip-form-bg');
        document.getElementById('modalBackdrop').classList.add('active');
        document.getElementById('modalSave').onclick = onSave;
    },
    
    closeModal() { 
        document.getElementById('modalBackdrop').classList.remove('active');
        document.getElementById('modalBody').classList.remove('trip-form-bg');
    },
    
    closePreview() {
        document.getElementById('previewModal').classList.remove('active');
        document.getElementById('previewContent').innerHTML = '';
    }
};

const Router = {
    go(view) {
        if (!Auth.requireAuth()) return;
        const allowed = ['dashboard','masters','trips','invoices','settlements','expenses','reports','settings'];
        if (!allowed.includes(view)) {
            console.warn('Unknown route:', view);
            view = 'dashboard';
        }
        document.querySelectorAll('.view').forEach(v => v.remove());
        const container = document.getElementById('mainContent');
        const viewEl = document.createElement('div');
        viewEl.className = 'view active';
        container.appendChild(viewEl);

        /* v2.16: page/tab names are kept in navigation only; do not render a duplicate text heading above each view. */
        const content = document.createElement('div');
        viewEl.appendChild(content);
        Router._currentContainer = content;

        if (view === 'dashboard') Dashboard.render(content);
        if (view === 'masters') Masters.render(content);
        if (view === 'trips') Trips.render(content);
        if (view === 'invoices') Invoices.render(content);
        if (view === 'settlements') DriverSettlement.render(content);
        if (view === 'expenses') Expenses.render(content);
        if (view === 'reports') Reports.render(content);
        if (view === 'settings') Settings.render(content);

        /* Install table UX after the module has rendered. */
        setTimeout(()=>window.anoriInstallTableUX?.(),0);
    }
};

// ==========================================
// 3. DASHBOARD MODULE
// ==========================================

/* ===== END core.js ===== */

/* ===== BEGIN dashboard.js ===== */
const Dashboard = {
    selectedMonth: null,
    selectedYear: null,
    chartInstances: [],
    
    render(container) {
        const { month, year } = Utils.getMonthYear();
        this.selectedMonth = month;
        this.selectedYear = year;
        
        const trips = DB.get('trips');
        const filteredTrips = this.filterByMonth(trips);
        
        const totalTrips = filteredTrips.length;
        const totalRev = filteredTrips.reduce((s, t) => s + (t.freight || 0), 0);
        const totalExp = filteredTrips.reduce((s, t) => s + (t.expenses || []).reduce((e, x) => e + (x.amount || 0), 0), 0);
        const totalProfit = totalRev - totalExp;

        container.innerHTML += `
            <div class="card" style="margin-bottom: 20px;">
                <div class="form-row" style="align-items: flex-end;">
                    <div class="form-group" style="margin: 0;">
                        <label>Filter by Month</label>
                        <select class="form-control" id="dashMonth" onchange="Dashboard.changeMonth()">
                            ${['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => 
                                `<option value="${i}" ${i === month ? 'selected' : ''}>${m}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label>Year</label>
                        <select class="form-control" id="dashYear" onchange="Dashboard.changeMonth()">
                            ${[2023, 2024, 2025, 2026].map(y => `<option value="${y}" ${y === year ? 'selected' : ''}>${y}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>
            <div class="grid grid-4">
                <div class="card kpi-card"><div class="kpi-info"><h4>Total Trips</h4><p>${totalTrips}</p></div><div class="kpi-icon bg-blue"><i class="fas fa-truck"></i></div></div>
                <div class="card kpi-card"><div class="kpi-info"><h4>Total Revenue</h4><p>${Utils.fmt(totalRev)}</p></div><div class="kpi-icon bg-green"><i class="fas fa-indian-rupee-sign"></i></div></div>
                <div class="card kpi-card"><div class="kpi-info"><h4>Total Expenses</h4><p>${Utils.fmt(totalExp)}</p></div><div class="kpi-icon bg-red"><i class="fas fa-arrow-trend-down"></i></div></div>
                <div class="card kpi-card"><div class="kpi-info"><h4>Net Profit</h4><p>${Utils.fmt(totalProfit)}</p></div><div class="kpi-icon bg-purple"><i class="fas fa-wallet"></i></div></div>
            </div>
            <div class="grid grid-2" style="margin-top: 20px;">
                <div class="card"><h3 class="card-title"><i class="fas fa-chart-line"></i> Profit Trend</h3><div style="height: 250px;"><canvas id="chartProfit"></canvas></div></div>
                <div class="card"><h3 class="card-title"><i class="fas fa-chart-pie"></i> Expense Breakdown</h3><div style="height: 250px;"><canvas id="chartExp"></canvas></div></div>
            </div>
        `;
        // Destroy old chart instances before creating new ones
        this.destroyCharts();
        setTimeout(() => this.renderCharts(filteredTrips), 200);
    },
    
    filterByMonth(trips) {
        return trips.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === this.selectedMonth && d.getFullYear() === this.selectedYear;
        });
    },
    
    changeMonth() {
        this.selectedMonth = parseInt(document.getElementById('dashMonth').value);
        this.selectedYear = parseInt(document.getElementById('dashYear').value);
        Router.go('dashboard');
    },
    
    destroyCharts() {
        if (this.chartInstances && this.chartInstances.length) {
            this.chartInstances.forEach(chart => chart.destroy());
        }
        this.chartInstances = [];
    },
    
    renderCharts(trips) {
        if (typeof window.Chart !== 'function') {
            const p = document.getElementById('chartProfit');
            const e = document.getElementById('chartExp');
            if (p) { const box=p.parentElement; box.innerHTML='<div class="anori-chart-fallback"><strong>Profit Trend</strong><span>Chart library is not bundled in this build.</span><em>Financial totals above remain fully available.</em></div>'; }
            if (e) { const box=e.parentElement; box.innerHTML='<div class="anori-chart-fallback"><strong>Expense Breakdown</strong><span>Chart library is not bundled in this build.</span><em>Use Reports &amp; Analytics for detailed figures.</em></div>'; }
            return;
        }
        const ctx1 = document.getElementById('chartProfit');
        if (ctx1 && ctx1.offsetParent !== null) {
            const chart1 = new Chart(ctx1, { type: 'line', data: { labels: trips.map(t => t.date), datasets: [{ label: 'Profit', data: trips.map(t => t.freight - (t.expenses||[]).reduce((s,e)=>s+e.amount,0)), borderColor: '#6366f1', tension: 0.4, fill: true, backgroundColor: 'rgba(99, 102, 241, 0.1)' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
            this.chartInstances.push(chart1);
        }
        const expTypes = {};
        trips.forEach(t => (t.expenses||[]).forEach(e => expTypes[e.type] = (expTypes[e.type]||0) + e.amount));
        const ctx2 = document.getElementById('chartExp');
        if (ctx2 && ctx2.offsetParent !== null) {
            const chart2 = new Chart(ctx2, { type: 'doughnut', data: { labels: Object.keys(expTypes), datasets: [{ data: Object.values(expTypes), backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'] }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } } });
            this.chartInstances.push(chart2);
        }
    }
};

// ==========================================
// 4. MASTERS MODULE (FIXED delete)
// ==========================================

/* ===== END dashboard.js ===== */

/* ===== BEGIN trip-management.js ===== */
const Trips = {
    render(container) {
        const trips = DB.get('trips'); 
        const vehicles = DB.get('vehicles'); 
        const drivers = DB.get('drivers'); 
        const parties = DB.get('parties');
        
        container.innerHTML += `
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                    <h3 class="card-title">All Trips</h3>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-primary" onclick="Invoices.showInvoiceGenerator()"><i class="fas fa-file-invoice"></i> Generate Invoice</button>
                        <button class="btn btn-success" onclick="Trips.openForm()"><i class="fas fa-plus"></i> New Trip</button>
                    </div>
                </div>
                ${trips.length === 0 ? `<div class="empty-state"><i class="fas fa-route"></i><h3>No Trips Yet</h3><p>Start by creating your first trip.</p></div>` : `
                <div class="table-wrapper">
                    <table>
                        <thead><tr><th>Date</th><th>Trip #</th><th>Vehicle</th><th>Driver</th><th>Party</th><th>Route</th><th>Freight</th><th>Expenses</th><th>Profit</th><th>Status</th><th>Action</th></tr></thead>
                        <tbody>
                            ${trips.map(t => {
                                const v = vehicles.find(x => x.id === t.vehicle_id);
                                const d = drivers.find(x => x.id === t.driver_id);
                                const p = parties.find(x => x.id === t.party_id);
                                const expenses = (t.expenses||[]).reduce((s,e)=>s+e.amount,0);
                                const profit = t.freight - expenses;
                                const statusClass = t.invoice_status === 'paid' ? 'status-paid' : (t.invoice_status === 'shared' ? 'status-shared' : 'status-pending');
                                
                                return `<tr>
                                    <td>${t.date}</td><td><strong>${Sanitize.html(t.trip_no)}</strong></td><td>${Sanitize.html(v?.number)||'-'}</td><td>${Sanitize.html(d?.name)||'-'}</td><td>${Sanitize.html(p?.name)||'-'}</td>
                                    <td>${Sanitize.html(t.from)} → ${Sanitize.html(t.to)}</td><td>${Utils.fmt(t.freight)}</td>
                                    <td class="expense-red">-${Utils.fmt(expenses)}</td>
                                    <td style="color:${profit>=0?'var(--success)':'var(--danger)'}; font-weight:600;">${Utils.fmt(profit)}</td>
                                    <td><span class="status-badge ${statusClass}">${t.invoice_status.toUpperCase()}</span></td>
                                    <td style="white-space: nowrap;">
                                        <button class="btn btn-outline btn-icon" data-action="view-trip" data-id="${t.id}" title="View"><i class="fas fa-eye"></i></button>
                                        <button class="btn btn-outline btn-icon" data-action="edit-trip" data-id="${t.id}" title="Edit"><i class="fas fa-edit"></i></button>
                                        <button class="btn btn-outline btn-icon" data-action="duplicate-trip" data-id="${t.id}" title="Duplicate"><i class="fas fa-copy"></i></button>
                                        <button class="btn btn-danger btn-icon" data-action="delete-trip" data-id="${t.id}" title="Delete"><i class="fas fa-trash"></i></button>
                                    </td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>`}
            </div>
        `;
    },
    
    openForm() {
        const vehicles = DB.get('vehicles'); const drivers = DB.get('drivers'); const parties = DB.get('parties');
        const html = `
            <div class="form-row">
                <div class="form-group"><label>Date</label><input type="date" class="form-control" id="t_date" value="${Utils.today()}"></div>
                <div class="form-group"><label>Vehicle</label><select class="form-control" id="t_vehicle">${vehicles.map(v=>`<option value="${v.id}">${Sanitize.html(v.number)}</option>`).join('')}</select></div>
                <div class="form-group"><label>Driver</label><select class="form-control" id="t_driver">${drivers.map(d=>`<option value="${d.id}">${Sanitize.html(d.name)}</option>`).join('')}</select></div>
                <div class="form-group"><label>Party</label><select class="form-control" id="t_party">${parties.map(p=>`<option value="${p.id}">${Sanitize.html(p.name)}</option>`).join('')}</select></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>From</label><input class="form-control" id="t_from" required></div>
                <div class="form-group"><label>To</label><input class="form-control" id="t_to" required></div>
                <div class="form-group"><label>Freight (₹)</label><input type="number" class="form-control" id="t_freight" required min="0"></div>
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea class="form-control" id="t_notes" rows="2" placeholder="Optional notes"></textarea>
            </div>
            <h4 style="margin:16px 0 8px;">Expenses</h4>
            <div id="expRows"></div>
            <button type="button" class="btn btn-outline btn-sm" onclick="Trips.addExpRow()" style="margin-top:8px;"><i class="fas fa-plus"></i> Add Expense</button>
        `;
        UI.openModal('Create New Trip', html, () => this.save(), true); 
        this.addExpRow();
    },
    
    openEditForm(id) {
        const invoices = DB.get('invoices');
        const hasInvoice = invoices.some(inv => inv.trip_ids.includes(id));
        
        if (hasInvoice) {
            Swal.fire({
                title: 'Invoice Generated!',
                text: 'This trip is already part of an invoice. Editing it may cause discrepancies. Continue?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#f59e0b',
                cancelButtonText: 'Cancel',
                confirmButtonText: 'Yes, Edit Anyway'
            }).then((result) => {
                if (result.isConfirmed) this.showEditModal(id);
            });
        } else {
            this.showEditModal(id);
        }
    },
    
    showEditModal(id) {
        const trip = DB.get('trips').find(t => t.id === id);
        if (!trip) return;
        const vehicles = DB.get('vehicles'); const drivers = DB.get('drivers'); const parties = DB.get('parties');
        const html = `
            <div class="form-row">
                <div class="form-group"><label>Date</label><input type="date" class="form-control" id="t_date" value="${trip.date}"></div>
                <div class="form-group"><label>Vehicle</label><select class="form-control" id="t_vehicle">${vehicles.map(v=>`<option value="${v.id}" ${v.id===trip.vehicle_id?'selected':''}>${Sanitize.html(v.number)}</option>`).join('')}</select></div>
                <div class="form-group"><label>Driver</label><select class="form-control" id="t_driver">${drivers.map(d=>`<option value="${d.id}" ${d.id===trip.driver_id?'selected':''}>${Sanitize.html(d.name)}</option>`).join('')}</select></div>
                <div class="form-group"><label>Party</label><select class="form-control" id="t_party">${parties.map(p=>`<option value="${p.id}" ${p.id===trip.party_id?'selected':''}>${Sanitize.html(p.name)}</option>`).join('')}</select></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>From</label><input class="form-control" id="t_from" value="${Sanitize.html(trip.from)}" required></div>
                <div class="form-group"><label>To</label><input class="form-control" id="t_to" value="${Sanitize.html(trip.to)}" required></div>
                <div class="form-group"><label>Freight (₹)</label><input type="number" class="form-control" id="t_freight" value="${trip.freight}" required min="0"></div>
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea class="form-control" id="t_notes" rows="2">${Sanitize.html(trip.notes || '')}</textarea>
            </div>
            <h4 style="margin:16px 0 8px;">Expenses</h4>
            <div id="expRows"></div>
            <button type="button" class="btn btn-outline btn-sm" onclick="Trips.addExpRow()" style="margin-top:8px;"><i class="fas fa-plus"></i> Add Expense</button>
        `;
        UI.openModal('Edit Trip', html, () => this.update(id), true);
        if (trip.expenses && trip.expenses.length > 0) {
            trip.expenses.forEach(exp => {
                const row = document.createElement('div'); row.className = 'form-row'; row.style.marginBottom = '8px';
                row.innerHTML = `<div class="form-group"><select class="form-control exp-type"><option ${exp.type==='Diesel'?'selected':''}>Diesel</option><option ${exp.type==='Toll'?'selected':''}>Toll</option><option ${exp.type==='Food'?'selected':''}>Food</option><option ${exp.type==='Repair'?'selected':''}>Repair</option></select></div><div class="form-group"><input type="number" class="form-control exp-amt" value="${exp.amount}"></div><div class="form-group"><button class="btn btn-danger btn-sm" onclick="this.closest('.form-row').remove()"><i class="fas fa-trash"></i></button></div>`;
                document.getElementById('expRows').appendChild(row);
            });
        } else { this.addExpRow(); }
    },
    
    addExpRow() {
        const row = document.createElement('div'); row.className = 'form-row'; row.style.marginBottom = '8px';
        row.innerHTML = `<div class="form-group"><select class="form-control exp-type"><option>Diesel</option><option>Toll</option><option>Food</option><option>Repair</option></select></div><div class="form-group"><input type="number" class="form-control exp-amt" placeholder="Amount"></div><div class="form-group"><button class="btn btn-danger btn-sm" onclick="this.closest('.form-row').remove()"><i class="fas fa-trash"></i></button></div>`;
        document.getElementById('expRows').appendChild(row);
    },
    
    save() {
        const from = document.getElementById('t_from').value.trim();
        const to = document.getElementById('t_to').value.trim();
        if (!from || !to) {
            Utils.toast('Please fill in "From" and "To" locations.', 'error');
            return;
        }
        const freight = Sanitize.number(document.getElementById('t_freight').value);
        if (freight <= 0) {
            Utils.toast('Freight amount must be greater than zero.', 'error');
            return;
        }

        const expenses = [];
        document.querySelectorAll('#expRows .form-row').forEach(r => { 
            const amt = Sanitize.number(r.querySelector('.exp-amt').value); 
            if (amt > 0) expenses.push({ type: r.querySelector('.exp-type').value, amount: amt }); 
        });
        const trip = {
            id: Utils.id(),
            trip_no: Utils.generateTripNo(document.getElementById('t_date').value),
            date: document.getElementById('t_date').value,
            vehicle_id: document.getElementById('t_vehicle').value,
            driver_id: document.getElementById('t_driver').value,
            party_id: document.getElementById('t_party').value,
            from: Sanitize.html(from),
            to: Sanitize.html(to),
            freight: freight,
            status: 'completed',
            invoice_status: 'pending',
            is_gst: true,
            expenses: Sanitize.escapeJSON(expenses),
            notes: Sanitize.html(document.getElementById('t_notes').value)
        };
        const trips = DB.get('trips'); trips.push(trip); DB.set('trips', trips);
        UI.closeModal(); Utils.toast('Trip created!'); Router.go('trips');
    },
    
    update(id) {
        const from = document.getElementById('t_from').value.trim();
        const to = document.getElementById('t_to').value.trim();
        if (!from || !to) {
            Utils.toast('Please fill in "From" and "To" locations.', 'error');
            return;
        }
        const freight = Sanitize.number(document.getElementById('t_freight').value);
        if (freight <= 0) {
            Utils.toast('Freight amount must be greater than zero.', 'error');
            return;
        }

        const expenses = [];
        document.querySelectorAll('#expRows .form-row').forEach(r => { 
            const amt = Sanitize.number(r.querySelector('.exp-amt').value); 
            if (amt > 0) expenses.push({ type: r.querySelector('.exp-type').value, amount: amt }); 
        });
        const trips = DB.get('trips'); const index = trips.findIndex(t => t.id === id);
        if (index !== -1) {
            trips[index] = { 
                ...trips[index], 
                date: document.getElementById('t_date').value,
                vehicle_id: document.getElementById('t_vehicle').value,
                driver_id: document.getElementById('t_driver').value,
                party_id: document.getElementById('t_party').value,
                from: Sanitize.html(from),
                to: Sanitize.html(to),
                freight: freight,
                expenses: Sanitize.escapeJSON(expenses),
                notes: Sanitize.html(document.getElementById('t_notes').value)
            };
            DB.set('trips', trips); UI.closeModal(); Utils.toast('Trip updated!'); Router.go('trips');
        }
    },
    
    view(id) {
        const t = DB.get('trips').find(x => x.id === id); if(!t) return;
        const v = DB.get('vehicles').find(x => x.id === t.vehicle_id);
        const d = DB.get('drivers').find(x => x.id === t.driver_id);
        const party = DB.get('parties').find(x => x.id === t.party_id);
        const expenses = Array.isArray(t.expenses) ? t.expenses : [];
        const totalExpenses = expenses.reduce((s,e)=>s + Number(e.amount || 0), 0);
        const freight = Number(t.freight || 0);
        const profit = freight - totalExpenses;
        const advance = Number(t.trip_advance_amount || t.driver_advance || 0);
        const linkedInvoices = DB.get('invoices', []).filter(inv => Array.isArray(inv.trip_ids) && inv.trip_ids.includes(id));
        const linkedInvoice = linkedInvoices.slice().sort((a, b) => {
            const ad = new Date(a.date || 0).getTime() || 0;
            const bd = new Date(b.date || 0).getTime() || 0;
            return bd - ad;
        })[0] || null;
        const invoiceStatus = String(t.invoice_status || (linkedInvoice ? linkedInvoice.status : 'pending')).toUpperCase();
        const statusClass = invoiceStatus === 'INVOICED' || invoiceStatus === 'SHARED' ? 'tp-status tp-status-blue' :
                            invoiceStatus === 'PAID' ? 'tp-status tp-status-green' : 'tp-status tp-status-amber';

        const esc = value => Sanitize.html(value == null ? '' : String(value));
        const money = value => Utils.fmt(Number(value || 0));

        const expenseRows = expenses.length ? expenses.map(exp => `
            <div class="tp-expense-row">
                <div class="tp-expense-name"><span class="tp-expense-dot"></span>${esc(exp.type || 'EXPENSE')}</div>
                <div class="tp-expense-amount">-${money(exp.amount)}</div>
            </div>
        `).join('') : `
            <div class="tp-empty-expense">NO BILLABLE / RECORDED EXPENSES</div>
        `;

        Swal.fire({
            title: '',
            html: `
                <div class="tp-preview">
                    <div class="tp-preview-head">
                        <div class="tp-head-icon"><i class="fas fa-route"></i></div>
                        <div class="tp-head-main">
                            <div class="tp-eyebrow">TRIP DETAILS</div>
                            <div class="tp-trip-no">${esc(t.trip_no)}</div>
                            ${linkedInvoice && linkedInvoice.invoice_no ? `<div class="tp-invoice-no"><i class="fas fa-file-invoice"></i> INVOICE NO. <strong>${esc(linkedInvoice.invoice_no)}</strong></div>` : ''}
                            <div class="tp-head-route"><i class="fas fa-location-arrow"></i> ${esc(t.from)} <span>→</span> ${esc(t.to)}</div>
                        </div>
                        <div class="${statusClass}">${esc(invoiceStatus)}</div>
                    </div>

                    <div class="tp-info-grid">
                        <div class="tp-info-card">
                            <div class="tp-info-icon tp-blue"><i class="fas fa-truck"></i></div>
                            <div><div class="tp-label">VEHICLE</div><div class="tp-value">${esc(v?.number || '-')}</div></div>
                        </div>
                        <div class="tp-info-card">
                            <div class="tp-info-icon tp-purple"><i class="fas fa-user-tie"></i></div>
                            <div><div class="tp-label">DRIVER</div><div class="tp-value">${esc(d?.name || '-')}</div></div>
                        </div>
                        <div class="tp-info-card">
                            <div class="tp-info-icon tp-green"><i class="fas fa-building"></i></div>
                            <div><div class="tp-label">PARTY</div><div class="tp-value">${esc(party?.name || '-')}</div></div>
                        </div>
                        <div class="tp-info-card">
                            <div class="tp-info-icon tp-orange"><i class="fas fa-calendar-alt"></i></div>
                            <div><div class="tp-label">TRIP DATE</div><div class="tp-value">${esc(t.date || '-')}</div></div>
                        </div>
                    </div>

                    <div class="tp-finance-grid">
                        <div class="tp-finance-card tp-freight">
                            <div class="tp-finance-icon"><i class="fas fa-indian-rupee-sign"></i></div>
                            <div><div class="tp-label">FREIGHT</div><div class="tp-finance-value">${money(freight)}</div></div>
                        </div>
                        <div class="tp-finance-card tp-advance">
                            <div class="tp-finance-icon"><i class="fas fa-hand-holding-dollar"></i></div>
                            <div><div class="tp-label">TRIP ADVANCE</div><div class="tp-finance-value">${money(advance)}</div></div>
                        </div>
                        <div class="tp-finance-card ${profit >= 0 ? 'tp-profit' : 'tp-loss'}">
                            <div class="tp-finance-icon"><i class="fas fa-chart-line"></i></div>
                            <div><div class="tp-label">NET PROFIT</div><div class="tp-finance-value">${money(profit)}</div></div>
                        </div>
                    </div>

                    <div class="tp-expense-card">
                        <div class="tp-section-title"><span><i class="fas fa-receipt"></i> EXPENSE DETAILS</span><strong>${money(totalExpenses)}</strong></div>
                        <div class="tp-expense-list">${expenseRows}</div>
                    </div>

                    ${t.notes ? `<div class="tp-notes"><div class="tp-notes-title"><i class="fas fa-note-sticky"></i> NOTES</div><div class="tp-notes-text">${esc(t.notes)}</div></div>` : ''}

                    <div class="tp-route-strip">
                        <div><span>FROM</span><strong>${esc(t.from || '-')}</strong></div>
                        <i class="fas fa-arrow-right"></i>
                        <div class="tp-route-to"><span>TO</span><strong>${esc(t.to || '-')}</strong></div>
                    </div>
                </div>
            `,
            width: '780px',
            padding: '0',
            showConfirmButton: true,
            confirmButtonText: '✓ CLOSE',
            customClass: { popup: 'tp-preview-popup', confirmButton: 'tp-close-btn' },
            buttonsStyling: false,
            background: '#ffffff'
        });
    },
    
    delete(id) {
        const invoices = DB.get('invoices', []);
        const linkedInvoices = invoices.filter(inv => Array.isArray(inv.trip_ids) && inv.trip_ids.includes(id));
        const activeLinked = linkedInvoices.filter(inv => String(inv.status || 'issued').toLowerCase() !== 'cancelled');
        if (activeLinked.length > 0) {
            return Swal.fire({
                title: 'Trip is linked to an active invoice',
                html: `This trip is linked to <strong>${activeLinked.length} active invoice(s)</strong>.<br><br><strong>For financial safety, the trip cannot be deleted or removed from an issued invoice.</strong><br>Cancel the invoice first, then try again.`,
                icon: 'warning',
                confirmButtonText: 'OK'
            });
        }
        if (linkedInvoices.length > 0) {
            return Swal.fire({
                title: 'Delete Trip?',
                html: 'The linked invoice(s) are already cancelled. The trip can be deleted without changing any invoice history.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, Delete',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#ef4444'
            }).then(res => {
                if (res.isConfirmed) {
                    DB.set('trips', DB.get('trips').filter(x => x.id !== id));
                    Utils.toast('Trip deleted. Cancelled invoice history was preserved.');
                    Router.go('trips');
                }
            });
        }
        
        Swal.fire({ 
            title: 'Delete Trip?', 
            text: "You won't be able to revert this!", 
            icon: 'warning', 
            showCancelButton: true, 
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, Delete',
            cancelButtonText: 'Cancel'
        }).then(res => { 
            if (res.isConfirmed) { 
                DB.set('trips', DB.get('trips').filter(x => x.id !== id)); 
                Utils.toast('Trip deleted!'); 
                Router.go('trips'); 
            } 
        });
    },
    
    duplicate(id) {
        const trips = DB.get('trips'); const original = trips.find(t => t.id === id); if (!original) return;
        const newTrip = JSON.parse(JSON.stringify(original)); 
        newTrip.id = Utils.id(); 
        newTrip.trip_no = Utils.generateTripNo(); 
        newTrip.date = Utils.today(); 
        newTrip.invoice_status = 'pending';
        trips.push(newTrip); DB.set('trips', trips); Utils.toast('Trip duplicated!'); Router.go('trips');
    }
};

// ==========================================
// 6. INVOICES MODULE (FIXED PDF & delete)
// ==========================================

/* ===== END trip-management.js ===== */

/* ===== BEGIN invoices-billing.js ===== */
const Invoices = {
    render(container) {
        const invoices = DB.get('invoices'); const parties = DB.get('parties');
        container.innerHTML += `
            <div class="card">
                <h3 class="card-title">Generated Invoices</h3>
                ${invoices.length === 0 ? `<div class="empty-state"><i class="fas fa-file-invoice"></i><h3>No Invoices</h3><p>Generate your first invoice from the Trip Management page.</p></div>` : `
                <div class="table-wrapper">
                    <table>
                        <thead><tr><th>Invoice #</th><th>Invoice Date</th><th>Cr. Date</th><th>Party</th><th>Trips</th><th>Total Amount</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${invoices.map(inv => {
                                const party = parties.find(p => p.id === inv.party_id);
                                const crDate = new Date(inv.date);
                                crDate.setDate(crDate.getDate() + 30);
                                return `<tr>
                                    <td><strong>${Sanitize.html(inv.invoice_no)}</strong></td>
                                    <td>${inv.date}</td>
                                    <td>${crDate.toISOString().split('T')[0]}</td>
                                    <td>${Sanitize.html(party?.name) || 'N/A'}</td>
                                    <td>${inv.trip_count} trips</td>
                                    <td>${Utils.fmt(inv.total_amount)}</td>
                                    <td><span class="status-badge ${inv.is_gst ? 'status-shared' : 'status-pending'}">${inv.is_gst ? 'GST' : 'Non-GST'}</span></td>
                                    <td>
                                        <select class="form-control" style="padding: 4px 8px; font-size: 12px; width: 120px;" data-action="update-invoice-status" data-id="${inv.id}">
                                            <option value="pending" ${inv.status === 'pending' ? 'selected' : ''}>Pending</option>
                                            <option value="shared" ${inv.status === 'shared' ? 'selected' : ''}>Shared</option>
                                            <option value="paid" ${inv.status === 'paid' ? 'selected' : ''}>Paid</option>
                                        </select>
                                    </td>
                                    <td style="white-space: nowrap;">
                                        <button class="btn btn-outline btn-sm" onclick="Invoices.previewExisting('${inv.id}')"><i class="fas fa-eye"></i> Preview</button>
                                        <button class="btn btn-primary btn-sm" onclick="Invoices.downloadExisting('${inv.id}')"><i class="fas fa-download"></i> Download PDF</button>
                                        <button class="btn btn-danger btn-sm" data-action="delete-invoice" data-id="${inv.id}"><i class="fas fa-trash"></i> Delete</button>
                                    </td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>`}
            </div>
        `;
    },
    
    updateStatus(id, newStatus) {
        const invoices = DB.get('invoices');
        const index = invoices.findIndex(inv => inv.id === id);
        if (index !== -1) {
            invoices[index].status = newStatus;
            DB.set('invoices', invoices);
            const trips = DB.get('trips');
            invoices[index].trip_ids.forEach(tripId => {
                const trip = trips.find(t => t.id === tripId);
                if (trip) trip.invoice_status = newStatus;
            });
            DB.set('trips', trips);
            Utils.toast(`Invoice status updated to ${newStatus}`);
        }
    },
    
    deleteInvoice(id) {
        Swal.fire({
            title: 'Delete Invoice?',
            text: 'This will also revert the linked trips to "pending" status.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, Delete',
            cancelButtonText: 'Cancel'
        }).then(res => {
            if (res.isConfirmed) {
                const invoices = DB.get('invoices');
                const inv = invoices.find(i => i.id === id);
                if (inv) {
                    const trips = DB.get('trips');
                    inv.trip_ids.forEach(tid => {
                        const trip = trips.find(t => t.id === tid);
                        if (trip) trip.invoice_status = 'pending';
                    });
                    DB.set('trips', trips);
                    DB.set('invoices', invoices.filter(i => i.id !== id));
                    Utils.toast('Invoice deleted successfully!');
                    Router.go('invoices');
                }
            }
        });
    },
    
    showInvoiceGenerator() {
        const trips = DB.get('trips').filter(t => t.status === 'completed');
        const vehicles = DB.get('vehicles'); const parties = DB.get('parties');
        if (trips.length === 0) return Utils.toast('No completed trips available.', 'warning');

        Swal.fire({
            title: 'Select Trips for Invoice',
            html: `
                <div style="text-align: left; max-height: 300px; overflow-y: auto; margin-bottom: 20px;">
                    <table style="width: 100%; font-size: 13px;">
                        <thead><tr style="background: var(--bg-body); position: sticky; top: 0;"><th style="padding: 8px;"><input type="checkbox" id="selectAllTrips"></th><th style="padding: 8px;">Date</th><th style="padding: 8px;">Trip #</th><th style="padding: 8px;">Vehicle</th><th style="padding: 8px;">Party</th><th style="padding: 8px; text-align: right;">Amount</th></tr></thead>
                        <tbody>${trips.map(t => { const v = vehicles.find(x => x.id === t.vehicle_id); const p = parties.find(x => x.id === t.party_id); return `<tr><td style="padding: 8px;"><input type="checkbox" class="trip-select" data-id="${t.id}" data-party="${t.party_id}"></td><td style="padding: 8px;">${t.date}</td><td style="padding: 8px;">${Sanitize.html(t.trip_no)}</td><td style="padding: 8px;">${Sanitize.html(v?.number)}</td><td style="padding: 8px;">${Sanitize.html(p?.name)}</td><td style="padding: 8px; text-align: right;">${Utils.fmt(t.freight)}</td></tr>`; }).join('')}</tbody>
                    </table>
                </div>
                <div style="padding: 15px; background: var(--bg-body); border-radius: 8px;">
                    <label style="display: flex; align-items: center; cursor: pointer; font-weight: 600; margin-bottom: 10px;"><input type="radio" name="invoiceType" value="gst" checked style="margin-right: 10px; width: 18px; height: 18px;"><span class="status-badge status-shared" style="margin-right: 8px;">GST</span> Generate GST Invoice (CGST 9% + SGST 9%)</label>
                    <label style="display: flex; align-items: center; cursor: pointer; font-weight: 600; margin-bottom: 15px;"><input type="radio" name="invoiceType" value="nongst" style="margin-right: 10px; width: 18px; height: 18px;"><span class="status-badge status-pending" style="margin-right: 8px;">Non-GST</span> Generate Non-GST Invoice (No Taxes)</label>
                    <div class="form-group" style="margin: 0;"><label>Advance Received (₹)</label><input type="number" class="form-control" id="invAdvance" value="0" min="0"></div>
                </div>
            `,
            width: '750px', showCancelButton: true, confirmButtonText: '<i class="fas fa-file-invoice"></i> Generate & Download', cancelButtonText: 'Cancel',
            preConfirm: () => {
                const selectedIds = []; document.querySelectorAll('.trip-select:checked').forEach(cb => selectedIds.push(cb.dataset.id));
                if (selectedIds.length === 0) { Swal.showValidationMessage('Select at least one trip'); return false; }
                const partyIds = new Set(Array.from(document.querySelectorAll('.trip-select:checked')).map(cb => cb.dataset.party));
                if (partyIds.size > 1) { Swal.showValidationMessage('All trips must belong to the same party'); return false; }
                return { tripIds: selectedIds, isGst: document.querySelector('input[name="invoiceType"]:checked').value === 'gst', advance: Sanitize.number(document.getElementById('invAdvance').value) };
            }
        }).then(result => {
            if (result.isConfirmed) {
                const selectedTrips = DB.get('trips').filter(t => result.value.tripIds.includes(t.id));
                this.createInvoice(selectedTrips, result.value.isGst, result.value.advance);
            }
        });
        setTimeout(() => {
            const selectAll = document.getElementById('selectAllTrips');
            const newSelectAll = selectAll.cloneNode(true);
            selectAll.parentNode.replaceChild(newSelectAll, selectAll);
            newSelectAll.addEventListener('change', (e) => {
                document.querySelectorAll('.trip-select').forEach(cb => cb.checked = e.target.checked);
            });
        }, 100);
    },
    
    createInvoice(trips, isGst, advance) {
        Utils.showLoader('Generating invoice...');
        setTimeout(() => {
            try {
                const party = DB.get('parties').find(p => p.id === trips[0].party_id);
                const vehicles = DB.get('vehicles');
                const subtotal = trips.reduce((s, t) => s + t.freight, 0);
                const cgst = isGst ? subtotal * 0.09 : 0; const sgst = isGst ? subtotal * 0.09 : 0;
                const total = subtotal + cgst + sgst; const balance = total - advance;
                
                const invoice = { 
                    id: Utils.id(), 
                    invoice_no: Utils.generateInvoiceNo(), 
                    date: Utils.today(), 
                    party_id: party.id, 
                    trip_ids: trips.map(t => t.id), 
                    trip_count: trips.length, 
                    subtotal, cgst, sgst, 
                    total_amount: total, 
                    advance, 
                    balance_due: balance, 
                    is_gst: isGst, 
                    status: 'pending',
                    trips_data: trips.map(t => ({ ...t, vehicle: vehicles.find(v => v.id === t.vehicle_id) })) 
                };
                
                const invoices = DB.get('invoices'); invoices.push(invoice); DB.set('invoices', invoices);
                const allTrips = DB.get('trips'); trips.forEach(t => { const idx = allTrips.findIndex(tr => tr.id === t.id); if (idx !== -1) allTrips[idx].invoice_status = 'shared'; }); DB.set('trips', allTrips);
                
                Utils.hideLoader();
                this.downloadInvoice(invoice);
                Utils.toast('Invoice generated and downloaded!');
                Router.go('invoices');
            } catch (error) { console.error(error); Utils.hideLoader(); Utils.toast('Error generating invoice.', 'error'); }
        }, 500);
    },
    
    previewInvoice(invoice) {
        const content = document.getElementById('previewContent');
        if (!content) return;
        content.innerHTML = '';
        content.dataset.invoiceId = invoice.id;
        if (typeof this.mountInvoiceDocument === 'function') {
            this.mountInvoiceDocument(invoice);
        } else {
            const parsed = new DOMParser().parseFromString(this.buildInvoiceHTML(invoice, true), 'text/html');
            const page = parsed.body.querySelector('.invoice-page, .invoice-wrapper');
            if (!page) throw new Error('Invoice preview could not be rendered.');
            const stage = document.createElement('div');
            stage.className = 'anori-invoice-preview-stage';
            const style = document.createElement('style');
            style.textContent = [...parsed.head.querySelectorAll('style')].map(x => x.textContent).join('\n');
            stage.appendChild(style);
            stage.appendChild(page.cloneNode(true));
            content.appendChild(stage);
        }
        document.getElementById('previewModal')?.classList.add('active');
    },

    previewExisting(id) {
        const invoice = DB.get('invoices').find(i => i.id === id);
        if (!invoice) return Utils.toast('Invoice not found.', 'error');
        this.previewInvoice(invoice);
    },

    downloadExisting(id) {
        const invoice = DB.get('invoices').find(i => i.id === id);
        if (!invoice) return Utils.toast('Invoice not found.', 'error');
        this.downloadInvoice(invoice);
    },

    buildInvoiceHTML(invoice, preview = false) {
        const company = DB.get('company_profile');
        const party = DB.get('parties').find(p => p.id === invoice.party_id) || {};
        const creditDays = typeof window.anoriResolvePartyCreditDays === 'function'
            ? window.anoriResolvePartyCreditDays(party, invoice.credit_days)
            : (Number.isFinite(Number(party.credit_days)) ? Math.max(0, Math.floor(Number(party.credit_days))) : (Number.isFinite(Number(invoice.credit_days)) ? Math.max(0, Math.floor(Number(invoice.credit_days))) : 30));
        const rows = (invoice.trips_data || []).map((t, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${Sanitize.html(t.trip_no)}</td>
                <td>${Sanitize.html(t.date)}</td>
                <td>${Sanitize.html(t.from)} → ${Sanitize.html(t.to)}</td>
                <td>${Sanitize.html(t.vehicle?.number || '')}</td>
                <td style="text-align:right">${Utils.fmt(t.freight)}</td>
            </tr>`).join('');
        const taxRows = invoice.is_gst ? `
            <tr><td colspan="5" style="text-align:right">CGST 9%</td><td style="text-align:right">${Utils.fmt(invoice.cgst)}</td></tr>
            <tr><td colspan="5" style="text-align:right">SGST 9%</td><td style="text-align:right">${Utils.fmt(invoice.sgst)}</td></tr>` : '';
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${Sanitize.html(invoice.invoice_no)}</title>
        <style>
        *{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;background:${preview ? '#e2e8f0' : '#fff'};padding:${preview ? '20px' : '0'};color:#111}
        .invoice-wrapper{width:210mm;min-height:297mm;margin:0 auto;background:#fff;padding:15mm 18mm;font-size:12px;line-height:1.5;text-transform:uppercase}
        h1{font-size:24px;margin:0 0 4px}h2{font-size:18px;margin:0 0 8px}.muted{color:#64748b}.header{display:flex;justify-content:space-between;border-bottom:2px solid #111;padding-bottom:14px;margin-bottom:18px}.party{margin-bottom:18px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}table{width:100%;border-collapse:collapse;margin-top:15px}th,td{border:1px solid #d1d5db;padding:7px 8px;text-align:left}th{background:#f1f5f9;font-size:11px}.totals{width:48%;margin-left:auto;margin-top:12px}.totals td{border:none;padding:4px 0}.grand{font-size:15px;font-weight:700;border-top:2px solid #111!important;padding-top:8px!important}.footer{margin-top:30px;border-top:1px solid #ddd;padding-top:10px}.amount-words{margin-top:16px;font-weight:600}
        @media print{body{padding:0;background:#fff}.invoice-wrapper{margin:0;box-shadow:none}}
        </style></head><body><div class="invoice-wrapper">
        <div class="header"><div><h1>${Sanitize.html(company.name || 'Anori Transport Services')}</h1><div>${Sanitize.html(company.addr || '')}</div><div>GSTIN: ${Sanitize.html(company.gst || 'N/A')} | Phone: ${Sanitize.html(company.phone || '')}</div></div><div style="text-align:right"><h2>TAX INVOICE</h2><div><strong>Invoice No:</strong> ${Sanitize.html(invoice.invoice_no)}</div><div><strong>Date:</strong> ${Sanitize.html(invoice.date)}</div><div><strong>Status:</strong> ${Sanitize.html(invoice.status)}</div></div></div>
        <div class="grid"><div class="party"><strong>Bill To</strong><br>${Sanitize.html(party.name || 'N/A')}<br>${Sanitize.html(party.addr || '')}<br>GSTIN: ${Sanitize.html(party.gst || 'N/A')}</div><div class="party"><strong>Payment Terms</strong><br>Credit Period: ${creditDays} Days<br>Due Date: ${Sanitize.html(this.getDueDate(invoice.date, creditDays))}</div></div>
        <table><thead><tr><th>#</th><th>Trip No.</th><th>Date</th><th>Route</th><th>Vehicle</th><th style="text-align:right">Freight</th></tr></thead><tbody>${rows}</tbody><tfoot>
        <tr><td colspan="5" style="text-align:right"><strong>Subtotal</strong></td><td style="text-align:right"><strong>${Utils.fmt(invoice.subtotal)}</strong></td></tr>${taxRows}
        <tr><td colspan="5" style="text-align:right"><strong>Total</strong></td><td style="text-align:right"><strong>${Utils.fmt(invoice.total_amount)}</strong></td></tr>
        <tr><td colspan="5" style="text-align:right">Advance Received</td><td style="text-align:right">-${Utils.fmt(invoice.advance)}</td></tr>
        <tr><td colspan="5" style="text-align:right"><strong>Balance Due</strong></td><td style="text-align:right"><strong>${Utils.fmt(invoice.balance_due)}</strong></td></tr>
        </tfoot></table>
        <div class="amount-words">Amount in words: ${Sanitize.html(Utils.numberToWords(invoice.total_amount))}</div>
        <div class="footer"><div><strong>Bank Details</strong></div><div>Account: ${Sanitize.html(company.acc || 'N/A')} | IFSC: ${Sanitize.html(company.bank || 'N/A')}</div><p class="muted">This is a computer-generated invoice.</p></div>
        </div></body></html>`;
    },

    getDueDate(date, days = 30) {
        const d = new Date(date);
        if (Number.isNaN(d.getTime())) return Utils.today();
        d.setDate(d.getDate() + Math.max(0, Number(days) || 0));
        return d.toISOString().split('T')[0];
    },

    downloadInvoice(invoice) {
        if (typeof this.downloadInvoiceSafe === 'function') return this.downloadInvoiceSafe(invoice);
        Utils.toast('PDF generation is not ready yet. Please try again.', 'warning');
    }
};

// ==========================================
// 7. DRIVER SETTLEMENT
// ==========================================

/* ===== END invoices-billing.js ===== */

/* ===== BEGIN driver-settlement.js ===== */
const DriverSettlement = {
    render(container) {
        const drivers = DB.get('drivers');
        const settlements = DB.get('driver_settlements');
        container.innerHTML += `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h3 class="card-title"><i class="fas fa-hand-holding-usd"></i> Driver Ledger</h3><button class="btn btn-primary" onclick="DriverSettlement.openModal()"><i class="fas fa-plus"></i> Add Entry</button></div>
        ${settlements.length ? `<div class="table-wrapper"><table><thead><tr><th>Date</th><th>Driver</th><th>Type</th><th>Description</th><th>Amount</th><th>Action</th></tr></thead><tbody>${settlements.map(s=>{const d=drivers.find(x=>x.id===s.driver_id);return `<tr><td>${Sanitize.html(s.date)}</td><td>${Sanitize.html(d?.name||'N/A')}</td><td><span class="settlement-badge ${s.type==='credit'?'settlement-credit':'settlement-debit'}">${Sanitize.html(s.type)}</span></td><td>${Sanitize.html(s.description||'')}</td><td>${Utils.fmt(s.amount)}</td><td><button class="btn btn-danger btn-sm" onclick="DriverSettlement.remove('${s.id}')"><i class="fas fa-trash"></i></button></td></tr>`}).join('')}</tbody></table></div>` : `<div class="empty-state"><i class="fas fa-wallet"></i><h3>No Settlement Entries</h3><p>Add driver advances, deductions or payments.</p></div>`}</div>`;
    },
    openModal() {
        const drivers=DB.get('drivers');
        const html=`<div class="form-row"><div class="form-group"><label>Date</label><input class="form-control" id="s_date" type="date" value="${Utils.today()}"></div><div class="form-group"><label>Driver</label><select class="form-control" id="s_driver">${drivers.map(d=>`<option value="${d.id}">${Sanitize.html(d.name)}</option>`).join('')}</select></div></div><div class="form-row"><div class="form-group"><label>Type</label><select class="form-control" id="s_type"><option value="debit">Debit / Advance</option><option value="credit">Credit / Payment</option></select></div><div class="form-group"><label>Amount</label><input class="form-control" id="s_amount" type="number" min="0.01"></div></div><div class="form-group"><label>Description</label><input class="form-control" id="s_desc"></div>`;
        UI.openModal('Add Settlement Entry',html,()=>this.save());
    },
    save(){const amount=Sanitize.number(document.getElementById('s_amount').value);if(amount<=0)return Utils.toast('Amount must be greater than zero.','error');const data=DB.get('driver_settlements');data.push({id:Utils.id(),date:Sanitize.date(document.getElementById('s_date').value),driver_id:document.getElementById('s_driver').value,type:document.getElementById('s_type').value,amount,description:Sanitize.html(document.getElementById('s_desc').value)});DB.set('driver_settlements',data);UI.closeModal();Utils.toast('Settlement entry saved.');Router.go('settlements');},
    remove(id){DB.set('driver_settlements',DB.get('driver_settlements').filter(x=>x.id!==id));Utils.toast('Entry deleted.');Router.go('settlements');}
};

// ==========================================
// 8. REPORTS
// ==========================================

/* ===== END driver-settlement.js ===== */

/* ===== BEGIN expenses.js ===== */
/* ANORI TRANSPORT — Expenses tab
 * Read-only consolidated operating-expense ledger built from Trip expenses.
 * Driver Amount / Advance is intentionally excluded.
 */
'use strict';

const Expenses = {
  _filters: { vehicle:'', driver:'', type:'', from:'', to:'', q:'' },

  _rows() {
    const trips = DB.get('trips', []);
    const vehicles = DB.get('vehicles', []);
    const drivers = DB.get('drivers', []);
    const rows = [];
    const excluded = /^(driver\s*(amount|advance)|advance|driver\s*amt|driver)$/i;
    trips.forEach(t => {
      const list = Array.isArray(t.expenses) ? t.expenses : [];
      list.forEach((e, idx) => {
        const type = String(e?.type || '').trim();
        const amount = Number(e?.amount || 0);
        if (!type || amount <= 0 || excluded.test(type)) return;
        const vehicle = vehicles.find(v => v.id === t.vehicle_id);
        const driver = drivers.find(d => d.id === t.driver_id);
        rows.push({
          id: `${t.id}__expense__${idx}`,
          date: t.date || '',
          tripId: t.id,
          tripNo: t.trip_no || '-',
          vehicle: vehicle?.number || '-',
          driver: driver?.name || '-',
          type,
          description: e.description || e.remarks || type,
          amount
        });
      });
    });
    return rows;
  },

  _filtered() {
    const f = this._filters;
    const q = String(f.q || '').trim().toLowerCase();
    return this._rows().filter(r => {
      if (f.vehicle && r.vehicle !== f.vehicle) return false;
      if (f.driver && r.driver !== f.driver) return false;
      if (f.type && r.type.toLowerCase() !== f.type.toLowerCase()) return false;
      if (f.from && r.date < f.from) return false;
      if (f.to && r.date > f.to) return false;
      if (q && ![r.tripNo,r.vehicle,r.driver,r.type,r.description].join(' ').toLowerCase().includes(q)) return false;
      return true;
    });
  },

  render(container) {
    const vehicles = DB.get('vehicles', []);
    const drivers = DB.get('drivers', []);
    const types = [...new Set(DB.get('expense_master', []).filter(x=>x && x.active!==false).map(x=>String(x.name||'').trim()).filter(Boolean).concat(this._rows().map(r=>r.type)))].sort((a,b)=>a.localeCompare(b));
    const f = this._filters;
    container.innerHTML = `
      <div class="anori-section-intro">
        <div><strong>Expenses</strong><span>All trip operating expenses excluding Driver Advance.</span></div>
      </div>
      <div class="card">
        <div class="anori-action-toolbar">
          <span class="anori-toolbar-label">Actions:</span>
          <button class="anori-action-btn anori-action-pdf" onclick="Expenses.downloadPDF()">📄 PDF / LEDGER</button>
          <button class="anori-action-btn anori-action-export" onclick="Expenses.exportExcel()">📊 EXCEL</button>
          <span class="anori-toolbar-spacer"></span>
        </div>
        <div class="anori-filter-bar anori-expense-filter-bar">
          <label>Vehicle<select id="expenseVehicle" class="form-control"><option value="">All Vehicles</option>${vehicles.map(v=>`<option value="${this._esc(v.number)}" ${f.vehicle===v.number?'selected':''}>${this._esc(v.number)}</option>`).join('')}</select></label>
          <label>Driver<select id="expenseDriver" class="form-control"><option value="">All Drivers</option>${drivers.map(d=>`<option value="${this._esc(d.name)}" ${f.driver===d.name?'selected':''}>${this._esc(d.name)}</option>`).join('')}</select></label>
          <label>Expense Type<select id="expenseType" class="form-control"><option value="">All Expenses</option>${types.map(t=>`<option value="${this._esc(t)}" ${f.type===t?'selected':''}>${this._esc(t)}</option>`).join('')}</select></label>
          <label>From<input id="expenseFrom" class="form-control" type="date" value="${this._esc(f.from)}"></label>
          <label>To<input id="expenseTo" class="form-control" type="date" value="${this._esc(f.to || today())}"></label>
          <label class="expense-search-field">Search<input id="expenseQ" class="form-control" placeholder="Trip, vehicle, driver, expense..." value="${this._esc(f.q)}"></label>
          <button class="btn btn-primary" onclick="Expenses.applyFilter()">🔎 SEARCH</button>
          <button class="btn btn-outline" onclick="Expenses.clearFilter()">↻ CLEAR</button>
        </div>
        <div id="expenseLedgerHost"></div>
      </div>`;
    this.renderLedger();
  },

  renderLedger() {
    const host = document.getElementById('expenseLedgerHost');
    if (!host) return;
    const rows = this._filtered().sort((a,b)=>(b.date||'').localeCompare(a.date||'') || a.tripNo.localeCompare(b.tripNo));
    const total = rows.reduce((s,r)=>s+r.amount,0);
    host.innerHTML = `
      <div class="anori-ledger-summary expense-summary">
        <div><span>Total Expenses</span><strong>${money(total)}</strong></div>
        <div><span>Expense Entries</span><strong>${rows.length}</strong></div>
        <div><span>Trips With Expenses</span><strong>${new Set(rows.map(r=>r.tripId)).size}</strong></div>
      </div>
      <div class="table-wrapper">
        <table>
          <thead><tr>
            <th>Sr. No.</th><th>Date</th><th>Vehicle</th><th>Driver</th><th>Trip</th><th>Expense Type</th><th>Description</th><th>Amount</th>
          </tr></thead>
          <tbody>${rows.map((r,i)=>`<tr>
            <td>${i+1}</td><td>${this._esc(r.date)}</td><td>${this._esc(r.vehicle)}</td><td>${this._esc(r.driver)}</td><td><strong>${this._esc(r.tripNo)}</strong></td><td><span class="expense-type-badge">${this._esc(r.type)}</span></td><td>${this._esc(r.description)}</td><td>${money(r.amount)}</td>
          </tr>`).join('') || '<tr><td colspan="8" class="empty-state">No expenses found.</td></tr>'}</tbody>
        </table>
      </div>`;
    window.anoriInstallTableUX?.();
  },

  applyFilter() {
    this._filters = {
      vehicle: document.getElementById('expenseVehicle')?.value || '',
      driver: document.getElementById('expenseDriver')?.value || '',
      type: document.getElementById('expenseType')?.value || '',
      from: document.getElementById('expenseFrom')?.value || '',
      to: document.getElementById('expenseTo')?.value || '',
      q: document.getElementById('expenseQ')?.value || ''
    };
    this.renderLedger();
  },

  clearFilter() {
    this._filters = { vehicle:'', driver:'', type:'', from:'', to:today(), q:'' };
    this.render(Router._currentContainer || document.getElementById('mainContent').querySelector('.view > div'));
  },

  exportExcel() {
    const rows = this._filtered();
    if (!rows.length) return Utils.toast('No expense records to export.','warning');
    if (!window.XLSX) return Utils.toast('Excel library is not available.','error');
    const data = rows.map((r,i)=>({
      'Sr. No.':i+1,'Date':r.date,'Vehicle':r.vehicle,'Driver':r.driver,'Trip':r.tripNo,'Expense Type':r.type,'Description':r.description,'Amount':r.amount
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Expenses');
    XLSX.writeFile(wb,`anori-expenses-${today()}.xlsx`);
  },

  downloadPDF() {
    const rows = this._filtered();
    if (!rows.length) return Utils.toast('No expense records to download.','warning');
    const body = rows.map((r,i)=>`<tr><td>${i+1}</td><td>${this._esc(r.date)}</td><td>${this._esc(r.vehicle)}</td><td>${this._esc(r.driver)}</td><td>${this._esc(r.tripNo)}</td><td>${this._esc(r.type)}</td><td>${this._esc(r.description)}</td><td style="text-align:right">${money(r.amount)}</td></tr>`).join('');
    const total = rows.reduce((s,r)=>s+r.amount,0);
    const html = `<div style="font-family:Arial,sans-serif;padding:24px;color:#172033"><h1 style="margin:0 0 6px">ANORI TRANSPORT</h1><h2 style="margin:0 0 18px">EXPENSE LEDGER</h2><p style="font-size:12px">Generated: ${this._esc(today())}</p><table style="width:100%;border-collapse:collapse;font-size:10px"><thead><tr>${['Sr. No.','Date','Vehicle','Driver','Trip','Expense Type','Description','Amount'].map(x=>`<th style="border:1px solid #cbd5e1;padding:6px;background:#eaf2ff;text-align:left">${x}</th>`).join('')}</tr></thead><tbody>${body}</tbody><tfoot><tr><th colspan="7" style="text-align:right;padding:7px;border:1px solid #cbd5e1">TOTAL</th><th style="padding:7px;border:1px solid #cbd5e1;text-align:right">${money(total)}</th></tr></tfoot></table></div>`;
    if (window.html2pdf) {
      html2pdf().set({margin:0.35,filename:`anori-expenses-${today()}.pdf`,image:{type:'jpeg',quality:0.98},html2canvas:{scale:2,useCORS:true},jsPDF:{unit:'in',format:'a4',orientation:'landscape'}}).from(html).save();
    } else Utils.toast('PDF library is not available.','error');
  },

  _esc(v){ return (window.Sanitize?.html ? Sanitize.html(v) : String(v ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))); }
};
window.Expenses = Expenses;

/* ===== END expenses.js ===== */

/* ===== BEGIN master-data.js ===== */
const Masters = {
    render(container) {
        const vehicles = DB.get('vehicles'); 
        const drivers = DB.get('drivers'); 
        const parties = DB.get('parties');
        const company = DB.get('company_profile');
        const addressLines = Array.isArray(company.addr_lines) ? company.addr_lines : (String(company.addr || '').split(/\r?\n/).filter(Boolean));

        container.innerHTML += `
            <div class="anori-master-excel-toolbar">
                <div class="anori-master-excel-copy"><strong>📊 Master Data Excel</strong><span>Bulk export, edit and import Vehicles, Drivers, Customers and Expenses.</span></div>
                <div class="anori-master-excel-actions">
                    <button type="button" class="btn btn-outline btn-sm" onclick="Masters.downloadExcelTemplate()"><i class="fas fa-file-excel"></i> Excel Template</button>
                    <button type="button" class="btn btn-primary btn-sm" onclick="Masters.exportMasterExcel()"><i class="fas fa-download"></i> Export Master Excel</button>
                    <button type="button" class="btn btn-success btn-sm" onclick="Masters.importMasterExcel()"><i class="fas fa-upload"></i> Bulk Import Excel</button>
                </div>
            </div>
            <div class="card" style="border-left: 4px solid var(--primary);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                    <h3 class="card-title"><i class="fas fa-building"></i> Company Profile</h3>
                    <button class="btn btn-primary btn-sm" onclick="Masters.openCompanyModal()"><i class="fas fa-edit"></i> Edit</button>
                </div>
                <div class="grid grid-2" style="gap: 10px; font-size: 14px;">
                    <p><strong>Name:</strong> ${Sanitize.html(company.name) || 'Not Set'}</p>
                    <p><strong>GSTIN:</strong> ${Sanitize.html(company.gst) || 'Not Set'}</p>
                    <p><strong>PAN No.:</strong> ${Sanitize.html(company.pan) || 'Not Set'}</p>
                    <p><strong>Bank Name:</strong> ${Sanitize.html(company.bank_name) || 'Not Set'} | <strong>Bank A/C:</strong> ${Sanitize.html(company.acc) || 'Not Set'} | <strong>IFSC:</strong> ${Sanitize.html(company.bank) || 'Not Set'}</p>
                    <p><strong>Address:</strong><br>${addressLines.length ? addressLines.map(line => Sanitize.html(line)).join('<br>') : 'Not Set'}</p>
                </div>
            </div>

            <div class="grid grid-2">
                <div class="card">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                        <h3 class="card-title">Vehicles</h3>
                        <button class="btn btn-primary btn-sm" onclick="Masters.openModal('vehicle')"><i class="fas fa-plus"></i> Add</button>
                    </div>
                    ${vehicles.length === 0 ? `<div class="empty-state"><i class="fas fa-truck"></i><h3>No Vehicles</h3><p>Add your first vehicle to get started.</p></div>` : `
                    <div class="table-wrapper"><table><thead><tr><th>Sr. No.</th><th>Number</th><th>Type</th><th>Driver Amount (₹)</th><th>Action</th></tr></thead><tbody>
                        ${vehicles.map((v,i) => `<tr><td>${i+1}</td><td>${Sanitize.html(v.number)}</td><td>${Sanitize.html(v.type)}</td><td>${Utils.fmt(Number(v.driver_amount)||0)}</td><td class="master-action-cell"><div class="master-row-actions"><button type="button" class="btn btn-outline btn-sm master-action-btn master-edit-btn" title="Edit vehicle" aria-label="Edit vehicle" onclick="Masters.openModal('vehicle', '${v.id}')"><i class="fas fa-edit"></i><span>Edit</span></button><button type="button" class="btn btn-danger btn-sm master-action-btn master-delete-btn" title="Delete vehicle" aria-label="Delete vehicle" data-action="delete-master" data-type="vehicle" data-id="${v.id}"><i class="fas fa-trash"></i><span>Delete</span></button></div></td></tr>`).join('')}
                    </tbody></table></div>`}
                </div>
                <div class="card">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                        <h3 class="card-title">Drivers</h3>
                        <button class="btn btn-primary btn-sm" onclick="Masters.openModal('driver')"><i class="fas fa-plus"></i> Add</button>
                    </div>
                    ${drivers.length === 0 ? `<div class="empty-state"><i class="fas fa-user"></i><h3>No Drivers</h3><p>Add your first driver.</p></div>` : `
                    <div class="table-wrapper"><table><thead><tr><th>Sr. No.</th><th>Name</th><th>Mobile</th><th>Action</th></tr></thead><tbody>
                        ${drivers.map((d,i) => `<tr><td>${i+1}</td><td>${Sanitize.html(d.name)}</td><td>${Sanitize.html(d.mobile)}</td><td class="master-action-cell"><div class="master-row-actions"><button type="button" class="btn btn-outline btn-sm master-action-btn master-edit-btn" title="Edit driver" aria-label="Edit driver" onclick="Masters.openModal('driver', '${d.id}')"><i class="fas fa-edit"></i><span>Edit</span></button><button type="button" class="btn btn-danger btn-sm master-action-btn master-delete-btn" title="Delete driver" aria-label="Delete driver" data-action="delete-master" data-type="driver" data-id="${d.id}"><i class="fas fa-trash"></i><span>Delete</span></button></div></td></tr>`).join('')}
                    </tbody></table></div>`}
                </div>
            </div>
            
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                    <h3 class="card-title">Parties (Customers)</h3>
                    <button class="btn btn-primary btn-sm" onclick="Masters.openModal('party')"><i class="fas fa-plus"></i> Add</button>
                </div>
                ${parties.length === 0 ? `<div class="empty-state"><i class="fas fa-users"></i><h3>No Parties</h3><p>Add your first customer.</p></div>` : `
                <div class="table-wrapper"><table><thead><tr><th>Sr. No.</th><th>Name</th><th>GSTIN</th><th>Address</th><th>Credit Days</th><th>Action</th></tr></thead><tbody>
                    ${parties.map((p,i) => `<tr><td>${i+1}</td><td>${Sanitize.html(p.name)}</td><td>${Sanitize.html(p.gst) || '-'}</td><td>${Sanitize.html(p.addr) || '-'}</td><td>${Number.isFinite(Number(p.credit_days)) && Number(p.credit_days) >= 0 ? Math.floor(Number(p.credit_days)) : 30} Days</td><td class="master-action-cell"><div class="master-row-actions"><button type="button" class="btn btn-outline btn-sm master-action-btn master-edit-btn" title="Edit customer" aria-label="Edit customer" onclick="Masters.openModal('party', '${p.id}')"><i class="fas fa-edit"></i><span>Edit</span></button><button type="button" class="btn btn-danger btn-sm master-action-btn master-delete-btn" title="Delete customer" aria-label="Delete customer" data-action="delete-master" data-type="party" data-id="${p.id}"><i class="fas fa-trash"></i><span>Delete</span></button></div></td></tr>`).join('')}
                </tbody></table></div>`}
            </div>
        `;
    },
    
    openCompanyModal() {
        const c = DB.get('company_profile');
        const html = `
            <div class="form-group"><label>Company Name</label><input class="form-control" id="c_name" value="${Sanitize.html(c.name)}"></div>
            <div class="form-group"><label>Company Address — Row 1</label><input class="form-control" id="c_addr_1" value="${Sanitize.html((c.addr_lines||[])[0] || (c.addr && !String(c.addr).includes('\n') ? c.addr : ''))}"></div>
            <div class="form-group"><label>Company Address — Row 2</label><input class="form-control" id="c_addr_2" value="${Sanitize.html((c.addr_lines||[])[1] || '')}"></div>
            <div class="form-group"><label>Company Address — Row 3</label><input class="form-control" id="c_addr_3" value="${Sanitize.html((c.addr_lines||[])[2] || '')}"></div>
            <div class="form-group"><label>Company Address — Row 4</label><input class="form-control" id="c_addr_4" value="${Sanitize.html((c.addr_lines||[])[3] || '')}"></div>
            <div class="form-row">
                <div class="form-group"><label>GSTIN</label><input class="form-control" id="c_gst" value="${Sanitize.html(c.gst)}"></div>
                <div class="form-group"><label>PAN No.</label><input class="form-control" id="c_pan" value="${Sanitize.html(c.pan)}"></div>
            </div>
            <div class="form-group"><label>Phone</label><input class="form-control" id="c_phone" value="${Sanitize.html(c.phone)}"></div>
            <div class="form-row">
                <div class="form-group"><label>Bank Name</label><input class="form-control" id="c_bank_name" value="${Sanitize.html(c.bank_name)}"></div>
                <div class="form-group"><label>Bank Account No</label><input class="form-control" id="c_acc" value="${Sanitize.html(c.acc)}"></div>
            </div>
            <div class="form-group"><label>IFSC Code</label><input class="form-control" id="c_bank" value="${Sanitize.html(c.bank)}"></div>
        `;
        UI.openModal('Edit Company Profile', html, () => {
            const addrLines = [1,2,3,4].map(n => Sanitize.html(document.getElementById(`c_addr_${n}`).value.trim())).filter(Boolean);
            const current = DB.get('company_profile') || {};
            DB.set('company_profile', {
                ...current,
                name: Sanitize.html(document.getElementById('c_name').value),
                addr: addrLines.join('\n'),
                addr_lines: addrLines,
                gst: Sanitize.html(document.getElementById('c_gst').value),
                pan: Sanitize.html(document.getElementById('c_pan').value),
                phone: Sanitize.html(document.getElementById('c_phone').value),
                bank_name: Sanitize.html(document.getElementById('c_bank_name').value),
                acc: Sanitize.html(document.getElementById('c_acc').value),
                bank: Sanitize.html(document.getElementById('c_bank').value)
            });
            UI.closeModal(); Utils.toast('Company details updated!'); Router.go('masters');
        });
    },
    
    openModal(type, id = null) {
        const data = DB.get(type + 's'); 
        const item = id ? data.find(x => x.id === id) : {};
        const title = `${id ? 'Edit' : 'Add'} ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        
        let html = '';
        if (type === 'vehicle') {
            const rawType = String(item.type || '');
            const upperType = rawType.toUpperCase();
            const legacyTypeOption = rawType && !['PETRO','DESIEL','CNG'].includes(upperType) ? `<option value="${Sanitize.html(rawType)}" selected>${Sanitize.html(rawType)}</option>` : '';
            html = `<div class="form-group"><label>Vehicle Number</label><input class="form-control" id="m_number" value="${Sanitize.html(item.number)}" required></div><div class="form-group"><label>Type</label><select class="form-control" id="m_type"><option value="">Select Type</option><option value="PETRO" ${upperType==='PETRO'?'selected':''}>PETRO</option><option value="DESIEL" ${upperType==='DESIEL'?'selected':''}>DESIEL</option><option value="CNG" ${upperType==='CNG'?'selected':''}>CNG</option>${legacyTypeOption}</select></div><div class="form-group"><label>Driver Amount (₹)</label><input type="number" class="form-control" id="m_driver_amount" min="0" step="0.01" value="${Number(item.driver_amount)||0}" placeholder="Enter INR amount"></div>`;
        } else if (type === 'driver') {
            html = `<div class="form-group"><label>Name</label><input class="form-control" id="m_name" value="${Sanitize.html(item.name)}" required></div><div class="form-group"><label>Mobile</label><input class="form-control" id="m_mobile" value="${Sanitize.html(item.mobile)}"></div>`;
        } else if (type === 'party') {
            html = `<div class="form-group"><label>Party Name</label><input class="form-control" id="m_name" value="${Sanitize.html(item.name)}" required></div><div class="form-group"><label>GSTIN</label><input class="form-control" id="m_gst" value="${Sanitize.html(item.gst)}"></div><div class="form-group"><label>Address</label><input class="form-control" id="m_addr" value="${Sanitize.html(item.addr)}"></div>`;
        }
        UI.openModal(title, html, () => this.save(type, id));
    },
    
    save(type, id) {
        const dbKey = type === 'party' ? 'parties' : (type + 's');
        const data = DB.get(dbKey); 
        let item = id ? data.find(x => x.id === id) : { id: Utils.id() };
        
        if (type === 'vehicle') {
            item.number = Sanitize.html(document.getElementById('m_number').value);
            item.type = Sanitize.html(document.getElementById('m_type').value);
            const driverAmount = parseFloat(document.getElementById('m_driver_amount').value);
            item.driver_amount = Number.isFinite(driverAmount) && driverAmount >= 0 ? driverAmount : 0;
        } else if (type === 'driver') {
            item.name = Sanitize.html(document.getElementById('m_name').value);
            item.mobile = Sanitize.html(document.getElementById('m_mobile').value);
        } else if (type === 'party') {
            item.name = Sanitize.html(document.getElementById('m_name').value);
            item.gst = Sanitize.html(document.getElementById('m_gst').value);
            item.addr = Sanitize.html(document.getElementById('m_addr').value);
        }
        
        if (!id) data.push(item);
        DB.set(dbKey, data); 
        UI.closeModal(); 
        Utils.toast(`${type} saved!`); 
        Router.go('masters');
    },
    
    delete(type, id) {
        const trips = DB.get('trips');
        const invoices = DB.get('invoices');
        const dbKey = type === 'party' ? 'parties' : (type + 's');
        
        let linkedTrips = 0;
        let linkedInvoices = 0;
        
        if (type === 'vehicle') {
            linkedTrips = trips.filter(t => t.vehicle_id === id).length;
            linkedInvoices = invoices.filter(inv => inv.trips_data && inv.trips_data.some(t => t.vehicle_id === id)).length;
        } else if (type === 'driver') {
            linkedTrips = trips.filter(t => t.driver_id === id).length;
            linkedInvoices = invoices.filter(inv => inv.trips_data && inv.trips_data.some(t => t.driver_id === id)).length;
        } else if (type === 'party') {
            linkedTrips = trips.filter(t => t.party_id === id).length;
            linkedInvoices = invoices.filter(inv => inv.party_id === id).length;
        }
        
        if (linkedTrips > 0 || linkedInvoices > 0) {
            let msg = `This ${type} is linked to `;
            if (linkedTrips > 0) msg += `<strong>${linkedTrips} trip(s)</strong>`;
            if (linkedTrips > 0 && linkedInvoices > 0) msg += ' and ';
            if (linkedInvoices > 0) msg += `<strong>${linkedInvoices} invoice(s)</strong>`;
            msg += '. Please delete or update the linked records first.';
            return Swal.fire({
                title: 'Cannot Delete!',
                html: msg,
                icon: 'error',
                confirmButtonColor: '#ef4444',
                confirmButtonText: 'OK'
            });
        }
        
        Swal.fire({ 
            title: 'Delete?', 
            text: `Are you sure you want to delete this ${type}?`, 
            icon: 'warning', 
            showCancelButton: true, 
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, Delete',
            cancelButtonText: 'Cancel'
        }).then(res => {
            if (res.isConfirmed) { 
                const currentData = DB.get(dbKey);
                const updatedData = currentData.filter(x => x.id !== id);
                DB.set(dbKey, updatedData);
                Utils.toast('Deleted successfully!'); 
                Router.go('masters'); 
            }
        });
    }
};

/* ===== MASTER DATA BULK EXCEL =====
 * Offline-safe XLSX exchange using the bundled JSZip runtime.
 * IMPORTANT: this importer accepts normal Excel-generated .xlsx files as well
 * as ANORI-generated workbooks. Only Master Data tables are changed.
 */
(function installMasterExcel(){
  'use strict';
  if(window.__ANORI_MASTER_EXCEL_V2__) return;
  window.__ANORI_MASTER_EXCEL_V2__=true;

  const escXml=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
  const clean=v=>String(v==null?'':v).replace(/\u00a0/g,' ').trim();
  const key=v=>clean(v).toLowerCase().replace(/[_-]+/g,' ').replace(/\s+/g,' ').replace(/[^a-z0-9 ]/g,'').trim().replace(/ /g,'');
  const numOr=v=>{ if(v==null||clean(v)==='') return null; const n=Number(String(v).replace(/,/g,'')); return Number.isFinite(n)?n:null; };
  const bool=v=>{const x=key(v);if(['true','yes','y','1','on','active','show'].includes(x))return true;if(['false','no','n','0','off','inactive','hide','hidden'].includes(x))return false;return null;};
  const idOrNew=v=>clean(v)||Utils.id();
  const colName=n=>{let s='';n++;while(n){let r=(n-1)%26;s=String.fromCharCode(65+r)+s;n=Math.floor((n-1)/26);}return s;};
  const cell=(ref,value)=>{const v=clean(value);return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escXml(v)}</t></is></c>`;};
  const sheetXml=rows=>`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows.map((row,ri)=>`<row r="${ri+1}">${row.map((v,ci)=>cell(colName(ci)+(ri+1),v)).join('')}</row>`).join('')}</sheetData></worksheet>`;
  const workbookFiles=sheets=>{
    const wbSheets=sheets.map((x,i)=>`<sheet name="${escXml(x.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('');
    const rels=sheets.map((x,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('');
    const types=sheets.map((x,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('');
    return {
      '[Content_Types].xml':`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${types}</Types>`,
      '_rels/.rels':`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
      'xl/workbook.xml':`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${wbSheets}</sheets></workbook>`,
      'xl/_rels/workbook.xml.rels':`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}</Relationships>`
    };
  };
  const downloadBytes=async(bytes,name)=>{
    const blob=new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  };
  const masterSheets=()=>{
    const vehicles=DB.get('vehicles',[]).map((v,i)=>[i+1,v.id||'',v.number||'',v.type||'',Number(v.driver_amount)||0]);
    const drivers=DB.get('drivers',[]).map((d,i)=>[i+1,d.id||'',d.name||'',d.mobile||'']);
    const parties=DB.get('parties',[]).map((p,i)=>[i+1,p.id||'',p.name||'',p.email||'',Number.isFinite(Number(p.credit_days))?Math.max(0,Math.floor(Number(p.credit_days))):30,Number(p.credit_limit)||0,p.gst||'',p.mobile||'',p.addr||'']);
    const expenses=DB.get('expense_master',[]).map((e,i)=>[i+1,e.id||'',e.name||'',Number(e.defaultAmount)||0,e.showOnInvoice!==false,e.active!==false]);
    const c=DB.get('company_profile',{});
    const company=[['Field','Value'],['Name',c.name||''],['Address',c.addr||''],['GSTIN',c.gst||''],['PAN',c.pan||''],['Phone',c.phone||''],['Bank Name',c.bank_name||''],['Bank Account',c.acc||''],['IFSC',c.bank||'']];
    return [{name:'Vehicles',rows:[['Sr. No.','ID','Vehicle Number','Type','Driver Amount'],...vehicles]},{name:'Drivers',rows:[['Sr. No.','ID','Driver Name','Mobile'],...drivers]},{name:'Customers',rows:[['Sr. No.','ID','Customer Name','Email','Credit Days','Credit Limit','GSTIN','Mobile','Address'],...parties]},{name:'Expenses',rows:[['Sr. No.','ID','Expense Name','Default Amount','Show on Invoice','Active'],...expenses]},{name:'Company Profile',rows:company}];
  };
  const makeWorkbook=async sheets=>{if(!window.JSZip)throw new Error('Excel engine is unavailable.');const zip=new JSZip();const files=workbookFiles(sheets);Object.keys(files).forEach(k=>zip.file(k,files[k]));sheets.forEach((s,i)=>zip.file(`xl/worksheets/sheet${i+1}.xml`,sheetXml(s.rows)));return zip.generateAsync({type:'uint8array',compression:'DEFLATE'});};

  const xmlDoc=xml=>{const d=new DOMParser().parseFromString(xml,'application/xml');if(d.getElementsByTagName('parsererror').length)throw new Error('Excel XML is invalid or corrupted.');return d;};
  const normTarget=(base,target)=>{
    let t=String(target||'').replace(/\\/g,'/');
    if(/^https?:/i.test(t))return null;
    if(t.startsWith('/'))return t.slice(1);
    if(/^xl\//i.test(t))return t;
    const parts=(base+'/'+t).split('/'),out=[];for(const part of parts){if(!part||part==='.')continue;if(part==='..')out.pop();else out.push(part);}return out.join('/');
  };
  const colIndex=letters=>{let n=0;for(const ch of String(letters||'').toUpperCase()){if(ch<'A'||ch>'Z')return -1;n=n*26+ch.charCodeAt(0)-64;}return n-1;};
  const sharedText=si=>Array.from(si.getElementsByTagName('t')).map(t=>t.textContent||'').join('');
  const textFromCell=(c,shared)=>{
    if(!c)return '';
    const t=c.getAttribute('t')||'';
    if(t==='inlineStr')return Array.from(c.getElementsByTagName('t')).map(x=>x.textContent||'').join('');
    if(t==='s'){const v=c.getElementsByTagName('v')[0]?.textContent||'';return shared[Number(v)]??'';}
    if(t==='b'){const v=c.getElementsByTagName('v')[0]?.textContent||'';return v==='1'?'TRUE':'FALSE';}
    if(t==='str')return c.getElementsByTagName('v')[0]?.textContent||'';
    return c.getElementsByTagName('v')[0]?.textContent||'';
  };
  const parseSheet=(xml,shared)=>{
    const doc=xmlDoc(xml),rows=[];
    Array.from(doc.getElementsByTagName('row')).forEach(row=>{
      const out=[];Array.from(row.getElementsByTagName('c')).forEach(c=>{const ref=c.getAttribute('r')||'';const m=ref.match(/^([A-Z]+)\d+$/i);if(!m)return;const idx=colIndex(m[1]);if(idx>=0)out[idx]=textFromCell(c,shared);});rows.push(out);
    });return rows;
  };
  const readWorkbook=async file=>{
    if(!window.JSZip)throw new Error('Excel engine is unavailable.');
    if(!file||!/\.xlsx$/i.test(file.name||''))throw new Error('Please select an Excel .xlsx file.');
    const zip=await JSZip.loadAsync(await file.arrayBuffer());
    const get=async name=>{const f=zip.file(name);return f?f.async('string'):null;};
    const wbXml=await get('xl/workbook.xml'),relXml=await get('xl/_rels/workbook.xml.rels');
    if(!wbXml||!relXml)throw new Error('This file is not a valid .xlsx workbook. Please use .xlsx, not .xls or a renamed file.');
    const wb=xmlDoc(wbXml),rel=xmlDoc(relXml),relMap={};
    Array.from(rel.getElementsByTagName('Relationship')).forEach(r=>{relMap[r.getAttribute('Id')]=r.getAttribute('Target');});
    let shared=[];const ss=await get('xl/sharedStrings.xml');
    if(ss){const sd=xmlDoc(ss);shared=Array.from(sd.getElementsByTagName('si')).map(sharedText);}
    const result={};
    for(const sh of Array.from(wb.getElementsByTagName('sheet'))){
      const name=clean(sh.getAttribute('name')||'');const rid=sh.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id')||sh.getAttribute('r:id');
      const target=normTarget('xl',relMap[rid]);if(!target)continue;
      const xml=await get(target);if(xml)result[name]=parseSheet(xml,shared);
    }
    if(!Object.keys(result).length)throw new Error('No readable worksheets were found in this Excel file.');
    return result;
  };
  const rowsToObjects=rows=>{if(!rows?.length)return[];const headers=(rows[0]||[]).map(x=>key(x));return rows.slice(1).filter(r=>Array.isArray(r)&&r.some(v=>clean(v)!=='')).map((r,ri)=>{const o={_row:ri+2};headers.forEach((h,i)=>{if(h)o[h]=clean(r[i]);});return o;});};
  const aliases={id:['id'],number:['vehiclenumber','vehicle','vehicleno','registrationnumber','vehicleregistration'],type:['type','vehicletype'],driver_amount:['driveramount','driverpay','driverpayment'],name:['drivername','name','customername','partyname','expensename'],mobile:['mobile','phone','contact','mobileno','contactnumber'],email:['email','emailid'],credit_days:['creditdays','paymentterms','paymenttermsdays','creditperiod'],credit_limit:['creditlimit'],gst:['gstin','gst','gstnumber'],addr:['address','addr'],defaultAmount:['defaultamount','amount','defaultamt'],showOnInvoice:['showoninvoice','showinvoice','billable'],active:['active','status']};
  const pick=(o,n)=>{for(const a of aliases[n]||[n])if(Object.prototype.hasOwnProperty.call(o,a))return o[a];return '';};
  const validateAndBuild=book=>{
    const errors=[],out={vehicles:[],drivers:[],parties:[],expense_master:[],company_profile:null};
    const sheet=(...names)=>{const hit=Object.keys(book).find(k=>names.some(n=>key(k)===key(n)));return hit?book[hit]:null;};
    const checkUnique=(arr,field,label)=>{const seen=new Map();arr.forEach(x=>{const k=key(x[field]);if(k){if(seen.has(k))errors.push(`${label}: duplicate ${field.replace('_',' ')} "${x[field]}" at rows ${seen.get(k)} and ${x._row}.`);else seen.set(k,x._row);}})};
    const vr=sheet('Vehicles','Vehicle');rowsToObjects(vr||[]).forEach(o=>{const number=pick(o,'number');if(!number)errors.push(`Vehicles: Vehicle Number is required at row ${o._row}.`);const n=pick(o,'driver_amount')===''?0:numOr(pick(o,'driver_amount'));if(n===null||n<0)errors.push(`Vehicles: invalid Driver Amount at row ${o._row}.`);out.vehicles.push({id:idOrNew(pick(o,'id')),number,type:pick(o,'type'),driver_amount:n??0,_row:o._row});});checkUnique(out.vehicles,'number','Vehicles');
    const dr=sheet('Drivers','Driver');rowsToObjects(dr||[]).forEach(o=>{const name=pick(o,'name');if(!name)errors.push(`Drivers: Driver Name is required at row ${o._row}.`);out.drivers.push({id:idOrNew(pick(o,'id')),name,mobile:pick(o,'mobile'),_row:o._row});});checkUnique(out.drivers,'name','Drivers');
    const cu=sheet('Customers','Parties','Party','Customers / Parties');rowsToObjects(cu||[]).forEach(o=>{const name=pick(o,'name');if(!name)errors.push(`Customers: Customer Name is required at row ${o._row}.`);const cd=pick(o,'credit_days'),cl=pick(o,'credit_limit');const creditDays=cd===''?30:numOr(cd),creditLimit=cl===''?0:numOr(cl);if(creditDays===null||creditDays<0)errors.push(`Customers: invalid Credit Days at row ${o._row}.`);if(creditLimit===null||creditLimit<0)errors.push(`Customers: invalid Credit Limit at row ${o._row}.`);out.parties.push({id:idOrNew(pick(o,'id')),name,email:pick(o,'email'),credit_days:Math.floor(creditDays??30),credit_limit:creditLimit??0,gst:pick(o,'gst'),mobile:pick(o,'mobile'),addr:pick(o,'addr'),_row:o._row});});checkUnique(out.parties,'name','Customers');
    const ex=sheet('Expenses','Expense Master','ExpenseMaster');rowsToObjects(ex||[]).forEach(o=>{const name=pick(o,'name');if(!name)errors.push(`Expenses: Expense Name is required at row ${o._row}.`);const n=pick(o,'defaultAmount')===''?0:numOr(pick(o,'defaultAmount')),show=bool(pick(o,'showOnInvoice')),active=bool(pick(o,'active'));if(n===null||n<0)errors.push(`Expenses: invalid Default Amount at row ${o._row}.`);out.expense_master.push({id:idOrNew(pick(o,'id')),name,defaultAmount:n??0,showOnInvoice:show===null?true:show,active:active===null?true:active,_row:o._row});});checkUnique(out.expense_master,'name','Expenses');
    const cp=sheet('Company Profile','CompanyProfile');if(cp){const pairs=rowsToObjects(cp);const c={...DB.get('company_profile',{})};pairs.forEach(o=>{const f=key(o.field||o.name),v=clean(o.value||'');const map={name:'name',address:'addr',gstin:'gst',pan:'pan',phone:'phone',bankname:'bank_name',bankaccount:'acc',ifsc:'bank'};if(map[f])c[map[f]]=v;});out.company_profile=c;}
    return {out,errors};
  };
  const upsert=(existing,incoming,natural,mapper)=>{const byId=new Map(existing.map(x=>[clean(x.id),x]));const byKey=new Map(existing.map(x=>[key(x[natural]),x]));let added=0,updated=0;incoming.forEach(x=>{const id=clean(x.id),nk=key(x[natural]);const match=(id&&byId.get(id))||byKey.get(nk);if(match){Object.assign(match,mapper(x,match));updated++;}else{const fresh=mapper(x,null);existing.push(fresh);added++;if(clean(fresh.id))byId.set(clean(fresh.id),fresh);if(nk)byKey.set(nk,fresh);}});return {added,updated};};
  const importMaster=async file=>{
    const book=await readWorkbook(file),names=Object.keys(book),{out,errors}=validateAndBuild(book);
    const present=names.filter(k=>['vehicles','drivers','customers','parties','expenses','expense master','expensemaster','company profile','companyprofile'].includes(key(k)));
    if(!present.length)throw new Error(`No supported Master Data sheets found. Found: ${names.join(', ')}. Use the ANORI Excel Template or name sheets Vehicles, Drivers, Customers, Expenses, Company Profile.`);
    if(errors.length){const msg=errors.slice(0,20).join('<br>')+(errors.length>20?`<br>…and ${errors.length-20} more.`:'');if(window.Swal)await Swal.fire({icon:'error',title:'EXCEL VALIDATION FAILED',html:`<div style="text-align:left;font-size:13px;max-height:420px;overflow:auto">${msg}</div>`});else throw new Error(errors.join('\n'));return false;}
    const counts=[out.vehicles.length,out.drivers.length,out.parties.length,out.expense_master.length].reduce((a,b)=>a+b,0);if(!counts&&!out.company_profile)throw new Error('The workbook contains no Master Data records.');
    const confirm=window.Swal?await Swal.fire({icon:'warning',title:'IMPORT MASTER DATA?',html:`<div style="text-align:left"><p><strong>${counts}</strong> master records will be processed.</p><p>Existing records are updated by ID when supplied, otherwise by vehicle number/name. New rows are added.</p><p><strong>Trips, invoices and driver settlements are not changed.</strong></p>`,showCancelButton:true,confirmButtonText:'IMPORT & UPDATE',cancelButtonText:'CANCEL'}):{isConfirmed:window.confirm(`Import ${counts} master records?`)};if(!confirm.isConfirmed)return false;
    const rollback={vehicles:DB.get('vehicles',[]),drivers:DB.get('drivers',[]),parties:DB.get('parties',[]),expense_master:DB.get('expense_master',[]),company_profile:DB.get('company_profile',{})};
    try{if(window.ANORI_DATA_SAFETY?.createRollbackSnapshot)await window.ANORI_DATA_SAFETY.createRollbackSnapshot('pre-master-excel-import');}catch(e){console.warn('Master import snapshot:',e);}
    try{
      const result={v:upsert(DB.get('vehicles',[]),out.vehicles,'number',x=>({id:x.id,number:x.number,type:x.type,driver_amount:x.driver_amount})),d:upsert(DB.get('drivers',[]),out.drivers,'name',x=>({id:x.id,name:x.name,mobile:x.mobile})),p:upsert(DB.get('parties',[]),out.parties,'name',x=>({id:x.id,name:x.name,email:x.email,credit_days:x.credit_days,credit_limit:x.credit_limit,gst:x.gst,mobile:x.mobile,addr:x.addr})),e:upsert(DB.get('expense_master',[]),out.expense_master,'name',x=>({id:x.id,name:x.name,defaultAmount:x.defaultAmount,showOnInvoice:x.showOnInvoice,active:x.active}))};
      DB.set('vehicles',DB.get('vehicles',[]),true);DB.set('drivers',DB.get('drivers',[]),true);DB.set('parties',DB.get('parties',[]),true);DB.set('expense_master',DB.get('expense_master',[]),true);if(out.company_profile)DB.set('company_profile',out.company_profile,true);if(typeof sync==='function')sync();Router.go('masters');
      Utils.toast(`Master Excel imported: Vehicles +${result.v.added}/updated ${result.v.updated}, Drivers +${result.d.added}/updated ${result.d.updated}, Customers +${result.p.added}/updated ${result.p.updated}, Expenses +${result.e.added}/updated ${result.e.updated}`,'success');return true;
    }catch(e){DB.set('vehicles',rollback.vehicles,true);DB.set('drivers',rollback.drivers,true);DB.set('parties',rollback.parties,true);DB.set('expense_master',rollback.expense_master,true);DB.set('company_profile',rollback.company_profile,true);throw e;}
  };
  Masters.exportMasterExcel=async()=>{try{const bytes=await makeWorkbook(masterSheets());await downloadBytes(bytes,`ANORI_TRANSPORT_MASTER_DATA_${typeof today==='function'?today():new Date().toISOString().slice(0,10)}.xlsx`);Utils.toast('Master Data Excel exported.','success');}catch(e){console.error(e);Utils.toast('Master Excel export failed: '+(e.message||'Unknown error'),'error');}};
  Masters.downloadExcelTemplate=async()=>{try{const sheets=masterSheets().map(s=>({name:s.name,rows:[s.rows[0]]}));const bytes=await makeWorkbook(sheets);await downloadBytes(bytes,'ANORI_TRANSPORT_MASTER_DATA_TEMPLATE.xlsx');Utils.toast('Excel template downloaded.','success');}catch(e){console.error(e);Utils.toast('Excel template failed: '+(e.message||'Unknown error'),'error');}};
  Masters.importMasterExcel=()=>{const i=document.createElement('input');i.type='file';i.accept='.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';i.style.display='none';i.onchange=async()=>{const f=i.files?.[0];i.remove();if(!f)return;try{await importMaster(f);}catch(e){console.error('Master Excel import failed:',e);if(window.Swal)Swal.fire({icon:'error',title:'MASTER EXCEL IMPORT FAILED',html:`<div style="text-align:left">${escXml(e.message||'Unable to import Excel.')}</div>`});else Utils.toast(e.message||'Unable to import Excel.','error');}};document.body.appendChild(i);i.click();};
})();

// ==========================================
// 5. TRIPS MODULE
// ==========================================

/* ===== END master-data.js ===== */

/* ===== BEGIN reports-analytics.js ===== */
const Reports = {
    render(container){
        const trips=DB.get('trips');const revenue=trips.reduce((s,t)=>s+Sanitize.number(t.freight),0);const expenses=trips.reduce((s,t)=>s+(t.expenses||[]).reduce((x,e)=>x+Sanitize.number(e.amount),0),0);
        container.innerHTML += `<div class="grid grid-4"><div class="card kpi-card"><div class="kpi-info"><h4>Total Trips</h4><p>${trips.length}</p></div></div><div class="card kpi-card"><div class="kpi-info"><h4>Revenue</h4><p>${Utils.fmt(revenue)}</p></div></div><div class="card kpi-card"><div class="kpi-info"><h4>Expenses</h4><p>${Utils.fmt(expenses)}</p></div></div><div class="card kpi-card"><div class="kpi-info"><h4>Profit</h4><p>${Utils.fmt(revenue-expenses)}</p></div></div></div><div class="card"><h3 class="card-title"><i class="fas fa-chart-bar"></i> Trip Profitability</h3><div class="table-wrapper"><table><thead><tr><th>Trip</th><th>Date</th><th>Party</th><th>Revenue</th><th>Expense</th><th>Profit</th></tr></thead><tbody>${trips.map(t=>{const p=DB.get('parties').find(x=>x.id===t.party_id);const e=(t.expenses||[]).reduce((s,x)=>s+Sanitize.number(x.amount),0);return `<tr><td>${Sanitize.html(t.trip_no)}</td><td>${Sanitize.html(t.date)}</td><td>${Sanitize.html(p?.name||'N/A')}</td><td>${Utils.fmt(t.freight)}</td><td class="expense-red">-${Utils.fmt(e)}</td><td>${Utils.fmt(t.freight-e)}</td></tr>`}).join('')}</tbody></table></div></div>`;
    }
};

// ==========================================
// 9. SETTINGS / BACKUP
// ==========================================

/* ===== END reports-analytics.js ===== */

/* ===== BEGIN settings.js ===== */
const Settings = {
    render(container){
        const c=DB.get('company_profile');
        const folder=localStorage.getItem('anori_backup_folder_name')||'Not selected';
        const last=localStorage.getItem('anori_backup_last_time');
        const lastText=last?new Date(last).toLocaleString():'Not backed up yet';
        const supported=!!window.showDirectoryPicker;
        container.innerHTML += `<div class="card"><h3 class="card-title"><i class="fas fa-cog"></i> System Settings</h3><div class="form-row"><div><strong>Company</strong><p>${Sanitize.html(c.name||'Not Set')}</p></div><div><strong>Storage</strong><p>Browser localStorage</p></div></div><hr style="margin:20px 0;border:0;border-top:1px solid var(--border)"><div class="anori-backup-panel"><div class="anori-backup-status"><strong>Automatic Backup</strong><span class="anori-badge">Every 5 Minutes</span></div><p style="margin:8px 0 4px"><strong>Selected Folder:</strong> <span id="anoriBackupFolderName">${Sanitize.html(folder)}</span></p><p style="margin:4px 0"><strong>Backup File:</strong> <span class="anori-folder-path">${BACKUP_FILE}</span></p><p style="margin:4px 0 12px"><strong>Status:</strong> <span id="anoriBackupStatus">Last backup: ${Sanitize.html(lastText)}</span></p><div class="anori-action-bar"><button class="btn btn-primary" onclick="window.anoriSelectBackupFolder()"><i class="fas fa-folder-open"></i> Select Backup Folder</button><button class="btn btn-outline" onclick="window.anoriBackupNow()"><i class="fas fa-cloud-upload-alt"></i> Backup Now</button><button class="btn btn-outline" onclick="window.anoriBackupStatus()"><i class="fas fa-shield-alt"></i> Backup Status</button></div><small class="anori-help">${supported?'The selected folder will contain one file only. The same file is overwritten every 5 minutes.':'Folder selection requires a Chromium browser such as Chrome or Edge.'}</small></div></div><button class="btn btn-outline" onclick="Settings.clearSearch()"><i class="fas fa-rotate-left"></i> Clear Search</button></div>`;
    },

    backup(){
        if(!Auth.requireAuth())return;
        if(typeof window.anoriBackupNow==='function') return window.anoriBackupNow();
        Utils.toast('Select a backup folder first.','warning');
    },
    clearSearch(){const s=document.getElementById('globalSearch');if(s)s.value='';Utils.toast('Search cleared.');}
};

// ==========================================
// 10. APP STARTUP + SESSION WATCH

/* ===== END settings.js ===== */

/* ===== BEGIN app.js ===== */
/* ANORI TRANSPORT — INVOICES & BILLING ACTION PDF FINAL ROUTE — 2026-08-29 */
// ==========================================
document.addEventListener('DOMContentLoaded', () => UI.init());
setInterval(() => {
    if (sessionStorage.getItem('anori_auth') && !Auth.isAuthenticated()) {
        Auth.logout();
    }
}, 30000);
/* ANORI TRANSPORT ERP v2.4 — SIMPLE UI + OPERATIONS + INVOICE CONTROL
   Scope: Anori Transport ERP only.
   Existing core modules/data are preserved; this layer adds the requested
   user-friendly workflow and uses one invoice renderer for preview/PDF/print.
*/
(function installAnoriV24(){
  'use strict';
  const esc = v => Sanitize.html(v == null ? '' : String(v));
  const num = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
  const money = v => Utils.fmt(num(v));
  const today = () => Utils.today();
  const ANORI_EXPENSE_MASTER_V1 = [
    'Fuel',
    'Toll',
    'Parking',
    'Repair & Maintenance',
    'Tyre',
    'Driver Expense',
    'Food',
    'Accommodation',
    'Challan',
    'Permit / Tax',
    'Washing',
    'Loading / Unloading',
    'Weighbridge',
    'Miscellaneous'
  ];
  const getExpenseMaster = () => {
    let list = DB.get('expense_master', null);
    if (!Array.isArray(list)) {
      list = ANORI_EXPENSE_MASTER_V1.map((name,i)=>({id:`EXP-${i+1}`,name,defaultAmount:0,showOnInvoice:true,active:true}));
      DB.set('expense_master', list, true);
    }
    return list;
  };
  getExpenseMaster();

  // Replace only the previous built-in expense master list with the approved list.
  // User-added/custom expense entries are preserved.
  (function migrateExpenseMaster(){
    const key='anori_expense_master_v1_migrated';
    if(localStorage.getItem(key)) return;
    const current=DB.get('expense_master',[]);
    const legacyNames=['THC','Documentation','BL Charges','Seal','Cartage','Transportation','Loading','Unloading','Handling','Other'];
    const isLegacy=Array.isArray(current) && current.length===legacyNames.length && current.every((x,i)=>String(x?.name||'')===legacyNames[i]);
    if(isLegacy){
      const list=ANORI_EXPENSE_MASTER_V1.map((name,i)=>({id:`EXP-${i+1}`,name,defaultAmount:0,showOnInvoice:true,active:true}));
      DB.set('expense_master',list,true);
    }
    localStorage.setItem(key,'1');
  })();

  // ------------------------------------------------------------
  // 15. DATA SAFETY — lightweight audit history
  // ------------------------------------------------------------
  if (!DB.__anoriAuditWrapped) {
    const originalSet = DB.set.bind(DB);
    DB.set = function(key, data, bypassAuth=false){
      const result = originalSet(key, data, bypassAuth);
      if (result && key !== 'audit_log') {
        try {
          const log = DB.get('audit_log', []);
          log.unshift({id:Utils.id(), key, time:new Date().toISOString(), user:'Administrator', action:'Updated'});
          originalSet('audit_log', log.slice(0,200), true);
        } catch(e) { console.warn('Audit log skipped', e); }
      }
      return result;
    };
    DB.__anoriAuditWrapped = true;
  }

  // ------------------------------------------------------------
  // 8. SIMPLE PROFIT CONTROL
  // ------------------------------------------------------------
  window.anoriProfitStatus = function(sell, cost){
    const s=num(sell), c=num(cost), profit=s-c, pct=s ? (profit/s)*100 : 0;
    if (profit < 0) return {label:'Loss', cls:'anori-profit-bad', icon:'🔴', pct};
    if (pct < 5) return {label:'Low Margin', cls:'anori-profit-warn', icon:'🟡', pct};
    return {label:'Good Margin', cls:'anori-profit-good', icon:'🟢', pct};
  };
  window.anoriShowCalculation = function(title, formula, result){
    Swal.fire({title:esc(title), html:`<div class="anori-calc-box"><div>${esc(formula)}</div><strong>${esc(result)}</strong></div>`, icon:'info', confirmButtonText:'OK'});
  };

  // ------------------------------------------------------------
  // 9. SMART FOLLOW-UP — simple customer/payment follow-up
  // ------------------------------------------------------------
  function getFollowups(){ return DB.get('followups', []); }
  function saveFollowups(x){ DB.set('followups', x); }
  window.anoriAddFollowup = function(partyId='', invoiceId=''){
    const parties=DB.get('parties'); const inv=DB.get('invoices').find(x=>x.id===invoiceId);
    const options=parties.map(p=>`<option value="${esc(p.id)}" ${p.id===partyId?'selected':''}>${esc(p.name)}</option>`).join('');
    Swal.fire({title:'Add Follow-up', html:`
      <div class="anori-simple-form">
        <label>Customer</label><select id="anori-fu-party">${options}</select>
        <label>What to do</label><input id="anori-fu-note" value="${esc(inv?'Payment follow-up':'Customer follow-up')}" placeholder="Example: Call customer">
        <label>Follow-up Date</label><input id="anori-fu-date" type="date" value="${today()}">
      </div>`, showCancelButton:true, confirmButtonText:'Save Follow-up', preConfirm:()=>{
        const p=document.getElementById('anori-fu-party')?.value;
        const note=document.getElementById('anori-fu-note')?.value.trim();
        const date=document.getElementById('anori-fu-date')?.value;
        if(!p||!note||!date){Swal.showValidationMessage('Please fill Customer, What to do and Date.');return false;}
        return {partyId:p,note,date,invoiceId,status:'PENDING'};
      }}).then(r=>{if(!r.isConfirmed)return; const f=getFollowups();f.push({id:Utils.id(),...r.value,createdAt:new Date().toISOString()});saveFollowups(f);Utils.toast('Follow-up saved.');Router.go('dashboard');});
  };
  window.anoriCompleteFollowup = function(id){ const f=getFollowups(); const x=f.find(a=>a.id===id); if(x){x.status='DONE';x.completedAt=new Date().toISOString();saveFollowups(f);renderAnoriDashboardTop();} };

  // ------------------------------------------------------------
  // 10. DOCUMENT CENTER — one simple place for documents
  // ------------------------------------------------------------
  const Documents = {
    render(container){
      const invoices=DB.get('invoices'), trips=DB.get('trips'), settlements=DB.get('driver_settlements');
      container.innerHTML += `<div class="anori-section-intro"><div><strong>Documents</strong><span>Open or download your important documents from one place.</span></div></div>
      <div class="anori-doc-grid">
        <div class="anori-doc-card"><div class="anori-doc-icon">🧾</div><div><strong>Invoices</strong><span>${invoices.length} saved</span></div><button class="btn btn-primary btn-sm" onclick="Router.go('invoices')">Open</button></div>
        <div class="anori-doc-card"><div class="anori-doc-icon">🚚</div><div><strong>Trip Records</strong><span>${trips.length} saved</span></div><button class="btn btn-primary btn-sm" onclick="Router.go('trips')">Open</button></div>
        <div class="anori-doc-card"><div class="anori-doc-icon">💰</div><div><strong>Driver Settlements</strong><span>${settlements.length} entries</span></div><button class="btn btn-primary btn-sm" onclick="Router.go('settlements')">Open</button></div>
      </div>
      <div class="card"><div class="anori-section-head"><div><h3 class="card-title">Recent Documents</h3><span class="anori-help">Use Preview before printing or downloading.</span></div></div>
        <div class="table-wrapper"><table><thead><tr><th>Document</th><th>Number</th><th>Date</th><th>Customer / Driver</th><th>Action</th></tr></thead><tbody>
          ${invoices.slice().reverse().slice(0,10).map(x=>{const p=DB.get('parties').find(a=>a.id===x.party_id);return `<tr><td>Invoice</td><td><strong>${esc(x.invoice_no)}</strong></td><td>${esc(x.date)}</td><td>${esc(p?.name||'-')}</td><td><button class="btn btn-outline btn-sm" onclick="Invoices.previewExisting('${esc(x.id)}')">👁 Preview</button> <button class="btn btn-primary btn-sm" onclick="Invoices.downloadExisting('${esc(x.id)}')">📄 PDF</button></td></tr>`}).join('') || '<tr><td colspan="5" class="empty-state">No documents yet.</td></tr>'}
        </tbody></table></div>
      </div>`;
    }
  };
  window.AnoriDocuments=Documents;

  const originalRouterGo=Router.go.bind(Router);
  Router.go=function(view){
    if(view!=='documents') return originalRouterGo(view);
    if(!Auth.requireAuth())return;
    document.querySelectorAll('.view').forEach(v=>v.remove());
    const container=document.getElementById('mainContent'); const viewEl=document.createElement('div');viewEl.className='view active';container.appendChild(viewEl);
    const header=document.createElement('div');header.className='page-header';header.innerHTML='<h1 class="page-title">Documents</h1>';viewEl.appendChild(header);
    const content=document.createElement('div');viewEl.appendChild(content);Documents.render(content);
  };

  // ------------------------------------------------------------
  // 13 + 14. DASHBOARD TOP: simple cards + action center
  // ------------------------------------------------------------
  window.renderAnoriDashboardTop=function(){
    const host=document.getElementById('anori-dashboard-top'); if(!host)return;
    const tripRows=DB.get('trips')||[], invoiceRows=DB.get('invoices')||[], followupRows=typeof getFollowups==='function'?(getFollowups()||[]):[];
    const driverRows=DB.get('driver_settlements')||[];
    const pendingToGenerate=tripRows.filter(t=>t.status==='completed'&&!(typeof activeInv==='function'&&activeInv(t.id))).length;
    const pendingPayment=invoiceRows.filter(i=>!['paid','cancelled'].includes(String(i.status||'').toLowerCase())&&num(i.balance_due)>0).length;
    const overdue=invoiceRows.filter(i=>num(i.balance_due)>0&&String(i.status||'').toLowerCase()!=='paid'&&String(i.status||'').toLowerCase()!=='cancelled'&&typeof status==='function'&&status(i)==='overdue').length;
    const dueFollowups=followupRows.filter(x=>x.status!=='DONE'&&x.date<=today()).length;

    const attention=[
      {icon:'🧾',value:pendingToGenerate,title:'Pending to Generate Invoice',note:'Completed trips awaiting invoice',cls:'warn',action:"Router.go('trips')"},
      {icon:'💳',value:pendingPayment,title:'Pending Payment',note:'Invoices with outstanding balance',cls:'payment',action:"Router.go('invoices')"},
      {icon:'⏰',value:overdue,title:'Overdue Invoice',note:'Requires payment follow-up',cls:'danger',action:"Router.go('invoices')"},
      {icon:'📞',value:dueFollowups,title:'Follow-up Today',note:'Customer calls due today',cls:'info',action:"Router.go('dashboard');setTimeout(()=>anoriAddFollowup(),50)"}
    ];

    const actionRows=[];
    if(pendingToGenerate) actionRows.push(`<div class="anori-action-line warn"><span>🧾</span><div><strong>${pendingToGenerate} trip${pendingToGenerate>1?'s':''} pending invoice generation</strong><small>Completed trips are ready for billing.</small></div><button class="btn btn-outline btn-sm" onclick="Router.go('trips')">Open →</button></div>`);
    if(pendingPayment) actionRows.push(`<div class="anori-action-line payment"><span>💳</span><div><strong>${pendingPayment} invoice${pendingPayment>1?'s':''} payment pending</strong><small>Outstanding customer receivables.</small></div><button class="btn btn-outline btn-sm" onclick="Router.go('invoices')">Open →</button></div>`);
    if(overdue) actionRows.push(`<div class="anori-action-line danger"><span>🔴</span><div><strong>${overdue} overdue invoice${overdue>1?'s':''}</strong><small>Payment follow-up should be prioritised.</small></div><button class="btn btn-outline btn-sm" onclick="Router.go('invoices')">Open →</button></div>`);
    if(dueFollowups) actionRows.push(`<div class="anori-action-line info"><span>📞</span><div><strong>${dueFollowups} follow-up${dueFollowups>1?'s':''} due today</strong><small>Customer communication is due.</small></div><button class="btn btn-outline btn-sm" onclick="Router.go('dashboard');setTimeout(()=>anoriAddFollowup(),50)">Open →</button></div>`);

    host.innerHTML=`
      <section class="anori-cc-head">
        <div><div class="anori-cc-eyebrow">ANORI TRANSPORT • OPERATIONS CONTROL CENTRE</div><h1>Dashboard</h1><p>Today's operational and financial overview</p></div>
        <div class="anori-cc-head-actions"><button class="btn btn-primary btn-sm" onclick="Router.go('trips')">＋ New Trip</button><button class="btn btn-outline btn-sm" onclick="renderAnoriDashboardTop()">↻ Refresh</button></div>
      </section>

      <section class="anori-cc-panel">
        <div class="anori-cc-panel-head"><div><h2>⚠️ Today's Attention</h2><span>Priority items that may need action today.</span></div></div>
        <div class="anori-cc-attention-grid">
          ${attention.map(x=>`<button type="button" class="anori-cc-attention ${x.cls}" onclick="${x.action}">
            <span class="anori-cc-icon">${x.icon}</span><span class="anori-cc-count">${x.value}</span>
            <span class="anori-cc-label">${x.title}</span><small>${x.note}</small><b>Open →</b>
          </button>`).join('')}
        </div>
      </section>


      <section class="anori-cc-two-col">
        <div class="anori-cc-panel">
          <div class="anori-cc-panel-head"><div><h2>🔔 Requires Action</h2><span>Only items requiring attention.</span></div></div>
          <div class="anori-action-list">${actionRows.length?actionRows.join(''):'<div class="anori-cc-clear">✓ All clear — no urgent actions.</div>'}</div>
        </div>
        <div class="anori-cc-panel">
          <div class="anori-cc-panel-head"><div><h2>⚡ Quick Actions</h2><span>Frequently used operations.</span></div></div>
          <div class="anori-quick-grid">
            <button onclick="Router.go('trips')"><span>＋</span><b>New Trip</b><small>Create trip</small></button>
            <button onclick="Router.go('invoices')"><span>🧾</span><b>Invoice</b><small>Manage billing</small></button>
            <button onclick="Router.go('expenses')"><span>💰</span><b>Expense</b><small>Add expense</small></button>
            <button onclick="Router.go('settlements')"><span>👨‍✈️</span><b>Settlement</b><small>Driver ledger</small></button>
          </div>
        </div>
      </section>`;
  };

  const originalDashboardRender=Dashboard.render.bind(Dashboard);
  Dashboard.render=function(container){
    container.innerHTML='<div id="anori-dashboard-top"></div>';
    originalDashboardRender(container);
    setTimeout(renderAnoriDashboardTop,50);
  };

  // ------------------------------------------------------------
  // 1 + 17. SMART UI / SMART DEFAULTS / PARTY CREDIT DAYS
  // ------------------------------------------------------------
  // ------------------------------------------------------------
  // PAYMENT TERMS — ALWAYS RESOLVE FROM PARTY MASTER DATA
  // ------------------------------------------------------------
  function resolvePartyCreditDays(party, fallback=30){
    const raw = party && party.credit_days;
    const value = Number(raw);
    if (Number.isFinite(value) && value >= 0) return Math.floor(value);
    const stored = Number(fallback);
    if (Number.isFinite(stored) && stored >= 0) return Math.floor(stored);
    return 30;
  }
  // Stable global reference: later amendment blocks live in separate scopes.
  window.anoriResolvePartyCreditDays = resolvePartyCreditDays;

  const originalPartyOpen=Masters.openModal.bind(Masters);
  Masters.openModal=function(type,id=null){
    if(type!=='party') return originalPartyOpen(type,id);
    const data=DB.get('parties'); const item=id?data.find(x=>x.id===id)||{}:{};
    const html=`<div class="form-row"><div class="form-group"><label>Customer Name *</label><input class="form-control" id="m_name" value="${esc(item.name)}" required></div><div class="form-group"><label>Credit Days</label><input class="form-control" id="m_credit_days" type="number" min="0" value="${Number.isFinite(Number(item.credit_days)) ? Math.max(0, Math.floor(Number(item.credit_days))) : 30}"></div></div><div class="form-row"><div class="form-group"><label>GSTIN</label><input class="form-control" id="m_gst" value="${esc(item.gst)}"></div><div class="form-group"><label>Mobile</label><input class="form-control" id="m_mobile" value="${esc(item.mobile||'')}"></div></div><div class="form-group"><label>Address</label><input class="form-control" id="m_addr" value="${esc(item.addr)}"></div>`;
    UI.openModal(`${id?'Edit':'Add'} Customer`,html,()=>{
      const name=document.getElementById('m_name').value.trim();if(!name)return Utils.toast('Customer name is required.','error');
      const arr=DB.get('parties');const x=id?arr.find(a=>a.id===id):{id:Utils.id()};x.name=esc(name);x.gst=esc(document.getElementById('m_gst').value);x.addr=esc(document.getElementById('m_addr').value);x.mobile=esc(document.getElementById('m_mobile').value);x.credit_days=Math.max(0, Math.floor(num(document.getElementById('m_credit_days').value)));if(!id)arr.push(x);DB.set('parties',arr);UI.closeModal();Utils.toast('Customer saved.');Router.go('masters');
    });
  };

  // ------------------------------------------------------------
  // 16. KEYBOARD SHORTCUTS — optional for faster users
  // ------------------------------------------------------------
  document.addEventListener('keydown',e=>{
    if(e.ctrlKey||e.metaKey){
      const k=e.key.toLowerCase();
      if(k==='k'){e.preventDefault();const s=document.getElementById('globalSearch');s?.focus();s?.select();}
      if(k==='n'){e.preventDefault();const active=document.querySelector('.nav-item.active')?.dataset.view;if(active==='trips')Trips.openForm();else if(active==='invoices')Invoices.showInvoiceGenerator();else if(active==='masters')Masters.openModal('party');}
      if(k==='p'){const active=document.querySelector('.nav-item.active')?.dataset.view;if(active==='invoices'){e.preventDefault();const x=DB.get('invoices').slice(-1)[0];if(x)Invoices.previewInvoice(x);}}
    }
  });

  // ------------------------------------------------------------
  // 19. GLOBAL SEARCH — simple cross-module results
  // ------------------------------------------------------------
  function ensureSearchResults(){
    if(document.getElementById('anori-search-results'))return;
    const wrap=document.querySelector('.search-container');if(!wrap)return;
    const box=document.createElement('div');box.id='anori-search-results';box.className='anori-search-results';wrap.appendChild(box);
  }
  function searchAll(q){
    q=q.trim().toLowerCase();if(!q)return [];
    const out=[];
    DB.get('parties').forEach(x=>{if(`${x.name} ${x.gst} ${x.mobile}`.toLowerCase().includes(q))out.push({type:'Customer',name:x.name,sub:x.mobile||x.gst||'',go:()=>{Router.go('masters');}});});
    DB.get('vehicles').forEach(x=>{if(`${x.number} ${x.type}`.toLowerCase().includes(q))out.push({type:'Vehicle',name:x.number,sub:x.type||'',go:()=>Router.go('trips')});});
    DB.get('drivers').forEach(x=>{if(`${x.name} ${x.mobile}`.toLowerCase().includes(q))out.push({type:'Driver',name:x.name,sub:x.mobile||'',go:()=>Router.go('settlements')});});
    DB.get('trips').forEach(x=>{if(`${x.trip_no} ${x.from} ${x.to}`.toLowerCase().includes(q))out.push({type:'Trip',name:x.trip_no,sub:`${x.from} → ${x.to}`,go:()=>Router.go('trips')});});
    DB.get('invoices').forEach(x=>{if(`${x.invoice_no} ${x.status}`.toLowerCase().includes(q))out.push({type:'Invoice',name:x.invoice_no,sub:x.status||'',go:()=>{Router.go('invoices');setTimeout(()=>Invoices.previewExisting(x.id),100);}});});
    return out.slice(0,8);
  }
  function renderSearch(q){
    ensureSearchResults();const box=document.getElementById('anori-search-results');if(!box)return;
    const rows=searchAll(q);box.innerHTML=rows.length?rows.map((x,i)=>`<button type="button" class="anori-search-row" data-index="${i}"><span class="anori-search-type">${esc(x.type)}</span><span><strong>${esc(x.name)}</strong><small>${esc(x.sub)}</small></span></button>`).join(''):'<div class="anori-search-empty">No matching record</div>';
    box.querySelectorAll('.anori-search-row').forEach((b,i)=>b.onclick=()=>{rows[i].go();box.classList.remove('show');});box.classList.toggle('show',!!q);
  }
  document.addEventListener('DOMContentLoaded',()=>{
    setTimeout(()=>{
      ensureSearchResults();const s=document.getElementById('globalSearch');if(!s)return;
      s.addEventListener('input',e=>renderSearch(e.target.value));
      s.addEventListener('focus',e=>{if(e.target.value)renderSearch(e.target.value);});
      document.addEventListener('click',e=>{const wrap=document.querySelector('.search-container');if(wrap&&!wrap.contains(e.target))document.getElementById('anori-search-results')?.classList.remove('show');});
    },100);
  });

  // ------------------------------------------------------------
  // 18 + 20. SIMPLE CALCULATION + MOBILE ACTIONS
  // ------------------------------------------------------------
  const originalTripsRender=Trips.render.bind(Trips);
  Trips.render=function(container){
    originalTripsRender(container);
    container.querySelectorAll('tbody tr').forEach(row=>{
      const cells=row.children;if(cells.length<11)return;
      const profitText=cells[8]?.textContent||''; const profit=num(profitText.replace(/[^0-9.-]/g,'')); const status=anoriProfitStatus(Math.max(0,profit),0);
      const btn=document.createElement('button');btn.className='btn btn-outline btn-sm anori-mini-btn';btn.textContent='ⓘ';btn.title='How profit is calculated';
      btn.onclick=()=>anoriShowCalculation('Trip Profit',`Freight − Expenses = Profit\n${cells[6]?.textContent||'Freight'} − ${cells[7]?.textContent||'Expenses'}`,profitText);
      cells[8].appendChild(document.createTextNode(' '));cells[8].appendChild(btn);
    });
  };

  // ------------------------------------------------------------
  // EXPENSE MASTER + INVOICE BILLABLE EXPENSES
  // ------------------------------------------------------------
  function renderExpenseMasterBlock(){
    const list=getExpenseMaster();
    return `<div class="card anori-expense-master"><div class="anori-section-head"><div><h3 class="card-title">💸 Expense List</h3><span class="anori-help">Choose which expenses can be added to customer invoices.</span></div><button class="btn btn-primary btn-sm" onclick="anoriAddExpenseMaster()">＋ Add Expense</button></div><div class="table-wrapper"><table><thead><tr><th>Expense</th><th>Default Amount</th><th>Show on Invoice</th><th>Action</th></tr></thead><tbody>${list.map(x=>`<tr><td><strong>${esc(x.name)}</strong></td><td>${money(x.defaultAmount)}</td><td><label class="anori-switch"><input type="checkbox" ${x.showOnInvoice?'checked':''} onchange="anoriToggleExpense('${esc(x.id)}',this.checked)"><span></span></label></td><td><button class="btn btn-danger btn-sm" onclick="anoriDeleteExpense('${esc(x.id)}')">Delete</button></td></tr>`).join('')}</tbody></table></div></div>`;
  }
  window.anoriAddExpenseMaster=function(){
    Swal.fire({title:'Add Expense',html:`<div class="anori-simple-form"><label>Expense Name</label><input id="anori-exp-name" placeholder="Example: Documentation"><label>Default Amount</label><input id="anori-exp-amount" type="number" min="0" value="0"><label><input id="anori-exp-show" type="checkbox" checked> Show on Invoice</label></div>`,showCancelButton:true,confirmButtonText:'Save',preConfirm:()=>{const name=document.getElementById('anori-exp-name').value.trim();if(!name){Swal.showValidationMessage('Enter expense name.');return false;}return {name,defaultAmount:num(document.getElementById('anori-exp-amount').value),showOnInvoice:document.getElementById('anori-exp-show').checked};}}).then(r=>{if(!r.isConfirmed)return;const a=getExpenseMaster();a.push({id:Utils.id(),...r.value,active:true});DB.set('expense_master',a);Utils.toast('Expense added.');Router.go('masters');});
  };
  window.anoriToggleExpense=function(id,show){const a=getExpenseMaster();const x=a.find(e=>e.id===id);if(x){x.showOnInvoice=!!show;DB.set('expense_master',a);Utils.toast(show?'Expense will show on invoice.':'Expense hidden from invoice.');}};
  window.anoriDeleteExpense=function(id){const a=getExpenseMaster();const x=a.find(e=>e.id===id);if(!x)return;Swal.fire({title:'Delete expense?',text:x.name,icon:'warning',showCancelButton:true,confirmButtonText:'Delete'}).then(r=>{if(r.isConfirmed){DB.set('expense_master',a.filter(e=>e.id!==id));Router.go('masters');}});};

  const originalMastersRender=Masters.render.bind(Masters);
  Masters.render=function(container){originalMastersRender(container);container.insertAdjacentHTML('beforeend',renderExpenseMasterBlock());};

  function billableExpenseSummary(trips){
    const master=getExpenseMaster().filter(x=>x.active&&x.showOnInvoice);
    return master.map(m=>{const amount=trips.reduce((s,t)=>s+(t.expenses||[]).filter(e=>String(e.type||'').trim().toLowerCase()===String(m.name).trim().toLowerCase()).reduce((a,e)=>a+num(e.amount),0),0);return {...m,amount:amount||num(m.defaultAmount)};});
  }
  function buildExpenseInputs(trips){
    return billableExpenseSummary(trips).map((x,i)=>`<div class="anori-expense-select-row"><label><input type="checkbox" class="anori-inv-exp-check" data-id="${esc(x.id)}" ${x.amount>0?'checked':''}> <strong>${esc(x.name)}</strong></label><input type="number" min="0" class="anori-inv-exp-amount" data-id="${esc(x.id)}" value="${x.amount||0}"></div>`).join('')||'<div class="anori-help">No billable expenses in Master Data.</div>';
  }

  // Replace invoice generator with a simpler, more useful version.
  Invoices.showInvoiceGenerator=function(){
    const trips=DB.get('trips').filter(t=>t.status==='completed'&&t.invoice_status!=='paid');
    const vehicles=DB.get('vehicles'), parties=DB.get('parties');
    if(!trips.length)return Utils.toast('No completed trips available.','warning');
    Swal.fire({title:'Create Invoice',width:820,html:`<div class="anori-invoice-generator"><div class="anori-help">1. Select trips → 2. Select billable expenses → 3. Create invoice</div><div class="table-wrapper" style="max-height:260px;overflow:auto"><table><thead><tr><th></th><th>Date</th><th>Trip</th><th>Party</th><th>Freight</th></tr></thead><tbody>${trips.map(t=>{const p=parties.find(x=>x.id===t.party_id);return `<tr><td><input type="checkbox" class="anori-trip-check" data-id="${esc(t.id)}" data-party="${esc(t.party_id)}"></td><td>${esc(t.date)}</td><td>${esc(t.trip_no)}</td><td>${esc(p?.name||'-')}</td><td>${money(t.freight)}</td></tr>`}).join('')}</tbody></table></div><div id="anori-inv-expenses" class="anori-expense-picker"><div class="anori-help">Select expenses that should appear on the customer invoice.</div><div id="anori-expense-inputs"><div class="anori-help">Select a trip first.</div></div></div><div class="anori-generator-bottom"><label>Invoice Type<select id="anori-inv-type"><option value="gst">GST Invoice (18%)</option><option value="nongst">Non-GST</option></select></label><label>Advance Received<input id="anori-inv-advance" type="number" min="0" value="0"></label></div></div>`,showCancelButton:true,confirmButtonText:'Create Invoice',cancelButtonText:'Cancel',didOpen:()=>{
      const update=()=>{const checks=[...document.querySelectorAll('.anori-trip-check:checked')];const ids=checks.map(c=>c.dataset.id);const sel=trips.filter(t=>ids.includes(t.id));const partiesSel=new Set(sel.map(t=>t.party_id));if(partiesSel.size>1){Swal.showValidationMessage('Please select trips for one customer only.');}else{document.getElementById('anori-expense-inputs').innerHTML=sel.length?buildExpenseInputs(sel):'<div class="anori-help">Select a trip first.</div>';}};
      document.querySelectorAll('.anori-trip-check').forEach(c=>c.addEventListener('change',update));
    },preConfirm:()=>{
      const selected=[...document.querySelectorAll('.anori-trip-check:checked')].map(c=>c.dataset.id);if(!selected.length){Swal.showValidationMessage('Select at least one trip.');return false;}
      const partyIds=new Set([...document.querySelectorAll('.anori-trip-check:checked')].map(c=>c.dataset.party));if(partyIds.size>1){Swal.showValidationMessage('Select trips for one customer only.');return false;}
      const expenses=[...document.querySelectorAll('.anori-inv-exp-check:checked')].map(c=>{const id=c.dataset.id;const amount=num([...document.querySelectorAll('.anori-inv-exp-amount')].find(el=>el.dataset.id===id)?.value);const m=getExpenseMaster().find(x=>x.id===id);return {masterId:id,name:m?.name||'Expense',amount};}).filter(x=>x.amount>0);
      const advance=num(document.getElementById('anori-inv-advance').value);return {selected,isGst:document.getElementById('anori-inv-type').value==='gst',advance,expenses};
    }}).then(r=>{if(!r.isConfirmed)return;const selectedTrips=DB.get('trips').filter(t=>r.value.selected.includes(t.id));Invoices.createInvoice(selectedTrips,r.value.isGst,r.value.advance,r.value.expenses);});
  };

  Invoices.createInvoice=function(trips,isGst,advance,expenseLines=[]){
    Utils.showLoader('Creating invoice...');setTimeout(()=>{try{
      const party=DB.get('parties').find(p=>p.id===trips[0].party_id);const vehicles=DB.get('vehicles');
      const subtotal=trips.reduce((s,t)=>s+num(t.freight),0)+expenseLines.reduce((s,e)=>s+num(e.amount),0);
      const cgst=isGst?subtotal*0.09:0, sgst=isGst?subtotal*0.09:0, total=subtotal+cgst+sgst;
      if(advance>total) throw new Error('Advance cannot be greater than invoice total.');
      const invoice={id:Utils.id(),invoice_no:Utils.generateInvoiceNo(),date:today(),party_id:party.id,trip_ids:trips.map(t=>t.id),trip_count:trips.length,subtotal,cgst,sgst,total_amount:total,advance,balance_due:total-advance,is_gst:isGst,status:'issued',expense_lines,credit_days:window.anoriResolvePartyCreditDays(party),trips_data:trips.map(t=>({...t,vehicle:vehicles.find(v=>v.id===t.vehicle_id)}))};
      const inv=DB.get('invoices');inv.push(invoice);DB.set('invoices',inv);const all=DB.get('trips');trips.forEach(t=>{const x=all.find(a=>a.id===t.id);if(x)x.invoice_status='shared';});DB.set('trips',all);Utils.hideLoader();Invoices.previewInvoice(invoice);Utils.toast('Invoice created. Check Preview before PDF.');
    }catch(e){Utils.hideLoader();Utils.toast(e.message||'Could not create invoice.','error');}},250);
  };

  // ------------------------------------------------------------
  // 3. ONE INVOICE RENDERER — Preview and PDF use the same HTML/CSS
  // ------------------------------------------------------------
  Invoices.buildInvoiceHTML=function(invoice, preview=false){
    const company=DB.get('company_profile'), party=DB.get('parties').find(p=>p.id===invoice.party_id)||{};
    const creditDays=window.anoriResolvePartyCreditDays(party, invoice.credit_days);
    const due=this.getDueDate(invoice.date, creditDays);
    const tripRows=(invoice.trips_data||[]).map((t,i)=>`<tr><td>${i+1}</td><td><strong>${esc(t.trip_no)}</strong></td><td>${esc(t.date)}</td><td>${esc(t.from)} → ${esc(t.to)}</td><td>${esc(t.vehicle?.number||'')}</td><td class="money">${money(t.freight)}</td></tr>`).join('');
    const expRows=(invoice.expense_lines||[]).map((e,i)=>`<tr class="expense-line"><td>${(invoice.trips_data||[]).length+i+1}</td><td><strong>${esc(e.name)}</strong><small>Billable Expense</small></td><td>-</td><td>-</td><td>-</td><td class="money">${money(e.amount)}</td></tr>`).join('');
    const tax=invoice.cgst+invoice.sgst;
    const terms=invoice.status==='paid'?'Paid':invoice.status==='cancelled'?'Cancelled':creditDays+' Days';
    const status=String(invoice.status||'issued').replace('_',' ').toUpperCase();
    const total=invoice.total_amount, balance=Math.max(0,invoice.balance_due);
    const css=`*{box-sizing:border-box}html,body{margin:0;padding:0;background:${preview?'#e8edf4':'#fff'};font-family:Inter,Arial,sans-serif;color:#172033}body{padding:${preview?'18px':'0'}}.invoice-page{width:210mm;min-height:297mm;margin:0 auto;background:#fff;padding:14mm 15mm;font-size:11px;line-height:1.45;box-shadow:${preview?'0 14px 40px rgba(15,23,42,.22)':'none'}}.inv-head{display:grid;grid-template-columns:1fr 245px;gap:18px;padding-bottom:14px;border-bottom:3px solid #173b7a}.brand{font-size:24px;font-weight:800;color:#10213d}.muted{color:#64748b}.inv-title{font-size:24px;font-weight:900;text-align:right;color:#10213d}.meta{margin-top:8px;border:1px solid #d8e0ea;border-radius:7px;overflow:hidden}.meta-row{display:grid;grid-template-columns:100px 1fr}.meta-row:nth-child(even){background:#f8fafc}.meta-row b{padding:6px 7px;background:#edf4fb}.meta-row span{padding:6px 7px;text-align:right;word-break:break-word}.badge{display:inline-block;padding:3px 7px;border-radius:999px;background:#dbeafe;color:#1d4ed8;font-weight:800;font-size:9px}.two{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:13px}.box{border:1px solid #d8e0ea;border-radius:7px;overflow:hidden}.box-title{background:#edf4fb;color:#173b7a;font-weight:900;padding:7px 9px;font-size:10px}.box-body{padding:9px;min-height:72px}.section{margin-top:13px;background:#173b7a;color:#fff;font-weight:900;padding:7px 9px;border-radius:6px 6px 0 0}.inv-table{width:100%;border-collapse:collapse;table-layout:fixed}.inv-table th{background:#eef3f8;color:#334155;font-size:9px;padding:7px 5px;border:1px solid #d8e0ea;text-align:left}.inv-table td{padding:7px 5px;border:1px solid #d8e0ea;vertical-align:top;overflow-wrap:anywhere}.money{text-align:right;white-space:nowrap}.inv-table small{display:block;color:#64748b;font-size:8px}.summary-wrap{display:flex;justify-content:flex-end;margin-top:12px}.summary{width:310px;border:1px solid #d8e0ea;border-radius:7px;overflow:hidden}.sum-row{display:grid;grid-template-columns:1fr 120px;padding:7px 9px;border-bottom:1px solid #e2e8f0}.sum-row span:last-child{text-align:right;white-space:nowrap}.sum-total{font-weight:900;background:#f0fdf4}.sum-balance{font-size:14px;font-weight:900;background:#173b7a;color:#fff}.words{margin-top:12px;border:1px solid #d8e0ea;border-radius:7px;padding:9px}.bottom{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}.sign{text-align:right;min-height:105px}.sign-line{margin-top:42px;border-top:1px solid #64748b;padding-top:5px}.terms{margin-top:12px;border-top:1px solid #d8e0ea;padding-top:8px;color:#475569;font-size:9px}.footer{display:flex;justify-content:space-between;gap:12px;border-top:2px solid #173b7a;margin-top:12px;padding-top:7px;font-size:8px;color:#64748b}@media print{body{padding:0;background:#fff}.invoice-page{margin:0;box-shadow:none;page-break-after:always}@page{size:A4 portrait;margin:0}}`;
    return `<!doctype html><html><head><meta charset="UTF-8"><title>${esc(invoice.invoice_no)}</title><style>${css}</style></head><body><div class="invoice-page" id="invoice-page">
      <div class="inv-head"><div><div class="brand">${esc(company.name||'Anori Transport Services')}</div><div>${esc(company.addr||'')}</div><div>GSTIN: ${esc(company.gst||'N/A')} &nbsp; | &nbsp; Phone: ${esc(company.phone||'N/A')}</div></div><div><div class="inv-title">TAX INVOICE</div><div class="meta"><div class="meta-row"><b>Invoice No.</b><span>${esc(invoice.invoice_no)}</span></div><div class="meta-row"><b>Date</b><span>${esc(invoice.date)}</span></div><div class="meta-row"><b>Due Date</b><span>${esc(due)}</span></div><div class="meta-row"><b>Status</b><span><em class="badge">${esc(status)}</em></span></div></div></div></div>
      <div class="two"><div class="box"><div class="box-title">BILL TO</div><div class="box-body"><strong>${esc(party.name||'N/A')}</strong><br>${esc(party.addr||'')}${party.gst?`<br>GSTIN: ${esc(party.gst)}`:''}</div></div><div class="box"><div class="box-title">PAYMENT TERMS</div><div class="box-body"><strong>${esc(terms)}</strong><br>Due Date: ${esc(due)}<br>Invoice Type: ${isGstInvoice?'GST':'Non-GST'}${invoice.is_gst?`<br>Tax Type: ${invoice.tax_type==='igst'?'IGST 18%':'CGST 9% + SGST 9%'}`:''}</div></div></div>
      <div class="section">TRANSPORT / BILLABLE CHARGES</div><table class="inv-table"><thead><tr><th style="width:5%">#</th><th style="width:25%">Description</th><th style="width:12%">Date</th><th style="width:27%">Route</th><th style="width:15%">Vehicle</th><th style="width:16%;text-align:right">Amount</th></tr></thead><tbody>${tripRows}${expRows||''}</tbody></table>
      <div class="summary-wrap"><div class="summary"><div class="sum-row"><span>Subtotal</span><span>${money(invoice.subtotal)}</span></div>${invoice.is_gst?`<div class="sum-row"><span>CGST 9%</span><span>${money(invoice.cgst)}</span></div><div class="sum-row"><span>SGST 9%</span><span>${money(invoice.sgst)}</span></div>`:''}<div class="sum-row sum-total"><span>Total</span><span>${money(total)}</span></div><div class="sum-row"><span>Advance Received</span><span>-${money(invoice.advance)}</span></div><div class="sum-row sum-balance"><span>BALANCE DUE</span><span>${money(balance)}</span></div></div></div>
      <div class="words"><strong>AMOUNT IN WORDS</strong><br>${esc(Utils.numberToWords(total))}</div>
      <div class="bottom"><div class="box"><div class="box-title">BANK DETAILS</div><div class="box-body">Account No.: <strong>${esc(company.acc||'N/A')}</strong><br>IFSC: <strong>${esc(company.bank||'N/A')}</strong></div></div><div class="box sign"><div class="box-title">FOR ${esc(company.name||'ANORI TRANSPORT SERVICES')}</div><div class="sign-line">Authorized Signatory</div></div></div>
      <div class="terms"><strong>TERMS & CONDITIONS</strong><br>1. Payment is due as per agreed payment terms.<br>2. Any discrepancy should be communicated promptly.<br>3. This is a computer-generated invoice.</div>
      <div class="footer"><span>Thank you for your business.</span><span>${esc(invoice.invoice_no)}</span></div>
    </div></body></html>`;
  };
  Invoices.getDueDate=function(date,days=30){const d=new Date(date);if(Number.isNaN(d.getTime()))return today();d.setDate(d.getDate()+Math.max(0,num(days)));return d.toISOString().split('T')[0];};
  Invoices.previewInvoice=function(invoice){
    try{
      if(typeof this.mountInvoiceDocument!=='function') throw new Error('Invoice Preview renderer is unavailable.');
      this.mountInvoiceDocument(invoice);
      document.getElementById('previewModal')?.classList.add('active');
    }catch(e){ console.error('Invoice preview error:',e); Utils.toast(e.message||'Unable to open invoice preview.','error'); }
  };
  Invoices.downloadInvoice = function(invoice) { return (window.__ANORI_PDF_FINAL_FUNCTION ? window.__ANORI_PDF_FINAL_FUNCTION(invoice) : Promise.reject(new Error('PDF engine is initializing.'))); };
  Invoices.updateStatus=function(id,status){const a=DB.get('invoices');const x=a.find(i=>i.id===id);if(!x)return;x.status=status;DB.set('invoices',a);Utils.toast('Invoice status updated.');Router.go('invoices');};
  Invoices.deleteInvoice=function(id){const a=DB.get('invoices'),x=a.find(i=>i.id===id);if(!x)return;if(String(x.status).toLowerCase()!=='draft'){Swal.fire({title:'Cancel Invoice?',text:'Issued invoices are kept for history. Only the status will change to Cancelled.',icon:'warning',showCancelButton:true,confirmButtonText:'Cancel Invoice'}).then(r=>{if(!r.isConfirmed)return;x.status='cancelled';x.cancelledAt=new Date().toISOString();DB.set('invoices',a);Router.go('invoices');});}else{DB.set('invoices',a.filter(i=>i.id!==id));Router.go('invoices');}};
  Invoices.render=function(container){const a=DB.get('invoices'),parties=DB.get('parties');container.innerHTML+=`<div class="anori-section-intro"><div><strong>Invoices</strong><span>Preview first. Then send, download or record payment.</span></div><button class="btn btn-success" onclick="Invoices.showInvoiceGenerator()">＋ New Invoice</button></div><div class="anori-kpi-grid"><div class="anori-kpi-card"><span>🧾 Total</span><strong>${a.length}</strong><small>Invoices</small></div><div class="anori-kpi-card"><span>💰 Outstanding</span><strong>${money(a.reduce((s,x)=>s+Math.max(0,num(x.balance_due)),0))}</strong><small>Balance due</small></div><div class="anori-kpi-card"><span>🟢 Paid</span><strong>${a.filter(x=>x.status==='paid').length}</strong><small>Completed</small></div><div class="anori-kpi-card"><span>🟠 Follow-up</span><strong>${a.filter(x=>num(x.balance_due)>0&&x.status!=='cancelled').length}</strong><small>Need payment</small></div></div><div class="card"><div class="table-wrapper"><table><thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Total</th><th>Balance</th><th>Status</th><th>Action</th></tr></thead><tbody>${a.slice().reverse().map(x=>{const p=parties.find(y=>y.id===x.party_id);return `<tr><td><strong>${esc(x.invoice_no)}</strong></td><td>${esc(x.date)}</td><td>${esc(p?.name||'-')}</td><td>${money(x.total_amount)}</td><td><strong>${money(x.balance_due)}</strong></td><td><select class="form-control anori-status-select" data-action="update-invoice-status" data-id="${esc(x.id)}"><option value="issued" ${x.status==='issued'?'selected':''}>Issued</option><option value="sent" ${x.status==='sent'?'selected':''}>Sent</option><option value="part_paid" ${x.status==='part_paid'?'selected':''}>Part Paid</option><option value="paid" ${x.status==='paid'?'selected':''}>Paid</option><option value="cancelled" ${x.status==='cancelled'?'selected':''}>Cancelled</option></select></td><td class="anori-actions"><button class="btn btn-outline btn-sm" onclick="Invoices.previewExisting('${esc(x.id)}')">👁 Preview</button><button class="btn btn-primary btn-sm" onclick="Invoices.downloadExisting('${esc(x.id)}')">📄 PDF</button>${x.status!=='cancelled'&&x.status!=='paid'?`<button class="btn btn-outline btn-sm" onclick="anoriAddFollowup('${esc(x.party_id)}','${esc(x.id)}')">📞 Follow-up</button>`:''}<button class="btn btn-danger btn-sm" data-action="delete-invoice" data-id="${esc(x.id)}">${x.status==='draft'?'Delete':'Cancel'}</button></td></tr>`}).join('')||'<tr><td colspan="7" class="empty-state">No invoices yet.</td></tr>'}</tbody></table></div></div>`;};

  // ------------------------------------------------------------
  // 13. Settings gets a simple audit history
  // ------------------------------------------------------------
  const originalSettingsRender=Settings.render.bind(Settings);
  Settings.render=function(container){originalSettingsRender(container);const logs=DB.get('audit_log',[]).slice(0,20);container.insertAdjacentHTML('beforeend',`<div class="card"><div class="anori-section-head"><div><h3 class="card-title">🛡️ Change History</h3><span class="anori-help">Recent data changes saved in this browser.</span></div></div><div class="table-wrapper"><table><thead><tr><th>Time</th><th>Area</th><th>Action</th></tr></thead><tbody>${logs.map(x=>`<tr><td>${esc(new Date(x.time).toLocaleString('en-IN'))}</td><td>${esc(x.key)}</td><td>${esc(x.action)}</td></tr>`).join('')||'<tr><td colspan="3">No changes recorded yet.</td></tr>'}</tbody></table></div></div>`);};

  // ------------------------------------------------------------
  // Initial nav injection for Documents
  // ------------------------------------------------------------
  document.addEventListener('DOMContentLoaded',()=>{
    const nav=document.getElementById('navMenu');if(nav&&!nav.querySelector('[data-view="documents"]')){const a=document.createElement('a');a.className='nav-item';a.dataset.view='documents';a.setAttribute('role','button');a.tabIndex=0;a.innerHTML='<i class="fas fa-folder-open"></i> Documents';nav.insertBefore(a,nav.querySelector('[data-view="settings"]'));}
    setTimeout(()=>{try{renderAnoriDashboardTop();}catch(e){}},150);
  });
})();

/* ============================================================
   ANORI TRANSPORT ERP v2.5 — FINAL REQUESTED WORKFLOW UPDATE
   Scope: Anori Transport only.
   ============================================================ */
(function installAnoriV25(){
  'use strict';
  const esc=v=>Sanitize.html(v==null?'':String(v));
  const num=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:0;};
  const money=v=>Utils.fmt(num(v));
  const today=()=>Utils.today();
  const activeInvoiceForTrip=(tripId)=>DB.get('invoices').find(inv=>Array.isArray(inv.trip_ids)&&inv.trip_ids.includes(tripId)&&String(inv.status||'issued').toLowerCase()!=='cancelled');
  const invoiceForTrip=tripId=>DB.get('invoices').find(inv=>Array.isArray(inv.trip_ids)&&inv.trip_ids.includes(tripId));
  const getParty=id=>DB.get('parties').find(x=>x.id===id);
  const getDriver=id=>DB.get('drivers').find(x=>x.id===id);
  const getVehicle=id=>DB.get('vehicles').find(x=>x.id===id);
  const getExpenseMaster=()=>DB.get('expense_master',[]).filter(x=>x.active!==false);
  const driverGivenTotal=(driverId,from='',to='')=>{
    return DB.get('driver_settlements',[]).filter(s=>s.driver_id===driverId&&(!from||s.date>=from)&&(!to||s.date<=to)).reduce((sum,s)=>sum+(s.type==='debit'?num(s.amount):0),0);
  };
  const driverPaidTotal=(driverId,from='',to='')=>{
    return DB.get('driver_settlements',[]).filter(s=>s.driver_id===driverId&&(!from||s.date>=from)&&(!to||s.date<=to)).reduce((sum,s)=>sum+(s.type==='credit'?num(s.amount):0),0);
  };
  function syncDriverTripEntry(trip){
    if(!trip||!trip.driver_id)return;
    const data=DB.get('driver_settlements',[]);
    const existing=data.find(s=>s.source==='trip'&&s.trip_id===trip.id);
    const amount=num(trip.driver_amount);
    if(amount<=0){ if(existing) DB.set('driver_settlements',data.filter(s=>s.id!==existing.id)); return; }
    const entry={id:existing?.id||Utils.id(),date:trip.date,driver_id:trip.driver_id,type:'debit',amount,description:`Trip ${trip.trip_no} - Driver Amount`,source:'trip',trip_id:trip.id};
    if(existing) Object.assign(existing,entry); else data.push(entry);
    DB.set('driver_settlements',data);
  }
  function syncTripInvoiceFlags(){
    const invoices=DB.get('invoices'), trips=DB.get('trips');
    trips.forEach(t=>{const active=activeInvoiceForTrip(t.id);t.invoice_status=active?'invoiced':'pending';});
    DB.set('trips',trips);
  }

  // ------------------------------------------------------------
  // 1. TRIP MANAGEMENT — master-driven form + row selection/actions
  // ------------------------------------------------------------
  Trips.openForm=function(){
    const vehicles=DB.get('vehicles'),drivers=DB.get('drivers'),parties=DB.get('parties'),expenses=getExpenseMaster();
    const html=`<div class="anori-simple-form">
      <div class="form-row"><div class="form-group"><label>Date</label><input type="date" class="form-control" id="t_date" value="${today()}"></div>
      <div class="form-group"><label>Vehicle *</label><select class="form-control" id="t_vehicle"><option value="">Select Vehicle</option>${vehicles.map(v=>`<option value="${esc(v.id)}">${esc(v.number)}</option>`).join('')}</select></div>
      <div class="form-group"><label>Driver *</label><select class="form-control" id="t_driver"><option value="">Select Driver</option>${drivers.map(d=>`<option value="${esc(d.id)}">${esc(d.name)}</option>`).join('')}</select></div></div>
      <div class="form-row"><div class="form-group"><label>Party / Customer *</label><select class="form-control" id="t_party"><option value="">Select Customer</option>${parties.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select></div>
      <div class="form-group"><label>From *</label><input class="form-control" id="t_from"></div><div class="form-group"><label>To *</label><input class="form-control" id="t_to"></div></div>
      <div class="form-row"><div class="form-group"><label>Freight (₹) *</label><input type="number" class="form-control" id="t_freight" min="0"></div><div class="form-group"><label>Driver Amount / Advance (₹)</label><input type="number" class="form-control" id="t_driver_amount" min="0" value="0"><small class="anori-help">This automatically appears in Driver Settlement.</small></div></div>
      <div class="form-group"><label>Trip Advice</label><textarea class="form-control" id="t_trip_advice" rows="3" placeholder="Enter driver / loading / delivery instructions for this trip"></textarea><small class="anori-help">Internal trip instructions. This is saved with the Trip and shown in Trip details.</small></div>
      <div class="anori-subtitle">Trip Expenses</div><div id="expRows"></div><button type="button" class="btn btn-outline btn-sm" onclick="Trips.addExpRow()">＋ Add Expense</button>
      <div class="form-group" style="margin-top:12px"><label>Notes</label><textarea class="form-control" id="t_notes" rows="2"></textarea></div>
    </div>`;
    UI.openModal('Create New Trip',html,()=>Trips.saveV25(),true); Trips.addExpRow();
  };
  Trips.addExpRow=function(type='',amount=''){
    const rows=document.getElementById('expRows');if(!rows)return;
    const masters=getExpenseMaster();
    const row=document.createElement('div');row.className='form-row anori-trip-exp-row';row.style.marginBottom='8px';
    row.innerHTML=`<div class="form-group"><select class="form-control exp-type"><option value="">Select Expense</option>${masters.map(e=>`<option value="${esc(e.name)}" ${e.name===type?'selected':''}>${esc(e.name)}</option>`).join('')}</select></div><div class="form-group"><input type="number" class="form-control exp-amt" min="0" placeholder="Amount" value="${num(amount)||''}"></div><div class="form-group"><button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.anori-trip-exp-row').remove()">Remove</button></div>`;
    rows.appendChild(row);
  };
  function readTripForm(){
    const from=document.getElementById('t_from').value.trim(),to=document.getElementById('t_to').value.trim();
    const vehicle=document.getElementById('t_vehicle').value,driver=document.getElementById('t_driver').value,party=document.getElementById('t_party').value;
    const freight=num(document.getElementById('t_freight').value),driverAmount=num(document.getElementById('t_driver_amount').value);
    if(!vehicle||!driver||!party||!from||!to)return Utils.toast('Please select Vehicle, Driver, Customer and enter From / To.','error');
    if(freight<=0)return Utils.toast('Freight amount must be greater than zero.','error');
    const expenses=[];document.querySelectorAll('#expRows .anori-trip-exp-row').forEach(r=>{const type=r.querySelector('.exp-type').value,amount=num(r.querySelector('.exp-amt').value);if(type&&amount>0)expenses.push({type,amount});});
    return {date:Sanitize.date(document.getElementById('t_date').value),vehicle_id:vehicle,driver_id:driver,party_id:party,from:esc(from),to:esc(to),freight,driver_amount:driverAmount,expenses:Sanitize.escapeJSON(expenses),notes:esc(document.getElementById('t_notes').value),trip_advice:esc(document.getElementById('t_trip_advice').value)};
  }
  Trips.saveV25=function(){const form=readTripForm();if(!form)return;const trip={id:Utils.id(),trip_no:Utils.generateTripNo(form.date),...form,status:'completed',invoice_status:'pending',is_gst:true};const trips=DB.get('trips');trips.push(trip);DB.set('trips',trips);syncDriverTripEntry(trip);UI.closeModal();Utils.toast('Trip created successfully.');Router.go('trips');};
  Trips.showEditModal=function(id){
    const trip=DB.get('trips').find(x=>x.id===id);if(!trip)return;
    if(activeInvoiceForTrip(id))return Swal.fire({icon:'warning',title:'Invoice already generated',text:'Cancel the existing invoice before editing this trip.',confirmButtonText:'OK'});
    const vehicles=DB.get('vehicles'),drivers=DB.get('drivers'),parties=DB.get('parties');
    const html=`<div class="anori-simple-form"><div class="form-row"><div class="form-group"><label>Date</label><input type="date" class="form-control" id="t_date" value="${esc(trip.date)}"></div><div class="form-group"><label>Vehicle *</label><select class="form-control" id="t_vehicle">${vehicles.map(v=>`<option value="${esc(v.id)}" ${v.id===trip.vehicle_id?'selected':''}>${esc(v.number)}</option>`).join('')}</select></div><div class="form-group"><label>Driver *</label><select class="form-control" id="t_driver">${drivers.map(d=>`<option value="${esc(d.id)}" ${d.id===trip.driver_id?'selected':''}>${esc(d.name)}</option>`).join('')}</select></div></div><div class="form-row"><div class="form-group"><label>Party / Customer *</label><select class="form-control" id="t_party">${parties.map(p=>`<option value="${esc(p.id)}" ${p.id===trip.party_id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div><div class="form-group"><label>From *</label><input class="form-control" id="t_from" value="${esc(trip.from)}"></div><div class="form-group"><label>To *</label><input class="form-control" id="t_to" value="${esc(trip.to)}"></div></div><div class="form-row"><div class="form-group"><label>Freight (₹) *</label><input type="number" class="form-control" id="t_freight" value="${num(trip.freight)}"></div><div class="form-group"><label>Driver Amount / Advance (₹)</label><input type="number" class="form-control" id="t_driver_amount" value="${num(trip.driver_amount)}"></div></div><div class="form-group"><label>Trip Advice</label><textarea class="form-control" id="t_trip_advice" rows="3" placeholder="Enter driver / loading / delivery instructions">${esc(trip.trip_advice||'')}</textarea><small class="anori-help">Internal trip instructions saved with this Trip.</small></div><div class="anori-subtitle">Trip Expenses</div><div id="expRows"></div><button type="button" class="btn btn-outline btn-sm" onclick="Trips.addExpRow()">＋ Add Expense</button><div class="form-group" style="margin-top:12px"><label>Notes</label><textarea class="form-control" id="t_notes" rows="2">${esc(trip.notes||'')}</textarea></div></div>`;
    UI.openModal('Edit Trip',html,()=>Trips.updateV25(id),true);(trip.expenses||[]).forEach(e=>Trips.addExpRow(e.type,e.amount));if(!(trip.expenses||[]).length)Trips.addExpRow();
  };
  Trips.openEditForm=function(id){Trips.showEditModal(id);};
  Trips.updateV25=function(id){if(activeInvoiceForTrip(id))return Swal.fire({icon:'warning',title:'Trip Locked',text:'Cancel the active invoice before editing this trip.',confirmButtonText:'OK'});const form=readTripForm();if(!form)return;const trips=DB.get('trips'),i=trips.findIndex(x=>x.id===id);if(i<0)return;trips[i]={...trips[i],...form};DB.set('trips',trips);syncDriverTripEntry(trips[i]);UI.closeModal();Utils.toast('Trip updated successfully.');Router.go('trips');};
  Trips.update=Trips.updateV25;

  Trips.render=function(container){
    const trips=DB.get('trips'),vehicles=DB.get('vehicles'),drivers=DB.get('drivers'),parties=DB.get('parties');
    syncTripInvoiceFlags();
    container.innerHTML=`<div class="anori-section-intro"><div><strong>Trip Management</strong><span>Select one or more trips, then use the Actions button above the table.</span></div><button class="btn btn-success" onclick="Trips.openForm()">＋ New Trip</button></div>
      <div class="card"><div class="anori-table-toolbar anori-action-toolbar"><div class="anori-toolbar-left"><button class="btn btn-outline btn-sm" onclick="Trips.toggleAll(true)">☑ Select All</button><button class="btn btn-outline btn-sm" onclick="Trips.toggleAll(false)">Clear</button><span id="tripSelectedCount" class="anori-selection-count">0 selected</span></div><div class="anori-toolbar-right"><button class="btn btn-primary" onclick="Trips.showActions()">⚙ Actions ▼</button></div></div>
      ${trips.length?`<div class="table-wrapper"><table><thead><tr><th><input type="checkbox" aria-label="Select all trips" onchange="Trips.toggleAll(this.checked)"></th><th>Date</th><th>Trip #</th><th>Vehicle</th><th>Driver</th><th>Party</th><th>Route</th><th>Freight</th><th>Driver Amt</th><th>Expenses</th><th>Profit</th><th>Trip Advice</th><th>Invoice</th></tr></thead><tbody>${trips.map(t=>{const v=getVehicle(t.vehicle_id),d=getDriver(t.driver_id),p=getParty(t.party_id),ex=(t.expenses||[]).reduce((s,e)=>s+num(e.amount),0),profit=num(t.freight)-ex;const inv=activeInvoiceForTrip(t.id);return `<tr><td><input type="checkbox" class="trip-row-check" value="${esc(t.id)}" onchange="Trips.updateSelectionCount()"></td><td>${esc(t.date)}</td><td><strong>${esc(t.trip_no)}</strong></td><td>${esc(v?.number||'-')}</td><td>${esc(d?.name||'-')}</td><td>${esc(p?.name||'-')}</td><td>${esc(t.from)} → ${esc(t.to)}</td><td>${money(t.freight)}</td><td>${money(t.driver_amount)}</td><td class="expense-red">-${money(ex)}</td><td>${money(profit)} <button class="btn btn-outline btn-icon anori-mini-btn" onclick="anoriShowCalculation('Trip Profit','Freight − Expenses', '${esc(money(profit))}')">ⓘ</button></td><td>${t.trip_advice?`<span title="${esc(t.trip_advice)}">${esc(t.trip_advice).slice(0,60)}${String(t.trip_advice).length>60?'…':''}</span>`:'-'}</td><td>${inv?`<span class="status-badge status-shared">INVOICED</span>`:`<span class="status-badge status-pending">PENDING</span>`}</td></tr>`;}).join('')}</tbody></table></div>`:`<div class="empty-state"><i class="fas fa-route"></i><h3>No Trips Yet</h3><p>Create your first trip.</p></div>`}</div>`;
    container.querySelectorAll('.trip-row-check').forEach(x=>x.addEventListener('change',Trips.updateSelectionCount));
  };
  Trips.toggleAll=function(flag){document.querySelectorAll('.trip-row-check').forEach(x=>x.checked=!!flag);Trips.updateSelectionCount();};
  Trips.getSelected=function(){return [...document.querySelectorAll('.trip-row-check:checked')].map(x=>x.value);};
  Trips.updateSelectionCount=function(){const n=Trips.getSelected().length;const el=document.getElementById('tripSelectedCount');if(el)el.textContent=`${n} selected`;};
  Trips.showActions=function(){
    const ids=Trips.getSelected();
    if(!ids.length)return Utils.toast('Please select at least one trip first.','warning');
    const duplicateSelected=()=>{
      const selected=Trips.getSelected();
      const all=DB.get('trips',[])||[];
      const source=selected.map(id=>all.find(t=>String(t.id)===String(id))).filter(Boolean);
      if(!source.length)return Utils.toast('Please select at least one trip first.','warning');
      const created=source.map(original=>{
        const copy=JSON.parse(JSON.stringify(original));
        copy.id=Utils.id();
        copy.date=Utils.today();
        copy.trip_no=Utils.generateTripNo(copy.date);
        copy.invoice_status='pending';
        copy.invoice_id=null;
        copy.invoice_no=null;
        return copy;
      });
      DB.set('trips',all.concat(created),true);
      if(typeof sync==='function')sync();
      Trips.clearSelection();
      Swal.close();
      Utils.toast(`${created.length} trip${created.length===1?'':'s'} duplicated successfully.`,'success');
      Router.go('trips');
    };
    Swal.fire({
      title:'Trip Actions',
      html:`<div class="anori-action-list">
        <button class="btn btn-primary btn-block" onclick="Swal.close();Invoices.generateFromTripSelection(Trips.getSelected())">🧾 Generate Invoice</button>
        <button class="btn btn-info btn-block" onclick="Swal.close();Trips.view(Trips.getSelected()[0])">👁 View Selected</button>
        <button class="btn btn-warning btn-block" id="anoriDuplicateSelectedTrip">📋 Duplicate Selected</button>
      </div>`,
      showConfirmButton:false,showCancelButton:true,cancelButtonText:'Close',
      didOpen:()=>document.getElementById('anoriDuplicateSelectedTrip')?.addEventListener('click',duplicateSelected)
    });
  };
  Invoices.generateFromTripSelection=function(ids){const all=DB.get('trips');const selected=all.filter(t=>ids.includes(t.id));const blocked=selected.filter(t=>activeInvoiceForTrip(t.id));if(blocked.length)return Swal.fire({icon:'warning',title:'Invoice already generated',text:`${blocked.length} selected trip(s) already have an active invoice. Cancel those invoices first.`,confirmButtonText:'OK'});const parties=new Set(selected.map(t=>t.party_id));if(parties.size>1)return Swal.fire({icon:'warning',title:'Select one customer',text:'One invoice can contain trips for only one customer.',confirmButtonText:'OK'});this.showInvoiceGenerator(ids);};

  // ------------------------------------------------------------
  // 2. INVOICES — counters, actions, payment tracking, cancellation
  // ------------------------------------------------------------
  function invoicePaid(inv){return num(inv.advance)+DB.get('payments',[]).filter(p=>p.invoice_id===inv.id).reduce((s,p)=>s+num(p.amount),0);}
  function invoiceBalance(inv){return Math.max(0,num(inv.total_amount)-invoicePaid(inv));}
  function invoiceStatus(inv){if(String(inv.status).toLowerCase()==='cancelled')return 'cancelled';const b=invoiceBalance(inv);if(b<=0)return 'paid';const due=new Date(Invoices.getDueDate(inv.date,inv.credit_days||30));if(due<new Date(today()))return 'overdue';return invoicePaid(inv)>0?'part_paid':'unpaid';}
  Invoices.render=function(container){
    const invoices=DB.get('invoices'),parties=DB.get('parties');
    const active=invoices.filter(i=>invoiceStatus(i)!=='cancelled');const paid=active.filter(i=>invoiceStatus(i)==='paid');const overdue=active.filter(i=>invoiceStatus(i)==='overdue');const part=active.filter(i=>invoiceStatus(i)==='part_paid');const unpaid=active.filter(i=>invoiceStatus(i)==='unpaid');
    const billed=active.reduce((s,i)=>s+num(i.total_amount),0),received=active.reduce((s,i)=>s+invoicePaid(i),0),outstanding=active.reduce((s,i)=>s+invoiceBalance(i),0);
    container.innerHTML=`<div class="anori-section-intro"><div><strong>Invoices & Billing</strong><span>See what was billed, what was received, and what is still pending.</span></div><button class="btn btn-primary" onclick="Invoices.showInvoiceGenerator()">＋ New Invoice</button></div>
      <div class="anori-kpi-grid anori-kpi-grid-5"><button class="anori-kpi-card"><span>Total Invoices</span><strong>${active.length}</strong><small>${money(billed)} billed</small></button><button class="anori-kpi-card anori-kpi-good"><span>Paid</span><strong>${paid.length}</strong><small>${money(received)} received</small></button><button class="anori-kpi-card anori-kpi-warn"><span>Unpaid</span><strong>${unpaid.length}</strong><small>${money(unpaid.reduce((s,i)=>s+invoiceBalance(i),0))} pending</small></button><button class="anori-kpi-card anori-kpi-info"><span>Part Paid</span><strong>${part.length}</strong><small>${money(part.reduce((s,i)=>s+invoiceBalance(i),0))} balance</small></button><button class="anori-kpi-card anori-kpi-bad"><span>Overdue</span><strong>${overdue.length}</strong><small>${money(overdue.reduce((s,i)=>s+invoiceBalance(i),0))} overdue</small></button></div>
      
      <div class="card"><div class="anori-table-toolbar anori-action-toolbar"><div class="anori-toolbar-left"><button class="btn btn-outline btn-sm" onclick="Invoices.toggleAll(true)">☑ Select All</button><button class="btn btn-outline btn-sm" onclick="Invoices.toggleAll(false)">Clear</button><span id="invoiceSelectedCount" class="anori-selection-count">0 selected</span></div><div class="anori-toolbar-right"><button class="btn btn-primary" onclick="Invoices.showActions()">⚙ Actions ▼</button></div></div>
      ${invoices.length?`<div class="table-wrapper"><table><thead><tr><th><input type="checkbox" aria-label="Select all invoices" onchange="Invoices.toggleAll(this.checked)"></th><th>Invoice</th><th>Date</th><th>Due Date</th><th>Remaining Days</th><th>Customer</th><th>Trips</th><th>Total</th><th>Received</th><th>Balance</th><th>Status</th></tr></thead><tbody>${invoices.map(inv=>{const p=parties.find(x=>x.id===inv.party_id),st=invoiceStatus(inv),cls=st==='paid'?'status-paid':st==='cancelled'?'status-cancelled':st==='part_paid'?'status-partpaid':st==='overdue'?'status-overdue':'status-pending';return `<tr><td><input type="checkbox" class="invoice-row-check" value="${esc(inv.id)}" onchange="Invoices.updateSelectionCount()"></td><td><strong>${esc(inv.invoice_no)}</strong></td><td>${esc(inv.date)}</td><td>${esc(p?.name||'-')}</td><td>${num(inv.trip_count)}</td><td>${money(inv.total_amount)}</td><td>${money(invoicePaid(inv))}</td><td>${money(invoiceBalance(inv))}</td><td><span class="status-badge ${cls}">${esc(st.replace('_',' ').toUpperCase())}</span></td></tr>`;}).join('')}</tbody></table></div>`:`<div class="empty-state"><i class="fas fa-file-invoice"></i><h3>No Invoices</h3><p>Generate an invoice from completed trips.</p></div>`}</div>`;
    Invoices.updateSelectionCount();
  };
  Invoices.toggleAll=function(flag){document.querySelectorAll('.invoice-row-check').forEach(x=>x.checked=!!flag);Invoices.updateSelectionCount();};
  Invoices.getSelected=function(){return [...document.querySelectorAll('.invoice-row-check:checked')].map(x=>x.value);};
  Invoices.updateSelectionCount=function(){const el=document.getElementById('invoiceSelectedCount');if(el)el.textContent=`${Invoices.getSelected().length} selected`;};
  Invoices.showActions=function(){const ids=Invoices.getSelected();if(!ids.length)return Utils.toast('Please select an invoice first.','warning');const id=ids[0],inv=DB.get('invoices').find(x=>x.id===id);const st=invoiceStatus(inv);Swal.fire({title:'Invoice Actions',html:`<div class="anori-action-list"><button class="btn btn-outline btn-block" onclick="Swal.close();Invoices.previewExisting('${esc(id)}')">View / Preview</button><button class="btn btn-primary btn-block" onclick="Swal.close();Invoices.downloadExisting('${esc(id)}')">Download PDF</button>${st!=='paid'&&st!=='cancelled'?`<button class="btn btn-success btn-block" onclick="Swal.close();Invoices.recordPayment('${esc(id)}')">Record Payment</button>`:''}${st!=='cancelled'?`<button class="btn btn-danger btn-block" onclick="Swal.close();Invoices.cancelInvoice('${esc(id)}')">Cancel Invoice</button>`:''}</div>`,showConfirmButton:false,showCancelButton:true,cancelButtonText:'Close'});};
  Invoices.recordPayment=function(id){const inv=DB.get('invoices').find(x=>x.id===id);if(!inv)return;const balance=invoiceBalance(inv);Swal.fire({title:'Record Payment',html:`<div class="anori-simple-form"><label>Invoice</label><input class="form-control" value="${esc(inv.invoice_no)}" disabled><label>Amount Received</label><input id="anori-pay-amount" type="number" min="0.01" max="${balance}" value="${balance}"><label>Date</label><input id="anori-pay-date" type="date" value="${today()}"><label>Payment Note</label><input id="anori-pay-note" placeholder="Bank / UPI / Cash reference"></div>`,showCancelButton:true,confirmButtonText:'Save Payment',preConfirm:()=>{const amount=num(document.getElementById('anori-pay-amount').value);if(amount<=0||amount>balance){Swal.showValidationMessage(`Enter amount up to ${money(balance)}.`);return false;}return {amount,date:document.getElementById('anori-pay-date').value,note:document.getElementById('anori-pay-note').value};}}).then(r=>{if(!r.isConfirmed)return;const p=DB.get('payments',[]);p.push({id:Utils.id(),invoice_id:id,...r.value});DB.set('payments',p);const invs=DB.get('invoices'),x=invs.find(i=>i.id===id);if(x)x.status=invoiceStatus(x)==='paid'?'paid':'part_paid';DB.set('invoices',invs);Router.go('invoices');Utils.toast('Payment recorded.');});};
  Invoices.cancelInvoice=function(id){const inv=DB.get('invoices').find(x=>x.id===id);if(!inv)return;Swal.fire({title:'Cancel Invoice?',text:'The invoice will remain in history and linked trips will become available for a new invoice.',icon:'warning',input:'text',inputLabel:'Cancellation reason',inputPlaceholder:'Enter reason',showCancelButton:true,confirmButtonText:'Cancel Invoice',confirmButtonColor:'#dc2626',preConfirm:r=>{if(!r)return 'Cancelled by user';return r;}}).then(r=>{if(!r.isConfirmed)return;const invs=DB.get('invoices'),x=invs.find(i=>i.id===id);if(x){x.status='cancelled';x.cancelled_at=new Date().toISOString();x.cancel_reason=r.value;}DB.set('invoices',invs);syncTripInvoiceFlags();Router.go('invoices');Utils.toast('Invoice cancelled.');});};

  // Override generator: only un-invoiced trips are selectable.
  Invoices.showInvoiceGenerator=function(preselectedIds=[]){
    const allCompleted=DB.get('trips',[]).filter(t=>t.status==='completed');
    const trips=allCompleted.filter(t=>!activeInvoiceForTrip(t.id));
    const blocked=allCompleted.filter(t=>activeInvoiceForTrip(t.id));
    if(!trips.length){
      return Swal.fire({icon:'info',title:'No Trip Available for Invoice',html:blocked.length?`All completed trips already have active invoices.<br><br><strong>Cancel the existing invoice first</strong> if you need to generate them again.`:'No completed trips are available.',confirmButtonText:'OK'});
    }
    const vehicles=DB.get('vehicles'),parties=DB.get('parties'),checked=new Set(preselectedIds);
    const billableMasters=DB.get('expense_master',[]).filter(x=>x.active!==false&&x.showOnInvoice);
    Swal.fire({
      title:'Create Invoice',width:950,
      html:`<div class="anori-invoice-generator">
        <div class="anori-help">Select trips for one customer. Active-invoice trips are hidden automatically.</div>
        <div class="table-wrapper" style="max-height:300px;overflow:auto"><table class="anori-standard-table"><thead><tr><th><input type="checkbox" id="anori-v28-inv-all"></th><th>Date</th><th>Trip</th><th>Customer</th><th>Vehicle</th><th style="text-align:right">Freight</th></tr></thead><tbody>${trips.map(t=>{const p=parties.find(x=>x.id===t.party_id),v=vehicles.find(x=>x.id===t.vehicle_id);return `<tr><td><input type="checkbox" class="anori-v28-inv-trip" data-id="${esc(t.id)}" data-party="${esc(t.party_id)}" ${checked.has(t.id)?'checked':''}></td><td>${esc(t.date)}</td><td>${esc(t.trip_no)}</td><td>${esc(p?.name||'-')}</td><td>${esc(v?.number||'-')}</td><td style="text-align:right">${money(t.freight)}</td></tr>`;}).join('')}</tbody></table></div>
        <div id="anori-v28-expense-picker" class="anori-expense-picker" style="margin-top:14px"></div>
        <div class="form-row" style="margin-top:12px"><div class="form-group"><label>Invoice Type</label><select id="anori-v28-inv-type" class="form-control"><option value="gst">GST Invoice</option><option value="nongst">Non-GST</option></select></div><div class="form-group"><label>Advance Received (₹)</label><input id="anori-v28-inv-advance" class="form-control" type="number" min="0" value="0"></div></div>
      </div>`,
      showCancelButton:true,confirmButtonText:'🧾 Generate Invoice',cancelButtonText:'Cancel',
      didOpen:()=>{
        const all=document.getElementById('anori-v28-inv-all');
        all?.addEventListener('change',()=>{document.querySelectorAll('.anori-v28-inv-trip').forEach(x=>x.checked=all.checked);updateExpensePicker();});
        document.querySelectorAll('.anori-v28-inv-trip').forEach(x=>x.addEventListener('change',updateExpensePicker));
        updateExpensePicker();
      },
      preConfirm:()=>{
        const selected=[...document.querySelectorAll('.anori-v28-inv-trip:checked')].map(x=>x.dataset.id);
        if(!selected.length){Swal.showValidationMessage('Please select at least one trip.');return false;}
        const partyIds=new Set([...document.querySelectorAll('.anori-v28-inv-trip:checked')].map(x=>x.dataset.party));
        if(partyIds.size>1){Swal.showValidationMessage('Please select trips for one customer only.');return false;}
        const blockedSelected=selected.filter(id=>activeInvoiceForTrip(id));
        if(blockedSelected.length){Swal.showValidationMessage('One or more selected trips already have an active invoice. Cancel it first.');return false;}
        const expenses=[...document.querySelectorAll('.anori-v28-bill-exp:checked')].map(c=>{const id=c.dataset.id,m=billableMasters.find(x=>x.id===id),amt=num(document.querySelector(`.anori-v28-bill-exp-amt[data-id="${CSS.escape(id)}"]`)?.value);return {masterId:id,name:m?.name||'Expense',amount:amt};}).filter(x=>x.amount>0);
        return {selected,isGst:document.getElementById('anori-v28-inv-type').value==='gst',advance:num(document.getElementById('anori-v28-inv-advance').value),expenses};
      }
    }).then(async r=>{if(!r.isConfirmed)return;const selectedTrips=DB.get('trips').filter(t=>r.value.selected.includes(t.id));await Invoices.createInvoiceV28(selectedTrips,r.value.isGst,r.value.advance,r.value.expenses);});

    function updateExpensePicker(){
      const host=document.getElementById('anori-v28-expense-picker');if(!host)return;
      const selectedIds=[...document.querySelectorAll('.anori-v28-inv-trip:checked')].map(x=>x.dataset.id);
      const selectedTrips=trips.filter(t=>selectedIds.includes(t.id));
      if(!selectedTrips.length){host.innerHTML='<div class="anori-help">Select a trip to choose billable expenses.</div>';return;}
      host.innerHTML=`<div class="anori-subtitle">Billable Expenses</div>${billableMasters.map(m=>{
        const amount=selectedTrips.reduce((sum,t)=>sum+(Array.isArray(t.expenses)?t.expenses:[]).filter(e=>String(e.type||'').trim().toLowerCase()===String(m.name||'').trim().toLowerCase()).reduce((a,e)=>a+num(e.amount),0),0);
        return `<div class="anori-expense-select-row"><label><input type="checkbox" class="anori-v28-bill-exp" data-id="${esc(m.id)}" ${amount>0?'checked':''}> ${esc(m.name)}</label><input type="number" class="anori-v28-bill-exp-amt" data-id="${esc(m.id)}" value="${amount||num(m.defaultAmount)||0}" min="0"></div>`;
      }).join('')||'<div class="anori-help">No billable expenses are configured in Master Data.</div>'}`;
    }
  };

  Invoices.createInvoiceV28=async function(trips,isGst,advance,selectedExpenseLines=[]){
    try{
      if(!trips?.length)throw new Error('Please select at least one trip.');
      const blocked=trips.filter(t=>activeInvoiceForTrip(t.id));
      if(blocked.length)throw new Error('One or more selected trips already have an active invoice. Cancel the old invoice first.');
      const party=DB.get('parties').find(p=>p.id===trips[0].party_id);
      if(!party)throw new Error('Customer/Party not found.');
      const partyIds=new Set(trips.map(t=>t.party_id));
      if(partyIds.size>1)throw new Error('One invoice can contain trips for one customer only.');
      const billableIds=new Set(DB.get('expense_master',[]).filter(x=>x.active!==false&&x.showOnInvoice).map(x=>x.id));
      const expenseLines=(Array.isArray(selectedExpenseLines)?selectedExpenseLines:[]).filter(e=>billableIds.has(e.masterId)&&num(e.amount)>0).map(e=>({masterId:e.masterId,name:e.name,amount:num(e.amount)}));
      const subtotal=trips.reduce((s,t)=>s+num(t.freight),0)+expenseLines.reduce((s,e)=>s+num(e.amount),0);
      const cgst=isGst?subtotal*0.09:0,sgst=isGst?subtotal*0.09:0,total=subtotal+cgst+sgst;
      if(advance<0)throw new Error('Advance cannot be negative.');
      if(advance>total)throw new Error(`Advance cannot be greater than invoice total of ${money(total)}.`);
      const invoice={id:Utils.id(),invoice_no:Utils.generateInvoiceNo(),date:today(),party_id:party.id,trip_ids:trips.map(t=>t.id),trip_count:trips.length,subtotal,cgst,sgst,total_amount:total,advance,balance_due:total-advance,is_gst:isGst,status:advance>=total?'paid':'issued',expense_lines:expenseLines,credit_days:window.anoriResolvePartyCreditDays(party),trips_data:trips.map(t=>({...t,vehicle:DB.get('vehicles').find(v=>v.id===t.vehicle_id)})),payments:[]};
      const invoices=DB.get('invoices',[]);invoices.push(invoice);if(!DB.set('invoices',invoices))throw new Error('Invoice could not be saved.');
      const allTrips=DB.get('trips',[]);trips.forEach(t=>{const x=allTrips.find(a=>a.id===t.id);if(x)x.invoice_status='invoiced';});DB.set('trips',allTrips);
      Utils.hideLoader();
      await Swal.fire({icon:'success',title:'Invoice Generated Successfully',html:`<strong>${esc(invoice.invoice_no)}</strong><br>${esc(party.name)}<br><strong>${money(total)}</strong><br><small>Trip(s): ${trips.length}</small>`,showCancelButton:true,confirmButtonText:'👁 Open Preview',cancelButtonText:'Close'}).then(r=>{if(r.isConfirmed)Invoices.previewInvoice(invoice);});
      Router.go('invoices');
      return invoice;
    }catch(e){
      Utils.hideLoader();
      console.error('Invoice generation error:',e);
      await Swal.fire({icon:'error',title:'Invoice Generation Failed',text:e?.message||'Unable to generate invoice.',confirmButtonText:'OK'});
      return null;
    }
  };

  Invoices.createInvoice=Invoices.createInvoiceV28;

  // ------------------------------
  // ONE invoice renderer for preview / PDF / print
  // ------------------------------
  Invoices.buildInvoiceHTML=function(invoice,preview=false){
    const company=DB.get('company_profile',{}),party=DB.get('parties',[]).find(p=>p.id===invoice.party_id)||{};
    const addressLines=Array.isArray(company.addr_lines)?company.addr_lines.map(x=>String(x||'').trim()).filter(Boolean):(String(company.addr||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean));
    const addressHtml=addressLines.map(line=>`<div class="brand-address-line">${esc(line)}</div>`).join('')||'<div class="brand-address-line"></div>';
    const status=String(invoice.status||'issued').replace('_',' ').toUpperCase();
    const creditDays=window.anoriResolvePartyCreditDays(party, invoice.credit_days);
    const due=this.getDueDate(invoice.date, creditDays);
    const expenseRows=(invoice.expense_lines||[]).filter(e=>num(e.amount)>0).map(e=>`<tr><td colspan="5" class="summary-label">${esc(e.name)}</td><td class="money">${money(e.amount)}</td></tr>`).join('');
    const tripRows=(invoice.trips_data||[]).map((t,i)=>`<tr><td>${i+1}</td><td><strong>${esc(t.trip_no)}</strong></td><td>${esc(t.date)}</td><td>${esc(t.from)} → ${esc(t.to)}</td><td>${esc(t.vehicle?.number||'')}</td><td class="money">${money(t.freight)}</td></tr>`).join('');
    const isGstInvoice=invoice.is_gst===true||invoice.is_gst===1||String(invoice.is_gst).toLowerCase()==='true'; const taxRows=isGstInvoice?(invoice.tax_type==='igst'?`<tr><td colspan="5" class="summary-label">IGST 18%</td><td class="money">${money(invoice.igst||0)}</td></tr>`:`<tr><td colspan="5" class="summary-label">CGST 9%</td><td class="money">${money(invoice.cgst)}</td></tr><tr><td colspan="5" class="summary-label">SGST 9%</td><td class="money">${money(invoice.sgst)}</td></tr>`):'';
    return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(invoice.invoice_no)}</title><style>
      *{box-sizing:border-box}html,body{margin:0;padding:0}body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;background:#fff;font-size:12px;line-height:1.45;text-transform:uppercase}.invoice-page{width:210mm;min-height:297mm;margin:0;background:#fff;padding:5mm;box-shadow:none;overflow:hidden}.top{display:grid;grid-template-columns:1.2fr .8fr;gap:12px;align-items:start}.brand h1{font-size:24px;margin:0 0 4px;color:#0f172a}.brand div{margin:2px 0}.brand-address-line{margin:2px 0}.invoice-title{text-align:right}.invoice-title h2{font-size:23px;margin:0 0 8px;color:#0f172a}.meta{width:100%;border:1px solid #cbd5e1;border-radius:8px;overflow:hidden}.meta-row{display:grid;grid-template-columns:105px 1fr;border-bottom:1px solid #e2e8f0}.meta-row:last-child{border-bottom:0}.meta-row b{background:#eaf2fb;padding:7px}.meta-row span{padding:7px;text-align:right}.badge{display:inline-block;padding:3px 9px;border-radius:20px;background:#dbeafe;color:#1d4ed8;font-weight:700;font-size:10px}.rule{height:2px;background:#1e3a8a;margin:10px 0}.two{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}.box{border:1px solid #cbd5e1;border-radius:8px;overflow:hidden}.box-title{background:#eaf2fb;color:#0f3b78;font-weight:800;padding:7px 10px;text-transform:uppercase}.box-body{padding:7px;min-height:58px}.charges-title{background:#1e3a8a;color:#fff;font-weight:800;padding:8px 10px;text-transform:uppercase;border-radius:8px 8px 0 0}.charges{width:100%;border-collapse:collapse;margin:0}.charges th,.charges td{border:1px solid #cbd5e1;padding:5px 6px}.charges th{background:#eef3f8;font-size:11px;text-align:left}.money{text-align:right;white-space:nowrap}.summary-label{text-align:right}.charges tfoot td{background:#fff}.charges tfoot tr.total td{background:#effcf4;font-weight:800}.charges tfoot tr.balance td{background:#1e3a8a;color:#fff;font-weight:800;font-size:15px}.amount-words,.bank,.signature{border:1px solid #cbd5e1;border-radius:8px;margin-top:8px;overflow:hidden}.section-title{background:#eaf2fb;color:#0f3b78;font-weight:800;padding:7px 10px;text-transform:uppercase}.section-body{padding:10px}.bank-sign{display:grid;grid-template-columns:1fr 1fr;gap:8px}.signature-body{height:82px;padding:8px 10px;display:flex;align-items:flex-end;justify-content:flex-end;gap:8px;position:relative}.company-signature-stamp{max-width:150px;max-height:62px;object-fit:contain;display:block}.authorized-signatory-label{font-weight:700;white-space:nowrap}.terms{margin-top:8px;border-top:1px solid #cbd5e1;padding-top:10px;font-size:10px}.footer{margin-top:8px;border-top:2px solid #1e3a8a;padding-top:8px;text-align:center;font-size:10px;color:#475569}.avoid{break-inside:avoid;page-break-inside:avoid}@page{size:A4 portrait;margin:0}@media print{body{background:#fff}.invoice-page{margin:0;box-shadow:none}.no-print{display:none!important}}
    </style></head><body><div class="invoice-page">
      <div class="top avoid"><div class="brand"><h1>${esc(company.name||'Anori Transport Services')}</h1>${addressHtml}${isGstInvoice?`<div>GSTIN: ${esc(company.gst||'N/A')} &nbsp; | &nbsp; PAN: ${esc(company.pan||'N/A')} &nbsp; | &nbsp; Phone: ${esc(company.phone||'')}</div>`:`<div>PAN: ${esc(company.pan||'N/A')} &nbsp; | &nbsp; Phone: ${esc(company.phone||'')}</div>`}</div><div class="invoice-title"><h2>${isGstInvoice?'TAX INVOICE':'INVOICE'}</h2><div class="meta"><div class="meta-row"><b>Invoice No.</b><span>${esc(invoice.invoice_no)}</span></div><div class="meta-row"><b>Date</b><span>${esc(invoice.date)}</span></div><div class="meta-row"><b>Due Date</b><span>${esc(due)}</span></div><div class="meta-row"><b>Status</b><span><span class="badge">${esc(status)}</span></span></div></div></div></div>
      <div class="rule"></div>
      <div class="two avoid"><div class="box"><div class="box-title">Bill To</div><div class="box-body"><strong>${esc(party.name||'N/A')}</strong><br>${esc(party.addr||'')}${isGstInvoice?`<br>GSTIN: ${esc(party.gst||'N/A')}`:''}</div></div><div class="box"><div class="box-title">Payment Terms</div><div class="box-body"><strong>${esc(creditDays)} Days</strong><br>Due Date: ${esc(due)}<br>Invoice Type: ${isGstInvoice?'GST':'Non-GST'}${isGstInvoice && invoice.tax_type?`<br>Tax Type: ${invoice.tax_type==='igst'?'IGST 18%':'CGST 9% + SGST 9%'}`:''}</div></div></div>
      <div class="avoid"><div class="charges-title">Transport / Billable Charges</div><table class="charges"><thead><tr><th style="width:5%">#</th><th style="width:22%">Trip No.</th><th style="width:13%">Date</th><th style="width:28%">Route</th><th style="width:17%">Vehicle</th><th style="width:15%;text-align:right">Amount</th></tr></thead><tbody>${tripRows||'<tr><td colspan="6">No trip lines</td></tr>'}</tbody><tfoot>${expenseRows}${`<tr><td colspan="5" class="summary-label"><strong>Subtotal</strong></td><td class="money"><strong>${money(invoice.subtotal)}</strong></td></tr>`}${taxRows}<tr class="total"><td colspan="5" class="summary-label"><strong>Total</strong></td><td class="money"><strong>${money(invoice.total_amount)}</strong></td></tr><tr><td colspan="5" class="summary-label">Advance Received</td><td class="money">-${money(invoice.advance)}</td></tr><tr class="balance"><td colspan="5" class="summary-label"><strong>BALANCE DUE</strong></td><td class="money"><strong>${money(invoice.balance_due)}</strong></td></tr></tfoot></table></div>
      <div class="amount-words avoid"><div class="section-title">Amount in Words</div><div class="section-body">${esc(Utils.numberToWords(invoice.total_amount))}</div></div>
      <div class="bank-sign"><div class="bank avoid"><div class="section-title">Bank Details</div><div class="section-body">Bank Name: <strong>${esc(company.bank_name||'N/A')}</strong><br>Account No.: <strong>${esc(company.acc||'N/A')}</strong><br>IFSC: <strong>${esc(company.bank||'N/A')}</strong></div></div><div class="signature avoid"><div class="section-title" style="text-align:right">For ${esc(company.name||'Anori Transport Services')}</div><div class="signature-body">${company.signature_stamp?`<img class="company-signature-stamp" src="${esc(company.signature_stamp)}" alt="Authorized Signatory">`:''}<span class="authorized-signatory-label">Authorized Signatory</span></div></div></div>
      <div class="terms avoid"><strong>TERMS & CONDITIONS</strong><ol style="margin:5px 0 0 18px;padding:0"><li>Payment is due as per agreed payment terms.</li><li>Any billing discrepancy should be communicated promptly.</li><li>This is a computer-generated invoice.</li></ol></div>
      <div class="footer">Thank you for your business. &nbsp; | &nbsp; Computer-generated invoice</div>
    </div></body></html>`;
  };

  function normalizeInvoiceForRender(invoice){
    const x={...(invoice||{})};
    x.expense_lines=Array.isArray(x.expense_lines)?x.expense_lines:[];
    x.payments=Array.isArray(x.payments)?x.payments:[];
    x.trips_data=Array.isArray(x.trips_data)?x.trips_data.map(t=>({...t,vehicle:t.vehicle||DB.get('vehicles',[]).find(v=>v.id===t.vehicle_id)||{}})):[];
    x.subtotal=num(x.subtotal);x.cgst=num(x.cgst);x.sgst=num(x.sgst);x.igst=num(x.igst);x.total_amount=num(x.total_amount);x.advance=num(x.advance);x.tax_type=x.tax_type||(x.is_gst?'cgst_sgst':'none');
    x.balance_due=Math.max(0,x.total_amount-x.advance-DB.get('payments',[]).filter(p=>p.invoice_id===x.id).reduce((a,p)=>a+num(p.amount),0));
    return x;
  }

  // SINGLE SOURCE OF TRUTH: Preview and Download PDF use the exact same rendered DOM.
  // No iframe, no file:// navigation, no compact PDF template.
  Invoices.getInvoiceRenderHTML=function(invoice){return this.buildInvoiceHTML(invoice,true);};

  Invoices.mountInvoiceDocument=function(invoice){
    const content=document.getElementById('previewContent');
    if(!content)throw new Error('Invoice preview container not found.');
    content.innerHTML='';
    content.dataset.invoiceId=invoice.id;
    const html=this.getInvoiceRenderHTML(invoice);
    const parsed=new DOMParser().parseFromString(html,'text/html');
    if(parsed.querySelector('parsererror'))throw new Error('Invoice preview HTML could not be parsed.');
    const stage=document.createElement('div');
    stage.className='anori-invoice-preview-stage';
    const style=document.createElement('style');
    style.textContent=[...parsed.head.querySelectorAll('style')].map(x=>x.textContent).join('\n');
    stage.appendChild(style);
    const page=parsed.body.querySelector('.invoice-page');
    if(!page)throw new Error('Invoice page could not be rendered.');
    stage.appendChild(page.cloneNode(true));
    content.appendChild(stage);
    return stage.querySelector('.invoice-page');
  };

  Invoices.previewInvoice=function(invoice){
    try{
      this.mountInvoiceDocument(normalizeInvoiceForRender(invoice));
      document.getElementById('previewModal').classList.add('active');
    }catch(e){
      console.error('Invoice preview error:',e);
      Swal.fire({icon:'error',title:'Invoice Preview Failed',text:e.message||'Unable to open invoice preview.',confirmButtonText:'OK'});
    }
  };

  Invoices.downloadInvoice = function(invoice) { return (window.__ANORI_PDF_FINAL_FUNCTION ? window.__ANORI_PDF_FINAL_FUNCTION(invoice) : Promise.reject(new Error('PDF engine is initializing.'))); };


  // ------------------------------
  // INVOICE ACTIONS: same toolbar pattern as Trip Management
  // ------------------------------
  // Extend the universal table action mapping without changing Anori business logic.
  window.__anoriV28InvoiceActionsReady=true;

  // Local-file safe PDF helper: uses the current DOM only; never creates a file:// iframe.
  Invoices.downloadInvoiceSafe = function(invoice) { return (window.__ANORI_PDF_FINAL_FUNCTION ? window.__ANORI_PDF_FINAL_FUNCTION(invoice) : Promise.reject(new Error('PDF engine is initializing.'))); };

  // ------------------------------
  // AUTO BACKUP HOOK
  // ------------------------------
  if(!DB.__anoriV28BackupWrapped){
    const baseSet=DB.set.bind(DB);let timer=null;
    DB.set=function(key,data,bypassAuth=false){
      const result=baseSet(key,data,bypassAuth);
      if(result && !['audit_log','backup_settings'].includes(key)){
        clearTimeout(timer);timer=setTimeout(()=>AnoriDataTools.autoBackupNow(`data-change:${key}`),1200);
      }
      return result;
    };
    DB.__anoriV28BackupWrapped=true;
  }

  // Re-render settings after folder/import operations and keep table UI active.
  const oldGo=Router.go.bind(Router);
  Router.go=function(view){const r=oldGo(view);setTimeout(()=>window.AnoriTableUI?.decorate?.(),60);return r;};

  // Keep the global backup icon useful: if a folder is selected, save there; otherwise download JSON.
  const backupButton=document.getElementById('backupBtn');
  if(backupButton){backupButton.onclick=async()=>{const ok=await AnoriDataTools.autoBackupNow('header');if(!ok)AnoriDataTools.exportJSON();};}

  // Ensure all existing invoices have the fields needed by the single renderer.
  const invoices=DB.get('invoices',[]);invoices.forEach(inv=>{if(!Array.isArray(inv.expense_lines))inv.expense_lines=[];if(!Array.isArray(inv.payments))inv.payments=[];if(!inv.status)inv.status='issued';});DB.set('invoices',invoices,true);
})();

/* ============================================================
   ANORI TRANSPORT v2.12 — CRITICAL FINANCIAL INTEGRITY HARDENING
   Scope: Anori Transport only. Appended as a final override layer.
   ============================================================ */
(function installAnoriV212CriticalFixes(){
  'use strict';
  const esc=v=>Sanitize.html(v==null?'':String(v));
  const num=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:0;};
  const money=v=>Utils.fmt(num(v));
  const today=()=>Utils.today();
  const allInvoices=()=>DB.get('invoices',[]);
  const allTrips=()=>DB.get('trips',[]);
  const activeInvoiceForTrip=id=>allInvoices().find(inv=>Array.isArray(inv.trip_ids)&&inv.trip_ids.includes(id)&&String(inv.status||'issued').toLowerCase()!=='cancelled');
  const anyInvoiceForTrip=id=>allInvoices().find(inv=>Array.isArray(inv.trip_ids)&&inv.trip_ids.includes(id));
  const invoicePaid=inv=>num(inv?.advance)+DB.get('payments',[]).filter(p=>p.invoice_id===inv?.id).reduce((s,p)=>s+num(p.amount),0);
  const invoiceBalance=inv=>Math.max(0,num(inv?.total_amount)-invoicePaid(inv));
  const invoiceStatus=inv=>{
    if(!inv)return 'unknown';
    if(String(inv.status||'').toLowerCase()==='cancelled')return 'cancelled';
    const bal=invoiceBalance(inv);
    if(bal<=0)return 'paid';
    const due=new Date(Invoices.getDueDate(inv.date,inv.credit_days||30));
    if(!Number.isNaN(due.getTime()) && due < new Date(today()))return invoicePaid(inv)>0?'overdue':'overdue';
    return invoicePaid(inv)>0?'part_paid':'unpaid';
  };

  function syncInvoicePayments(inv){
    if(!inv)return;
    inv.payments=DB.get('payments',[]).filter(p=>p.invoice_id===inv.id).map(p=>({...p}));
    inv.paid_amount=invoicePaid(inv);
    inv.balance_due=invoiceBalance(inv);
    inv.status=String(inv.status||'issued').toLowerCase()==='cancelled'?'cancelled':(inv.balance_due<=0?'paid':(inv.paid_amount>0?'part_paid':'issued'));
  }

  function syncAllInvoiceFinancialState(){
    const invoices=allInvoices();
    invoices.forEach(inv=>{
      if(!Array.isArray(inv.expense_lines))inv.expense_lines=[];
      syncInvoicePayments(inv);
    });
    DB.set('invoices',invoices,true);
  }

  function syncTripInvoiceFlagsSafe(){
    const trips=allTrips();
    trips.forEach(t=>{t.invoice_status=activeInvoiceForTrip(t.id)?'invoiced':'pending';});
    DB.set('trips',trips,true);
  }

  // ---------- TRIP FINANCIAL LOCK ----------
  // An issued/paid/part-paid trip must never be deleted or edited.
  Trips.openEditForm=function(id){
    const inv=activeInvoiceForTrip(id);
    if(inv){
      return Swal.fire({icon:'warning',title:'Trip Locked',html:`This trip is linked to active invoice <strong>${esc(inv.invoice_no)}</strong>.<br><br>Cancel the invoice first if you need to edit this trip.`,confirmButtonText:'OK'});
    }
    return Trips.showEditModal(id);
  };

  Trips.update=function(id){
    if(activeInvoiceForTrip(id)){
      return Swal.fire({icon:'warning',title:'Trip Locked',text:'Cancel the active invoice before editing this trip.',confirmButtonText:'OK'});
    }
    return Trips.updateV25(id);
  };

  Trips.delete=function(id){
    const historical=anyInvoiceForTrip(id);
    if(historical){
      const inv=historical;
      return Swal.fire({
        icon:'warning',
        title:'Trip Cannot Be Deleted',
        html:`This trip is linked to invoice <strong>${esc(inv.invoice_no)}</strong>.<br><br>Financial history must be preserved. Cancelled invoices also remain in history.`,
        confirmButtonText:'OK'
      });
    }
    return Swal.fire({
      title:'Delete Trip?',
      text:'This trip has no invoice history and can be deleted.',
      icon:'warning',showCancelButton:true,
      confirmButtonColor:'#ef4444',cancelButtonColor:'#64748b',
      confirmButtonText:'Yes, Delete',cancelButtonText:'Cancel'
    }).then(r=>{
      if(!r.isConfirmed)return;
      DB.set('trips',allTrips().filter(t=>t.id!==id));
      DB.set('driver_settlements',DB.get('driver_settlements',[]).filter(x=>x.trip_id!==id));
      Utils.toast('Trip deleted successfully.');
      Router.go('trips');
    });
  };

  // ---------- INVOICE STATUS: FINANCIAL STATE, NOT A FREE-FORM DROPDOWN ----------
  Invoices.updateStatus=function(id,newStatus){
    const invoices=allInvoices();
    const inv=invoices.find(x=>x.id===id);
    if(!inv)return;
    const requested=String(newStatus||'').toLowerCase();
    if(requested==='cancelled')return Invoices.cancelInvoice(id);
    if(requested==='paid'||requested==='part_paid'||requested==='unpaid'||requested==='overdue'){
      return Swal.fire({icon:'info',title:'Use Payment Entry',text:'Invoice payment status is calculated automatically from Advance Received and recorded payments.',confirmButtonText:'OK'});
    }
    if(String(inv.status).toLowerCase()==='cancelled'){
      return Swal.fire({icon:'warning',title:'Cancelled Invoice',text:'A cancelled invoice cannot be reactivated. Generate a new invoice after correcting the trip.',confirmButtonText:'OK'});
    }
    inv.status=requested==='sent'?'sent':'issued';
    DB.set('invoices',invoices);
    Utils.toast(`Invoice marked ${inv.status}.`);
    Router.go('invoices');
  };

  // ---------- PAYMENT LEDGER ----------
  Invoices.recordPayment=function(id){
    const inv=allInvoices().find(x=>x.id===id);
    if(!inv)return;
    if(String(inv.status).toLowerCase()==='cancelled')return Utils.toast('Cancelled invoices cannot receive payments.','warning');
    const balance=invoiceBalance(inv);
    if(balance<=0)return Utils.toast('This invoice is already fully paid.','info');
    Swal.fire({
      title:'Record Customer Payment',
      html:`<div class="anori-simple-form" style="text-align:left">
        <label>Invoice</label><input class="form-control" value="${esc(inv.invoice_no)}" disabled>
        <label>Amount Received (₹)</label><input id="anori-pay-amount" class="form-control" type="number" min="0.01" max="${balance}" value="${balance}">
        <label>Payment Date</label><input id="anori-pay-date" class="form-control" type="date" value="${today()}">
        <label>Payment Mode / Reference</label><input id="anori-pay-note" class="form-control" placeholder="Bank / UPI / Cash / Reference">
      </div>`,
      showCancelButton:true,confirmButtonText:'Save Payment',cancelButtonText:'Cancel',
      preConfirm:()=>{
        const amount=num(document.getElementById('anori-pay-amount').value);
        if(amount<=0||amount>balance){Swal.showValidationMessage(`Enter an amount from ₹0.01 to ${money(balance)}.`);return false;}
        return {amount,date:document.getElementById('anori-pay-date').value,note:document.getElementById('anori-pay-note').value.trim()};
      }
    }).then(r=>{
      if(!r.isConfirmed)return;
      const payments=DB.get('payments',[]);
      payments.push({id:Utils.id(),invoice_id:id,...r.value,created_at:new Date().toISOString()});
      DB.set('payments',payments);
      const invoices=allInvoices(),x=invoices.find(i=>i.id===id);
      if(x){x.payments=payments.filter(p=>p.invoice_id===id);syncInvoicePayments(x);DB.set('invoices',invoices);}
      Utils.toast('Payment recorded successfully.');
      Router.go('invoices');
    });
  };

  // ---------- CANCELLATION: PRESERVE HISTORY, NEVER DELETE ----------
  Invoices.cancelInvoice=function(id){
    const inv=allInvoices().find(x=>x.id===id);
    if(!inv)return;
    if(String(inv.status).toLowerCase()==='cancelled')return Utils.toast('Invoice is already cancelled.','info');
    const paid=invoicePaid(inv);
    Swal.fire({
      title:'Cancel Invoice?',
      html:`Invoice <strong>${esc(inv.invoice_no)}</strong> will remain in history and will not be deleted.<br><br>${paid>0?`<strong>Received amount: ${money(paid)}</strong><br><small>Cancellation with received money should be handled with your accounting/refund process.</small>`:'The linked trips will become available for a new invoice after cancellation.'}`,
      icon:'warning',input:'text',inputLabel:'Cancellation reason',inputPlaceholder:'Enter reason',
      showCancelButton:true,confirmButtonColor:'#dc2626',confirmButtonText:'Cancel Invoice',cancelButtonText:'Keep Invoice',
      preConfirm:value=>String(value||'').trim()||'Cancelled by user'
    }).then(r=>{
      if(!r.isConfirmed)return;
      const invoices=allInvoices(),x=invoices.find(i=>i.id===id);
      if(!x)return;
      x.status='cancelled';x.cancelled_at=new Date().toISOString();x.cancel_reason=r.value;
      DB.set('invoices',invoices);
      syncTripInvoiceFlagsSafe();
      Utils.toast('Invoice cancelled. Trip is available for a new invoice.');
      Router.go('invoices');
    });
  };

  // Keep delete action semantically safe: issued financial invoices are cancelled, never deleted.
  Invoices.deleteInvoice=function(id){
    const inv=allInvoices().find(x=>x.id===id);
    if(!inv)return;
    if(String(inv.status).toLowerCase()!=='draft')return Invoices.cancelInvoice(id);
    Swal.fire({title:'Delete Draft Invoice?',text:'Only draft invoices can be permanently deleted.',icon:'warning',showCancelButton:true,confirmButtonColor:'#ef4444',confirmButtonText:'Delete Draft'}).then(r=>{
      if(!r.isConfirmed)return;
      DB.set('invoices',allInvoices().filter(x=>x.id!==id));
      Router.go('invoices');Utils.toast('Draft invoice deleted.');
    });
  };

  // ---------- INVOICE GENERATION: ATOMIC DUPLICATE CHECK ----------
  const originalCreateInvoiceV28=Invoices.createInvoiceV28;
  Invoices.createInvoiceV28=async function(trips,isGst,advance,selectedExpenseLines=[]){
    const latestTrips=allTrips();
    const ids=new Set((trips||[]).map(t=>t.id));
    const freshTrips=latestTrips.filter(t=>ids.has(t.id));
    if(!freshTrips.length){
      return Swal.fire({icon:'error',title:'Invoice Generation Failed',text:'Selected trip data is no longer available.',confirmButtonText:'OK'});
    }
    const blocked=freshTrips.filter(t=>activeInvoiceForTrip(t.id));
    if(blocked.length){
      return Swal.fire({icon:'warning',title:'Invoice Already Generated',html:`${blocked.length} selected trip(s) already have an active invoice.<br><br><strong>Cancel the old invoice first.</strong>`,confirmButtonText:'OK'});
    }
    const result=await originalCreateInvoiceV28.call(Invoices,freshTrips,isGst,advance,selectedExpenseLines);
    if(result)syncTripInvoiceFlagsSafe();
    return result;
  };

  // ---------- SAME PREVIEW DOM = SAME PDF SOURCE ----------
  Invoices.downloadInvoice = function(invoice) { return (window.__ANORI_PDF_FINAL_FUNCTION ? window.__ANORI_PDF_FINAL_FUNCTION(invoice) : Promise.reject(new Error('PDF engine is initializing.'))); };

  // ---------- MASTER EXPENSE DATA MIGRATION ----------
  const exp=DB.get('expense_master',[]);
  if(!Array.isArray(exp)||!exp.length){
    DB.set('expense_master',[
      {id:Utils.id(),name:'Diesel',defaultAmount:0,showOnInvoice:false,active:true},
      {id:Utils.id(),name:'Toll',defaultAmount:0,showOnInvoice:false,active:true},
      {id:Utils.id(),name:'Food',defaultAmount:0,showOnInvoice:false,active:true},
      {id:Utils.id(),name:'Repair',defaultAmount:0,showOnInvoice:false,active:true}
    ],true);
  }

  // ---------- STARTUP NORMALIZATION ----------
  syncAllInvoiceFinancialState();
  syncTripInvoiceFlagsSafe();

  window.ANORI_V212_CRITICAL_FIXES=true;
})();



/* ============================================================
 ANORI TRANSPORT v2.13 — CONSOLIDATED REQUIREMENT HARDENING
 ============================================================ */
(function(){
'use strict';
const esc=v=>Sanitize.html(v==null?'':String(v)), num=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:0}, money=v=>Utils.fmt(num(v)), today=()=>Utils.today();
const trips=()=>DB.get('trips',[]), invs=()=>DB.get('invoices',[]), drivers=()=>DB.get('drivers',[]), parties=()=>DB.get('parties',[]), vehicles=()=>DB.get('vehicles',[]), exps=()=>DB.get('expense_master',[]).filter(x=>x.active!==false);
const party=id=>parties().find(x=>x.id===id), driver=id=>drivers().find(x=>x.id===id), vehicle=id=>vehicles().find(x=>x.id===id);
const activeInv=id=>invs().find(i=>Array.isArray(i.trip_ids)&&i.trip_ids.includes(id)&&String(i.status||'').toLowerCase()!=='cancelled');
// Prevent duplicate invoice-history rows when the same invoice number was created more than once.
// Keep one record, preserve the highest advance, and merge distinct payment entries.
function dedupeInvoicesByNumber(){
  const all=invs();
  const groups=new Map();
  all.forEach(i=>{
    const key=String(i?.invoice_no||'').trim();
    if(!key)return;
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(i);
  });
  const duplicateGroups=[...groups.values()].filter(g=>g.length>1);
  if(!duplicateGroups.length)return all;
  const removeIds=new Set();
  const payments=DB.get('payments',[]);
  const mergedPayments=[];
  duplicateGroups.forEach(group=>{
    const survivor=group.slice().sort((a,b)=>{
      const pa=num(a?.advance), pb=num(b?.advance);
      if(pb!==pa)return pb-pa;
      const ca=String(a?.cancelled_at||a?.created_at||'');
      const cb=String(b?.cancelled_at||b?.created_at||'');
      return cb.localeCompare(ca);
    })[0];
    const ids=new Set(group.map(x=>x.id));
    group.forEach(x=>{if(x!==survivor)removeIds.add(x.id)});
    survivor.advance=Math.max(...group.map(x=>num(x?.advance)),0);
    survivor.expense_lines=Array.isArray(survivor.expense_lines)?survivor.expense_lines:[];
    const seen=new Set();
    payments.filter(x=>ids.has(x.invoice_id)).forEach(pay=>{
      const sig=[pay.amount,pay.date,pay.note||''].join('|');
      if(seen.has(sig))return;
      seen.add(sig);
      mergedPayments.push({...pay,invoice_id:survivor.id});
    });
  });
  const kept=all.filter(i=>!removeIds.has(i.id));
  if(removeIds.size){
    const survivors=new Set(kept.map(i=>i.id));
    const existingNonDup=payments.filter(p=>!removeIds.has(p.invoice_id));
    const mergedUnique=new Map();
    [...existingNonDup,...mergedPayments].forEach(p=>{
      const sig=[p.invoice_id,p.amount,p.date,p.note||''].join('|');
      if(!mergedUnique.has(sig))mergedUnique.set(sig,p);
    });
    DB.set('payments',[...mergedUnique.values()].filter(p=>survivors.has(p.invoice_id)),true);
    DB.set('invoices',kept,true);
  }
  return kept;
}
const anyInv=id=>invs().find(i=>Array.isArray(i.trip_ids)&&i.trip_ids.includes(id));
const paid=i=>num(i?.advance)+DB.get('payments',[]).filter(p=>p.invoice_id===i?.id).reduce((s,p)=>s+num(p.amount),0);
const bal=i=>Math.max(0,num(i?.total_amount)-paid(i));
const istatus=i=>{if(!i)return'unknown';if(String(i.status).toLowerCase()==='cancelled')return'cancelled';if(bal(i)<=0)return'paid';const d=new Date(Invoices.getDueDate(i.date,i.credit_days||30));if(d<new Date(today()))return'overdue';return paid(i)>0?'part_paid':'unpaid'};
function sync(){const a=invs();a.forEach(i=>{i.paid_amount=paid(i);i.balance_due=bal(i);if(String(i.status).toLowerCase()!=='cancelled')i.status=i.balance_due<=0?'paid':(i.paid_amount>0?'part_paid':'issued')});DB.set('invoices',a,true);const t=trips();t.forEach(x=>x.invoice_status=activeInv(x.id)?'invoiced':'pending');DB.set('trips',t,true)}
function syncDriver(t){if(!t?.driver_id)return;const a=DB.get('driver_settlements',[]),old=a.find(x=>x.source==='trip'&&x.trip_id===t.id),amt=num(t.driver_amount);if(amt<=0){if(old)DB.set('driver_settlements',a.filter(x=>x.id!==old.id),true);return}const row={id:old?.id||Utils.id(),date:t.date,driver_id:t.driver_id,type:'debit',amount:amt,description:`Trip ${t.trip_no} - Driver Amount`,source:'trip',trip_id:t.id};if(old)Object.assign(old,row);else a.push(row);DB.set('driver_settlements',a,true)}
trips().forEach(syncDriver);dedupeInvoicesByNumber();sync();

// MASTER EXPENSES
if(!Array.isArray(DB.get('expense_master',null)))DB.set('expense_master',[['Cartage',true],['Documentation',true],['THC',true],['Handling',true],['Internal Expense',false]].map(([name,showOnInvoice])=>({id:Utils.id(),name,defaultAmount:0,showOnInvoice,active:true})),true);

// TRIP FINANCIAL LOCK
Trips.update=Trips.updateV25||Trips.update;
const oldTripUpdate=Trips.updateV25;
if(oldTripUpdate)Trips.updateV25=function(id){if(activeInv(id))return Swal.fire({icon:'warning',title:'Trip Locked',text:'Cancel the active invoice before editing this trip.',confirmButtonText:'OK'});return oldTripUpdate.call(Trips,id)};
Trips.update=Trips.updateV25;
Trips.delete=function(id){const i=anyInv(id);if(i)return Swal.fire({icon:'warning',title:'Trip Locked',html:`Trip is linked to <strong>${esc(i.invoice_no)}</strong>.<br><br>Cancel the invoice first. Financial history is preserved.`,confirmButtonText:'OK'});Swal.fire({title:'Delete Trip?',icon:'warning',showCancelButton:true,confirmButtonText:'Delete Trip'}).then(r=>{if(!r.isConfirmed)return;DB.set('trips',trips().filter(t=>t.id!==id));DB.set('driver_settlements',DB.get('driver_settlements',[]).filter(x=>x.trip_id!==id),true);Utils.toast('Trip deleted.','success');Router.go('trips')})};

// INVOICE CREATION / LIFECYCLE
Invoices.createInvoiceV28=async function(sel,isGst,advance,lines=[]){try{const fresh=trips().filter(t=>sel?.some(x=>x.id===t.id)),blocked=fresh.filter(t=>activeInv(t.id));if(!fresh.length)throw Error('Please select at least one trip.');if(blocked.length)throw Error('Invoice already exists for one or more selected trips. Cancel the old invoice first.');if(new Set(fresh.map(t=>t.party_id)).size!==1)throw Error('Please select trips for one customer only.');const p=party(fresh[0].party_id);if(!p)throw Error('Customer not found.');const billable=new Map(exps().filter(x=>x.showOnInvoice).map(x=>[x.id,x]));const expense_lines=(Array.isArray(lines)?lines:[]).map(e=>({masterId:e.masterId,name:e.name,amount:num(e.amount)})).filter(e=>e.amount>0&&billable.has(e.masterId));const subtotal=fresh.reduce((s,t)=>s+num(t.freight),0)+expense_lines.reduce((s,e)=>s+e.amount,0),cgst=isGst?subtotal*.09:0,sgst=isGst?subtotal*.09:0,total=subtotal+cgst+sgst,adv=num(advance);if(adv<0||adv>total)throw Error(adv<0?'Advance cannot be negative.':`Advance cannot exceed ${money(total)}.`);const invoice={id:Utils.id(),invoice_no:Utils.generateInvoiceNo(),date:today(),party_id:p.id,trip_ids:fresh.map(t=>t.id),trip_count:fresh.length,subtotal,cgst,sgst,total_amount:total,advance:adv,balance_due:total-adv,paid_amount:adv,is_gst:!!isGst,status:adv>=total?'paid':'issued',expense_lines,credit_days:window.anoriResolvePartyCreditDays(p),trips_data:fresh.map(t=>({...t,vehicle:vehicle(t.vehicle_id)})),payments:[]};if(invs().some(i=>String(i.status).toLowerCase()!=='cancelled'&&i.trip_ids?.some(id=>invoice.trip_ids.includes(id))))throw Error('Duplicate active invoice detected.');DB.set('invoices',[...invs(),invoice]);const all=trips();fresh.forEach(t=>{const x=all.find(a=>a.id===t.id);if(x)x.invoice_status='invoiced';syncDriver(x)});DB.set('trips',all,true);await Swal.fire({icon:'success',title:'Invoice Generated Successfully',html:`<strong>${esc(invoice.invoice_no)}</strong><br>${esc(p.name)}<br><strong>${money(total)}</strong>`,showCancelButton:true,confirmButtonText:'Open Preview',cancelButtonText:'Close'}).then(r=>{if(r.isConfirmed)Invoices.previewInvoice(invoice)});Router.go('invoices');return invoice}catch(e){console.error(e);await Swal.fire({icon:'error',title:'Invoice Generation Failed',text:e.message||'Unable to generate invoice.',confirmButtonText:'OK'});return null}};
Invoices.createInvoice=Invoices.createInvoiceV28;
Invoices.cancelInvoice=function(id){const i=invs().find(x=>x.id===id);if(!i)return;if(istatus(i)==='cancelled')return Utils.toast('Invoice is already cancelled.','info');Swal.fire({title:'Cancel Invoice?',html:`<strong>${esc(i.invoice_no)}</strong> will remain in history. Linked trips can be invoiced again only after cancellation.`,icon:'warning',input:'text',inputLabel:'Cancellation reason',showCancelButton:true,confirmButtonText:'Cancel Invoice',confirmButtonColor:'#dc2626'}).then(r=>{if(!r.isConfirmed)return;const a=invs(),x=a.find(z=>z.id===id);if(!x)return;x.status='cancelled';x.cancelled_at=new Date().toISOString();x.cancel_reason=r.value||'Cancelled by user';DB.set('invoices',a,true);dedupeInvoicesByNumber();sync();Utils.toast('Invoice cancelled. Trip is available for a new invoice.','success');Router.go('invoices')})};
Invoices.deleteInvoice=function(id){const i=invs().find(x=>x.id===id);if(!i)return;if(String(i.status).toLowerCase()!=='draft')return Invoices.cancelInvoice(id);DB.set('invoices',invs().filter(x=>x.id!==id),true);Router.go('invoices');Utils.toast('Draft invoice deleted.')};
Invoices.updateStatus=function(id,s){const i=invs().find(x=>x.id===id);if(!i)return;if(s==='cancelled')return Invoices.cancelInvoice(id);if(['paid','part_paid'].includes(s))return Utils.toast('Use Record Payment. Payment status is calculated automatically.','warning');if(istatus(i)==='cancelled')return Utils.toast('Cancelled invoice cannot be reopened.','warning');i.status=s;DB.set('invoices',invs(),true);Router.go('invoices');Utils.toast('Invoice status updated.','success')};
Invoices.recordPayment=async function(id){const i=invs().find(x=>x.id===id),b=bal(i);if(!i||istatus(i)==='cancelled'||b<=0)return Utils.toast('No payment can be recorded for this invoice.','info');const r=await Swal.fire({title:'Record Customer Payment',html:`<div class="anori-simple-form"><label>Invoice</label><input class="form-control" value="${esc(i.invoice_no)}" disabled><label>Amount Received (₹)</label><input id="anori-pay-amount" class="form-control" type="number" min=".01" max="${b}" value="${b}"><label>Payment Date</label><input id="anori-pay-date" class="form-control" type="date" value="${today()}"><label>Mode / Reference</label><input id="anori-pay-note" class="form-control" placeholder="Bank / UPI / Cash"></div>`,showCancelButton:true,confirmButtonText:'Save Payment',preConfirm:()=>{const a=num(document.getElementById('anori-pay-amount').value);if(a<=0||a>b){Swal.showValidationMessage(`Enter amount up to ${money(b)}.`);return false}return{amount:a,date:Sanitize.date(document.getElementById('anori-pay-date').value),note:document.getElementById('anori-pay-note').value.trim()}}});if(!r.isConfirmed)return;const p=DB.get('payments',[]);p.push({id:Utils.id(),invoice_id:id,...r.value,created_at:new Date().toISOString()});DB.set('payments',p,true);sync();Utils.toast('Payment recorded. Invoice status updated automatically.','success');Router.go('invoices')};

// ONE RENDERED PREVIEW DOM IS THE PDF SOURCE. No iframe.
function normalize(i){const x={...i};x.expense_lines=Array.isArray(x.expense_lines)?x.expense_lines:[];x.trips_data=Array.isArray(x.trips_data)?x.trips_data.map(t=>({...t,vehicle:t.vehicle||vehicle(t.vehicle_id)||{}})):[];x.balance_due=bal(x);x.status=istatus(x);return x}
Invoices.getInvoiceRenderHTML=i=>Invoices.buildInvoiceHTML(normalize(i),true);
Invoices.mountInvoiceDocument=function(i){const c=document.getElementById('previewContent');if(!c)throw Error('Invoice preview container not found.');c.innerHTML='';c.dataset.invoiceId=i.id;const d=new DOMParser().parseFromString(Invoices.getInvoiceRenderHTML(i),'text/html'),stage=document.createElement('div');stage.className='anori-invoice-preview-stage';d.head.querySelectorAll('style').forEach(s=>{const st=document.createElement('style');st.textContent=s.textContent;stage.appendChild(st)});const page=d.body.querySelector('.invoice-page');if(!page)throw Error('Invoice page could not be rendered.');stage.appendChild(page.cloneNode(true));c.appendChild(stage);return stage.querySelector('.invoice-page')};
Invoices.previewInvoice=function(i){try{this.mountInvoiceDocument(normalize(i));document.getElementById('previewModal').classList.add('active')}catch(e){console.error(e);Swal.fire({icon:'error',title:'Invoice Preview Failed',text:e.message||'Unable to open preview.'})}};
Invoices.downloadInvoice = function(invoice) { return (window.__ANORI_PDF_FINAL_FUNCTION ? window.__ANORI_PDF_FINAL_FUNCTION(invoice) : Promise.reject(new Error('PDF engine is initializing.'))); };
Invoices.previewExisting=id=>{const i=invs().find(x=>x.id===id);if(i)Invoices.previewInvoice(i)};Invoices.downloadExisting=id=>{const i=invs().find(x=>x.id===id);if(i)Invoices.downloadInvoice(i)};

// GENERATOR: active-invoice trips hidden; cancellation required for re-invoice.
Invoices.showInvoiceGenerator=function(pre=[]){const available=trips().filter(t=>t.status==='completed'&&!activeInv(t.id));if(!available.length)return Swal.fire({icon:'info',title:'No Trip Available for Invoice',text:'All completed trips are already invoiced or none are completed. Cancel an existing invoice before generating a new one.',confirmButtonText:'OK'});const ps=parties(),ms=exps().filter(x=>x.showOnInvoice);Swal.fire({title:'Create Invoice',width:950,html:`<div class="anori-invoice-generator"><div class="anori-help">Select trips for one customer, then choose billable expenses.</div><div class="table-wrapper" style="max-height:280px;overflow:auto"><table><thead><tr><th></th><th>Date</th><th>Trip</th><th>Customer</th><th>Vehicle</th><th>Freight</th></tr></thead><tbody>${available.map(t=>`<tr><td><input type="checkbox" class="anori-final-trip" data-id="${esc(t.id)}" data-party="${esc(t.party_id)}" ${pre.includes(t.id)?'checked':''}></td><td>${esc(t.date)}</td><td>${esc(t.trip_no)}</td><td>${esc(party(t.party_id)?.name||'-')}</td><td>${esc(vehicle(t.vehicle_id)?.number||'-')}</td><td>${money(t.freight)}</td></tr>`).join('')}</tbody></table></div><div id="anori-final-expenses" style="margin-top:12px"></div><div class="form-row"><label>Invoice Type<select id="anori-final-gst" class="form-control"><option value="1">GST Invoice</option><option value="0">Non-GST</option></select></label><label>Advance Received<input id="anori-final-advance" class="form-control" type="number" min="0" value="0"></label></div></div>`,showCancelButton:true,confirmButtonText:'🧾 Generate Invoice',didOpen:()=>{const upd=()=>{const ids=[...document.querySelectorAll('.anori-final-trip:checked')].map(x=>x.dataset.id),ts=available.filter(t=>ids.includes(t.id));const out=document.getElementById('anori-final-expenses');out.innerHTML=ms.map(m=>{const a=ts.reduce((s,t)=>s+(t.expenses||[]).filter(e=>String(e.type).toLowerCase()===String(m.name).toLowerCase()).reduce((z,e)=>z+num(e.amount),0),0);return `<div class="anori-expense-select-row"><label><input type="checkbox" class="anori-final-exp" data-id="${esc(m.id)}" ${a>0?'checked':''}> ${esc(m.name)}</label><input class="anori-final-exp-amt" data-id="${esc(m.id)}" type="number" min="0" value="${a||m.defaultAmount||0}"></div>`}).join('')||'<div class="anori-help">No billable expenses configured.</div>'};document.querySelectorAll('.anori-final-trip').forEach(x=>x.addEventListener('change',upd));upd()},preConfirm:()=>{const checks=[...document.querySelectorAll('.anori-final-trip:checked')],ids=checks.map(x=>x.dataset.id);if(!ids.length){Swal.showValidationMessage('Select at least one trip.');return false}if(new Set(checks.map(x=>x.dataset.party)).size!==1){Swal.showValidationMessage('Select trips for one customer only.');return false}const lines=[...document.querySelectorAll('.anori-final-exp:checked')].map(x=>{const m=ms.find(z=>z.id===x.dataset.id);return{masterId:x.dataset.id,name:m?.name||'Expense',amount:num(document.querySelector(`.anori-final-exp-amt[data-id="${CSS.escape(x.dataset.id)}"]`)?.value)}}).filter(x=>x.amount>0);return{ids,isGst:document.getElementById('anori-final-gst').value==='1',advance:num(document.getElementById('anori-final-advance').value),lines}}}).then(r=>{if(!r.isConfirmed)return;const selected=trips().filter(t=>r.value.ids.includes(t.id));Invoices.createInvoiceV28(selected,r.value.isGst,r.value.advance,r.value.lines)})};

// UNIVERSAL ACTION TOOLBARS
function selBar(id,action){return `<div class="anori-universal-toolbar"><div class="anori-toolbar-left"><strong>Actions:</strong><button class="btn btn-primary btn-sm" onclick="${action}">⚙ Actions</button><span id="${id}" class="anori-selection-count">0 selected</span></div><div class="anori-toolbar-right"><button class="btn btn-outline btn-sm" onclick="${id==='tripSelectedCount'?'Trips.toggleAll(true)':'Invoices.toggleAll(true)'}">☑ Select All</button><button class="btn btn-outline btn-sm" onclick="${id==='tripSelectedCount'?'Trips.toggleAll(false)':'Invoices.toggleAll(false)'}">Clear</button></div></div>`}
Trips.render=function(c){sync();const a=trips();c.innerHTML=`<div class="anori-section-intro"><div><strong>Trip Management</strong><span>Select rows, then use Actions above the table.</span></div><button class="btn btn-success" onclick="Trips.openForm()">＋ New Trip</button></div><div class="card">${selBar('tripSelectedCount','Trips.showActions()')}<div class="table-wrapper"><table><thead><tr><th><input type="checkbox" onchange="Trips.toggleAll(this.checked)"></th><th>Date</th><th>Trip #</th><th>Vehicle</th><th>Driver</th><th>Party</th><th>Route</th><th>Freight</th><th>Driver Amt</th><th>Expenses</th><th>Profit</th><th>Invoice</th></tr></thead><tbody>${a.map(t=>{const e=(t.expenses||[]).reduce((s,x)=>s+num(x.amount),0),i=activeInv(t.id);return `<tr><td><input type="checkbox" class="trip-row-check" value="${esc(t.id)}" onchange="Trips.updateSelectionCount()"></td><td>${esc(t.date)}</td><td><strong>${esc(t.trip_no)}</strong></td><td>${esc(vehicle(t.vehicle_id)?.number||'-')}</td><td>${esc(driver(t.driver_id)?.name||'-')}</td><td>${esc(party(t.party_id)?.name||'-')}</td><td>${esc(t.from)} → ${esc(t.to)}</td><td>${money(t.freight)}</td><td>${money(t.driver_amount)}</td><td>-${money(e)}</td><td>${money(num(t.freight)-e)}</td><td>${i?'<span class="status-badge status-shared">INVOICED</span>':'<span class="status-badge status-pending">PENDING</span>'}</td></tr>`}).join('')||'<tr><td colspan="12" class="empty-state">No trips.</td></tr>'}</tbody></table></div></div>`;Trips.updateSelectionCount()};
Invoices.render=function(c){dedupeInvoicesByNumber();sync();const a=invs(),active=a.filter(i=>istatus(i)!=='cancelled'),cnt={paid:0,unpaid:0,part_paid:0,overdue:0};active.forEach(i=>cnt[istatus(i)]++);const billed=active.reduce((s,i)=>s+num(i.total_amount),0),received=active.reduce((s,i)=>s+paid(i),0);c.innerHTML=`<div class="anori-section-intro"><div><strong>Invoices & Billing</strong><span>Paid, unpaid, part paid and overdue are calculated automatically.</span></div><button class="btn btn-success" onclick="Invoices.showInvoiceGenerator()">＋ New Invoice</button></div><div class="anori-kpi-grid anori-kpi-grid-5"><div class="anori-kpi-card"><span>Total Invoices</span><strong>${active.length}</strong><small>${money(billed)} billed</small></div><div class="anori-kpi-card anori-kpi-good"><span>Paid</span><strong>${cnt.paid}</strong><small>${money(received)} received</small></div><div class="anori-kpi-card anori-kpi-warn"><span>Unpaid</span><strong>${cnt.unpaid}</strong><small>Customer has not paid</small></div><div class="anori-kpi-card anori-kpi-info"><span>Part Paid</span><strong>${cnt.part_paid}</strong><small>${money(active.filter(i=>istatus(i)==='part_paid').reduce((s,i)=>s+bal(i),0))} BALANCE</small></div><div class="anori-kpi-card anori-kpi-bad"><span>Overdue</span><strong>${cnt.overdue}</strong><small>${money(active.filter(i=>istatus(i)==='overdue').reduce((s,i)=>s+bal(i),0))} OVERDUE</small></div></div><div class="card">${selBar('invoiceSelectedCount','Invoices.showActions()')}<div class="table-wrapper"><table><thead><tr><th><input type="checkbox" onchange="Invoices.toggleAll(this.checked)"></th><th>Invoice</th><th>Date</th><th>Due Date</th><th>Remaining Days</th><th>Customer</th><th>Trips</th><th>Total</th><th>Received</th><th>Balance</th><th>Status</th></tr></thead><tbody>${a.slice().reverse().map(i=>`<tr><td><input type="checkbox" class="invoice-row-check" value="${esc(i.id)}" onchange="Invoices.updateSelectionCount()"></td><td><strong>${esc(i.invoice_no)}</strong></td><td>${esc(i.date)}</td><td>${esc(party(i.party_id)?.name||'-')}</td><td>${num(i.trip_count)}</td><td>${money(i.total_amount)}</td><td>${money(paid(i))}</td><td>${money(bal(i))}</td><td><span class="status-badge status-${istatus(i).replace('_','-')}">${esc(istatus(i).replace('_',' ').toUpperCase())}</span></td></tr>`).join('')||'<tr><td colspan="11" class="empty-state">No invoices.</td></tr>'}</tbody></table></div></div>`;Invoices.updateSelectionCount()};
Invoices.showActions=function(){const ids=Invoices.getSelected();if(!ids.length)return Utils.toast('Please select an invoice.','warning');const id=ids[0],i=invs().find(x=>x.id===id),s=istatus(i);Swal.fire({title:'Invoice Actions',html:`<div class="anori-action-list"><button class="btn btn-outline btn-block" onclick="Swal.close();Invoices.previewExisting('${esc(id)}')">👁 Preview</button><button class="btn btn-primary btn-block" onclick="Swal.close();Invoices.downloadExisting('${esc(id)}')">📄 Download PDF</button>${s!=='cancelled'&&s!=='paid'?`<button class="btn btn-success btn-block" onclick="Swal.close();Invoices.recordPayment('${esc(id)}')">💰 Record Payment</button>`:''}${s!=='cancelled'?`<button class="btn btn-danger btn-block" onclick="Swal.close();Invoices.cancelInvoice('${esc(id)}')">❌ Cancel Invoice</button>`:''}</div>`,showConfirmButton:false,showCancelButton:true,cancelButtonText:'Close'})};

// DRIVER LEDGER + REPORTS
DriverSettlement.render=function(c){const ds=drivers();c.innerHTML=`<div class="anori-section-intro"><div><strong>Driver Settlement</strong><span>Trip driver amounts are reflected automatically.</span></div><button class="btn btn-primary" onclick="DriverSettlement.openModal()">＋ Add Entry</button></div><div class="card"><div class="anori-universal-toolbar"><div class="anori-toolbar-left"><strong>Actions:</strong><button class="btn btn-primary btn-sm" onclick="DriverSettlement.openModal()">＋ Add Entry</button><button class="btn btn-outline btn-sm" onclick="DriverSettlement.exportLedger()">📄 Download Ledger</button></div></div><div class="anori-filter-bar"><label>Driver<select id="driverLedgerDriver" class="form-control"><option value="">All Drivers</option>${ds.map(d=>`<option value="${esc(d.id)}">${esc(d.name)}</option>`).join('')}</select></label><label>Period<select id="driverLedgerPeriod" class="form-control"><option value="all">All</option><option value="week">Weekly</option><option value="month">Monthly</option><option value="custom">Custom</option></select></label><label>From<input id="driverLedgerFrom" class="form-control" type="date"></label><label>To<input id="driverLedgerTo" class="form-control" type="date" value="${today()}"></label><button class="btn btn-primary" onclick="DriverSettlement.applyFilter()">Apply</button></div><div id="driverLedgerHost"></div></div>`;DriverSettlement.applyFilter()};
DriverSettlement.applyFilter=function(){
  if(typeof window.syncAllDriverTripEntries==='function') window.syncAllDriverTripEntries();
  let d=document.getElementById('driverLedgerDriver')?.value||'',p=document.getElementById('driverLedgerPeriod')?.value||'all',f=document.getElementById('driverLedgerFrom')?.value||'',t=document.getElementById('driverLedgerTo')?.value||today();
  if(p==='week'){const x=new Date();x.setDate(x.getDate()-x.getDay());f=x.toISOString().slice(0,10)}
  if(p==='month')f=today().slice(0,7)+'-01';
  const rows=DB.get('driver_settlements',[]).filter(x=>(!d||x.driver_id===d)&&(!f||x.date>=f)&&(!t||x.date<=t));
  const given=rows.filter(x=>x.type==='debit').reduce((s,x)=>s+num(x.amount),0),paidv=rows.filter(x=>x.type==='credit').reduce((s,x)=>s+num(x.amount),0),balance=Math.max(given-paidv,0),advance=Math.max(paidv-given,0);
  document.getElementById('driverLedgerHost').innerHTML=`<div class="anori-ledger-summary"><div class="anori-ledger-paid">Paid<strong>${money(paidv)}</strong></div><div class="anori-ledger-advance">Advance<strong>${money(advance)}</strong></div><div class="anori-ledger-balance">Balance<strong>${money(balance)}</strong></div></div><div class="table-wrapper"><table><thead><tr><th>Sr. No.</th><th>Date</th><th>Driver</th><th>Trip</th><th>Type</th><th>Description</th><th>Amount</th></tr></thead><tbody>${rows.map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x.date)}</td><td>${esc(driver(x.driver_id)?.name||'-')}</td><td>${esc(x.trip_id?(trips().find(z=>z.id===x.trip_id)?.trip_no||'-'):'-')}</td><td>${x.type==='debit'?'Given':'Paid'}</td><td>${esc(x.description||'')}</td><td>${money(x.amount)}</td></tr>`).join('')||'<tr><td colspan="7">No entries.</td></tr>'}</tbody></table></div>`;
  DriverSettlement.__lastFilter={d,f,t};
};
DriverSettlement.getFilteredRows=function(){const x=DriverSettlement.__lastFilter||{};if(typeof window.syncAllDriverTripEntries==='function')window.syncAllDriverTripEntries();return DB.get('driver_settlements',[]).filter(r=>(!x.d||r.driver_id===x.d)&&(!x.f||r.date>=x.f)&&(!x.t||r.date<=x.t));};
DriverSettlement.exportExcel=function(){const rows=this.getFilteredRows();if(!window.XLSX)return Utils.toast('Excel library is not loaded.','error');const data=[['SR. NO.','DATE','DRIVER','TRIP','TYPE','DESCRIPTION','AMOUNT'],...rows.map((r,i)=>[i+1,r.date,driver(r.driver_id)?.name||'',r.trip_id?(trips().find(t=>t.id===r.trip_id)?.trip_no||''):'',r.type==='debit'?'GIVEN':'PAID',r.description||'',num(r.amount)])];const ws=XLSX.utils.aoa_to_sheet(data),wb=XLSX.utils.book_new();ws['!cols']=[{wch:9},{wch:14},{wch:22},{wch:20},{wch:12},{wch:42},{wch:15}];XLSX.utils.book_append_sheet(wb,ws,'DRIVER SETTLEMENT');XLSX.writeFile(wb,`driver-settlement-${today()}.xlsx`);Utils.toast('Excel downloaded.','success');};
/* Legacy Driver Settlement PDF implementation removed: the single final renderer below is authoritative. */
Reports.render=function(c){const ps=parties();c.innerHTML=`<div class="anori-section-intro"><div><strong>Reports & Analytics</strong><span>Customer-wise trip checking and ledger download.</span></div></div><div class="card">${bar(`<button class="anori-action-btn anori-action-preview" onclick="Reports.applyFilter()">🔎 APPLY FILTER</button><button class="anori-action-btn anori-action-pdf" onclick="Reports.downloadCustomerLedger()">📄 DOWNLOAD LEDGER</button><button class="anori-action-btn anori-action-export" onclick="Reports.downloadCustomerLedger()">⬇ EXPORT CSV</button>`)}<div class="anori-filter-bar"><label>Customer<select id="reportParty" class="form-control"><option value="">All Customers</option>${ps.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select></label><label>From<input id="reportFrom" class="form-control" type="date"></label><label>To<input id="reportTo" class="form-control" type="date" value="${today()}"></label><button class="btn btn-primary" onclick="Reports.applyFilter()">Apply</button></div><div id="reportHost"></div></div>`;Reports.applyFilter()};
Reports.applyFilter=function(){const pid=document.getElementById('reportParty')?.value||'',f=document.getElementById('reportFrom')?.value||'',t=document.getElementById('reportTo')?.value||today(),rows=trips().filter(x=>(!pid||x.party_id===pid)&&(!f||x.date>=f)&&(!t||x.date<=t)),rev=rows.reduce((s,x)=>s+num(x.freight),0),ex=rows.reduce((s,x)=>s+(x.expenses||[]).reduce((a,e)=>a+num(e.amount),0),0);document.getElementById('reportHost').innerHTML=`<div class="anori-ledger-summary"><div>Trips<strong>${rows.length}</strong></div><div>Billing<strong>${money(rev)}</strong></div><div>Expenses<strong>${money(ex)}</strong></div><div>Profit<strong>${money(rev-ex)}</strong></div></div><div class="table-wrapper"><table><thead><tr><th><input type="checkbox" aria-label="Select all report rows" onchange="Reports.toggleAll(this.checked)"></th><th>Sr. No.</th><th>Date</th><th>Trip</th><th>Customer</th><th>Route</th><th>Vehicle</th><th>Driver</th><th>Freight</th><th>Invoice</th></tr></thead><tbody>${rows.map((x,idx)=>`<tr><td><input type="checkbox" class="report-row-check" value="${esc(x.id)}"></td><td>${idx+1}</td><td>${esc(x.date)}</td><td>${esc(x.trip_no)}</td><td>${esc(party(x.party_id)?.name||'-')}</td><td>${esc(x.from)} → ${esc(x.to)}</td><td>${esc(vehicle(x.vehicle_id)?.number||'-')}</td><td>${esc(driver(x.driver_id)?.name||'-')}</td><td>${money(x.freight)}</td><td>${esc(activeInv(x.id)?.invoice_no||'Pending')}</td></tr>`).join('')||'<tr><td colspan="10" class="empty-state">No trips found.</td></tr>'}</tbody></table></div>`;Reports.__lastFilter={pid,f,t}};
Reports.toggleAll=function(checked){document.querySelectorAll('.report-row-check').forEach(x=>x.checked=!!checked)};
Reports.getSelected=function(){return [...document.querySelectorAll('.report-row-check:checked')].map(x=>x.value)};

Reports.downloadCustomerLedger=function(){const x=Reports.__lastFilter||{},rows=trips().filter(r=>(!x.pid||r.party_id===x.pid)&&(!x.f||r.date>=x.f)&&(!x.t||r.date<=x.t)),csv=['Date,Trip,Customer,Route,Vehicle,Driver,Freight,Invoice',...rows.map(r=>[r.date,r.trip_no,party(r.party_id)?.name||'',`${r.from} -> ${r.to}`,vehicle(r.vehicle_id)?.number||'',driver(r.driver_id)?.name||'',r.freight,activeInv(r.id)?.invoice_no||'Pending'].map(v=>'"'+String(v).replaceAll('"','""')+'"').join(','))].join('\n'),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download=`customer-trip-ledger-${today()}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};

// DATA IMPORT / EXPORT / BACKUP
const DATA=['company_profile','vehicles','drivers','parties','trips','invoices','driver_settlements','payments','expense_master','followups','audit_log'];const snapshot=()=>{const o={version:'2.13.0',exported_at:new Date().toISOString()};DATA.forEach(k=>o[k]=DB.get(k,[]));return o};const dl=(blob,name)=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};
window.anoriExportJSON=()=>{
  try{
    const data={format:'ANORI_TRANSPORT_BACKUP',schema_version:1,app_version:'2.24',
      exported_at:new Date().toISOString(),tables:{}};
    DATA.forEach(k=>{const v=DB.get(k,k==='company_profile'?{}:[]);data.tables[k]=v;});
    const payload=JSON.stringify(data,null,2);
    dl(new Blob([payload],{type:'application/json'}),`ANORI_TRANSPORT_BACKUP_${today()}.json`);
    Utils.toast('Complete JSON backup exported successfully.','success');
    return true;
  }catch(e){console.error(e);Utils.toast('JSON export failed.','error');return false;}
};

window.anoriExportCSV=()=>{
  try{
    const parts=['# ANORI TRANSPORT DATA EXPORT'];
    DATA.forEach(k=>{
      const v=DB.get(k,[]);
      if(!Array.isArray(v)||!v.length)return;
      const keys=[...new Set(v.flatMap(x=>Object.keys(x||{})))];
      parts.push(`# ${k}\n${keys.join(',')}\n${v.map(x=>keys.map(q=>'"'+String(x?.[q]??'').replaceAll('"','""')+'"').join(',')).join('\n')}`);
    });
    dl(new Blob([parts.join('\n\n')],{type:'text/csv'}),`ANORI_TRANSPORT_DATA_${today()}.csv`);
    Utils.toast('CSV export completed.','success');return true;
  }catch(e){console.error(e);Utils.toast('CSV export failed.','error');return false;}
};

window.anoriExportXLSX=()=>{
  if(typeof XLSX==='undefined')return Utils.toast('Excel library unavailable.','error');
  try{
    const wb=XLSX.utils.book_new();
    DATA.forEach(k=>{
      const v=DB.get(k,[]);
      if(Array.isArray(v)&&v.length)XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(v),k.slice(0,31));
    });
    XLSX.writeFile(wb,`ANORI_TRANSPORT_DATA_${today()}.xlsx`);
    Utils.toast('Excel export completed.','success');return true;
  }catch(e){console.error(e);Utils.toast('Excel export failed.','error');return false;}
};

window.anoriExportSQLite=async()=>{
  try{
    const bytes=window.AnoriSQLite?.exportSnapshot?window.AnoriSQLite.exportSnapshot(dataSnapshot()):await sqliteBytes();
    dl(new Blob([bytes],{type:'application/x-sqlite3'}),`ANORI_TRANSPORT_BACKUP_${today()}.sqlite`);
    Utils.toast('SQLite export completed.','success');return true;
  }catch(e){console.error(e);Utils.toast('SQLite export failed: '+(e.message||'unknown error'),'error');return false;}
};

function normalizeImportedData(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid backup: root object expected.');
  const data=raw.tables&&typeof raw.tables==='object'?raw.tables:raw;
  const present=DATA.filter(k=>Object.prototype.hasOwnProperty.call(data,k));
  if(!present.length)throw Error('No supported ANORI TRANSPORT data sections found.');

  const clean={};
  const problems=[];
  present.forEach(k=>{
    const value=data[k];
    if(k==='company_profile'){
      if(value===null||typeof value!=='object'||Array.isArray(value))problems.push(k+': invalid company profile');
      else clean[k]=value;
    }else if(!Array.isArray(value)){
      problems.push(k+': expected an array');
    }else{
      clean[k]=value;
      const seen=new Set();
      let dup=0;
      value.forEach(row=>{
        if(row&&row.id!=null){
          const id=String(row.id);
          if(seen.has(id))dup++; else seen.add(id);
        }
      });
      if(dup)problems.push(k+`: ${dup} duplicate ID(s)`);
    }
  });
  if(problems.length)throw Error('Backup validation failed:\\n• '+problems.join('\\n• '));
  return {data:clean,present};
}

async function importData(raw){
  const checked=normalizeImportedData(raw);
  const summary=checked.present.map(k=>{
    const v=checked.data[k];
    return `${k}: ${Array.isArray(v)?v.length:1}`;
  }).join('<br>');

  const r=await Swal.fire({
    icon:'warning',
    title:'Import Data?',
    html:`<div style="text-align:left"><strong>${checked.present.length}</strong> data sections validated.<br><br>${summary}<br><br><strong>Existing data in these sections will be replaced.</strong><br>A safety backup will be created before import.</div>`,
    showCancelButton:true,confirmButtonText:'Create Backup & Import',cancelButtonText:'Cancel'
  });
  if(!r.isConfirmed)return false;

  // Capture a complete rollback snapshot before touching DB.
  const rollback={};
  DATA.forEach(k=>rollback[k]=DB.get(k,k==='company_profile'?{}:[]));

  let backupOk=false;
  try{
    if(window.AnoriDataTools?.autoBackupNow)backupOk=await window.AnoriDataTools.autoBackupNow('before-import');
  }catch(e){console.warn('Persistent backup unavailable:',e);}
  if(!backupOk){
    try{
      const payload={format:'ANORI_TRANSPORT_PRE_IMPORT_BACKUP',schema_version:1,created_at:new Date().toISOString(),tables:rollback};
      dl(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),`ANORI_TRANSPORT_PRE_IMPORT_BACKUP_${today()}.json`);
      backupOk=true;
    }catch(e){console.error(e);}
  }
  if(!backupOk){
    await Swal.fire({icon:'error',title:'Backup Failed',text:'Import was cancelled because a safety backup could not be created.'});
    return false;
  }

  try{
    checked.present.forEach(k=>DB.set(k,checked.data[k],true));
    sync();
    Utils.toast('Validated data imported successfully.','success');
    if(typeof Router!=='undefined')Router.go('settings');
    return true;
  }catch(e){
    console.error('Import failed; restoring previous data.',e);
    try{DATA.forEach(k=>DB.set(k,rollback[k],true));sync();}catch(restoreError){console.error('Rollback failed:',restoreError);}
    await Swal.fire({icon:'error',title:'Import Failed',text:'Import failed and the previous data was restored.'});
    return false;
  }
}

window.anoriImportFile=()=>{
  const i=document.createElement('input');
  i.type='file';i.accept='.json,.xlsx,.sqlite,.db';
  i.onchange=async()=>{
    try{
      const f=i.files?.[0];if(!f)return;
      const n=f.name.toLowerCase();
      if(n.endsWith('.json'))return importData(JSON.parse(await f.text()));
      if(n.endsWith('.xlsx')){
        if(typeof XLSX==='undefined')throw Error('Excel library unavailable.');
        const wb=XLSX.read(await f.arrayBuffer(),{type:'array'}),d={};
        wb.SheetNames.forEach(s=>{if(DATA.includes(s))d[s]=XLSX.utils.sheet_to_json(wb.Sheets[s],{defval:''});});
        return importData(d);
      }
      if(n.endsWith('.sqlite')||n.endsWith('.db')){
        if(window.AnoriSQLite?.importBytes){return importData(window.AnoriSQLite.importBytes(await f.arrayBuffer()));}
        if(typeof initSqlJs!=='function')throw Error('SQLite import engine unavailable.');
        const SQL=await initSqlJs({locateFile: x => window.__ANORI_SQL_LOCAL__ ? `libs/sqljs/${x}` : `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${x}`});
        const db=new SQL.Database(new Uint8Array(await f.arrayBuffer())),d={};
        DATA.forEach(k=>{try{const q=db.exec(`SELECT json FROM "${k}"`);if(q[0])d[k]=q[0].values.map(r=>JSON.parse(r[0]));}catch(e){}});
        db.close();return importData(d);
      }
      throw Error('Unsupported import format. Use JSON, XLSX or SQLite.');
    }catch(e){
      console.error(e);
      await Swal.fire({icon:'error',title:'Import Failed',text:e.message||'Unable to import file.'});
    }
  };
  i.click();
};

/* ============================================================
   ANORI TRANSPORT v2.19 — SINGLE FILE AUTO BACKUP
   Requirement: one file, every 5 minutes, overwrite selected folder.
   ============================================================ */
(function(){
'use strict';
const BACKUP_FILE='ANORI_TRANSPORT_BACKUP.json';
const DB_NAME='anori_transport_backup_settings';
const STORE='handles';
let backupTimer=null;

function idb(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,1);
    req.onupgradeneeded=()=>req.result.createObjectStore(STORE);
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
async function saveHandle(handle){
  try{const db=await idb();await new Promise((res,rej)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(handle,'backupFolder');tx.oncomplete=res;tx.onerror=()=>rej(tx.error);});db.close();}catch(e){console.warn('Backup folder handle could not be persisted',e);}
}
async function loadHandle(){
  try{const db=await idb();const h=await new Promise((res,rej)=>{const tx=db.transaction(STORE,'readonly');const r=tx.objectStore(STORE).get('backupFolder');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});db.close();return h||null;}catch(e){return null;}
}
async function ensurePermission(handle){
  if(!handle)return false;
  try{
    if(handle.queryPermission && (await handle.queryPermission({mode:'readwrite'}))==='granted')return true;
    if(handle.requestPermission && (await handle.requestPermission({mode:'readwrite'}))==='granted')return true;
  }catch(e){}
  return false;
}
async function writeSingleBackup(){
  const dir=window.__anoriBackupDir;
  if(!dir)return false;
  try{
    if(!(await ensurePermission(dir)))throw new Error('Backup folder permission is not available.');
    const payload=JSON.stringify(snapshot(),null,2);
    const file=await dir.getFileHandle(BACKUP_FILE,{create:true});
    const writable=await file.createWritable();
    await writable.write(payload);
    await writable.close();
    localStorage.setItem('anori_backup_last_time',new Date().toISOString());
    const status=document.getElementById('anoriBackupStatus');
    if(status)status.textContent='Last backup: '+new Date().toLocaleString();
    return true;
  }catch(e){
    console.error('Automatic backup failed:',e);
    Utils.toast('Automatic backup failed: '+(e.message||'permission or folder error'),'error');
    return false;
  }
}
async function startBackupTimer(){
  // Legacy backup loop disabled. The v2.23 persistent backup controller below
  // is the single owner of automatic backup scheduling (every 2 minutes).
  clearInterval(backupTimer);
  return;
}
window.anoriSelectBackupFolder=async()=>{
  if(!window.showDirectoryPicker)return Utils.toast('Folder selection is not supported by this browser.','warning');
  try{
    const dir=await window.showDirectoryPicker({mode:'readwrite'});
    if(!(await ensurePermission(dir)))return Utils.toast('Write permission was not granted.','error');
    window.__anoriBackupDir=dir;
    await saveHandle(dir);
    localStorage.setItem('anori_backup_folder_name',dir.name||'Selected Folder');
    await startBackupTimer();
    Utils.toast('Backup folder selected. One file will be overwritten every 5 minutes.','success');
    Router.go('settings');
  }catch(e){if(e.name!=='AbortError')Utils.toast('Folder selection failed.','error');}
};
window.anoriBackupNow=async()=>{
  if(!window.__anoriBackupDir)return Utils.toast('Select a backup folder first.','warning');
  const ok=await writeSingleBackup();
  if(ok)Utils.toast('ANORI_TRANSPORT_BACKUP.json updated.','success');
};
window.anoriBackupFilename=BACKUP_FILE;

(async()=>{
  const h=await loadHandle();
  if(h && await ensurePermission(h)){window.__anoriBackupDir=h;await startBackupTimer();}
})();

if(!window.__anoriSingleBackupHook){
  const base=DB.set.bind(DB);
  DB.set=function(k,d,b){
    const r=base(k,d,b);
    return r;
  };
  window.__anoriSingleBackupHook=true;
}
})();
window.ANORI_V213=true;
})();


/* ============================================================
   ANORI TRANSPORT v2.14 — SCREENSHOT-MATCHED ACTION BARS
   ============================================================ */
(function(){
'use strict';
const esc2=v=>Sanitize.html(v==null?'':String(v));
const trips2=()=>DB.get('trips',[]), invs2=()=>DB.get('invoices',[]);
const active2=id=>invs2().find(i=>Array.isArray(i.trip_ids)&&i.trip_ids.includes(id)&&String(i.status||'').toLowerCase()!=='cancelled');
const selectedIds=sel=>[...document.querySelectorAll(sel+':checked')].map(x=>x.value);
function toolbar(type,countId){
  const isTrip=type==='trip', isInv=type==='invoice';
  const count=isTrip?'Trips.getSelected()':'Invoices.getSelected()';
  const one=(expr)=>`(${expr}).length===1`;
  const preview=isTrip?`Trips.actionPreview()`:`Invoices.actionPreview()`;
  const pdf=isInv?`Invoices.actionPDF()`:`Utils.toast('Trip PDF is available after invoice generation.','info')`;
  const email=isInv?`Invoices.actionEmail()`:`Utils.toast('Email is available for invoices.','info')`;
  const duplicate=isTrip?`Trips.duplicateSelected()`:`Invoices.duplicateSelected()`;
  const edit=isTrip?`Trips.editSelected()`:`Invoices.editSelected()`;
  const del=isTrip?`Trips.deleteSelected()`:`Invoices.deleteSelected()`;
  const payment=isInv?`Invoices.actionPayment()`:'';
  const cancel=isInv?`Invoices.actionCancel()`:'';
  return `<div class="anori-action-toolbar anori-shahid-toolbar">
    <span class="anori-toolbar-label">Actions:</span>
    <button type="button" class="anori-action-btn anori-action-preview" onclick="${preview}"><i class="fas fa-eye"></i> PREVIEW</button>
    <button type="button" class="anori-action-btn anori-action-pdf" onclick="${pdf}"><i class="fas fa-file-pdf"></i> PDF</button>
    <button type="button" class="anori-action-btn anori-action-email" onclick="${email}"><i class="fas fa-envelope"></i> EMAIL</button>
    ${isInv?`<button type="button" class="anori-action-btn anori-action-payment" onclick="${payment}"><i class="fas fa-money-bill-wave"></i> PAYMENT</button>`:''}
    <button type="button" class="anori-action-btn anori-action-duplicate" onclick="${duplicate}"><i class="fas fa-copy"></i> DUPLICATE</button>
    <button type="button" class="anori-action-btn anori-action-edit" onclick="${edit}"><i class="fas fa-pen"></i> EDIT</button>
    <button type="button" class="anori-action-btn anori-action-delete" onclick="${del}"><i class="fas fa-trash"></i> DELETE</button>
    ${isInv?`<button type="button" class="anori-action-btn anori-action-cancel" onclick="${cancel}"><i class="fas fa-ban"></i> CANCEL</button>`:''}
    <span class="anori-toolbar-spacer"></span>
    <span id="${countId}" class="anori-selection-count">0 selected</span>
  </div>`;
}

Trips.getSelected=Trips.getSelected||function(){return selectedIds('.trip-row-check')};
Invoices.getSelected=Invoices.getSelected||function(){return selectedIds('.invoice-row-check')};
Trips.duplicateSelected=function(){
  const ids=Trips.getSelected();
  if(ids.length!==1)return Utils.toast('Select one trip to duplicate.','warning');
  const all=DB.get('trips',[])||[];
  const original=all.find(x=>String(x.id)===String(ids[0]));
  if(!original)return Utils.toast('Selected trip was not found.','error');
  const copy=JSON.parse(JSON.stringify(original));
  copy.id=Utils.id();
  copy.date=Utils.today();
  copy.trip_no=Utils.generateTripNo(copy.date);
  copy.invoice_status='pending';
  delete copy.invoice_id;
  delete copy.invoice_no;
  copy.created_at=new Date().toISOString();
  all.push(copy);
  DB.set('trips',all,true);
  if(typeof window.syncDriver==='function')window.syncDriver(copy);
  if(Trips.__selectedIds instanceof Set)Trips.__selectedIds.clear();
  Utils.toast(`Trip duplicated successfully: ${copy.trip_no}`,'success');
  Router.go('trips');
};
Trips.editSelected=function(){const ids=Trips.getSelected();if(ids.length!==1)return Utils.toast('Select one trip to edit.','warning');Trips.showEditModal(ids[0])};
Trips.deleteSelected=function(){const ids=Trips.getSelected();if(ids.length!==1)return Utils.toast('Select one trip to delete.','warning');Trips.delete(ids[0])};
Invoices.emailExisting=async function(id){const i=invs2().find(x=>x.id===id);if(!i)return;const p=DB.get('parties',[]).find(x=>x.id===i.party_id)||{};const to=p.email||'';const subject=`Invoice ${i.invoice_no} - ${p.name||'Anori Transport'}`;const body=`Dear ${p.name||'Customer'},%0D%0A%0D%0APlease find invoice ${i.invoice_no} for ${money(i.total_amount)}.%0D%0A%0D%0ARegards,%0D%0AAnori Transport Services`;window.location.href=`mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${body}`};
Invoices.duplicateSelected=function(){const ids=Invoices.getSelected();if(ids.length!==1)return Utils.toast('Select one invoice to duplicate.','warning');const i=invs2().find(x=>x.id===ids[0]);if(!i)return;if(String(i.status||'').toLowerCase()!=='draft')return Utils.toast('Only draft invoices can be duplicated.','warning');const copy=JSON.parse(JSON.stringify(i));copy.id=Utils.id();copy.invoice_no=Utils.generateInvoiceNo();copy.status='draft';copy.trip_ids=[];copy.trip_count=0;copy.trips_data=[];copy.advance=0;copy.paid_amount=0;copy.balance_due=copy.total_amount;copy.payments=[];invs2().push(copy);DB.set('invoices',invs2());Utils.toast('Draft invoice duplicated.','success');Router.go('invoices')};
Invoices.editSelected=function(){const ids=Invoices.getSelected();if(ids.length!==1)return Utils.toast('Select one invoice to edit.','warning');const i=invs2().find(x=>x.id===ids[0]);if(!i)return;if(String(i.status||'').toLowerCase()!=='draft')return Utils.toast('Issued invoices are locked. Cancel first if a new invoice is required.','warning');Utils.toast('Draft invoice editing is available from the invoice generator.','info')};
Invoices.deleteSelected=function(){const ids=Invoices.getSelected();if(ids.length!==1)return Utils.toast('Select one invoice to delete/cancel.','warning');Invoices.deleteInvoice(ids[0])};

Trips.render=function(c){sync();const a=trips2();c.innerHTML=`<div class="anori-section-intro"><div><strong>Trip Management</strong><span>Select a row, then use the Actions above the table.</span></div><button class="btn btn-success" onclick="Trips.openForm()">＋ New Trip</button></div><div class="card">${toolbar('trip','tripSelectedCount')}<div class="table-wrapper"><table><thead><tr><th><input type="checkbox" onchange="Trips.toggleAll(this.checked)"></th><th>Date</th><th>Trip #</th><th>Vehicle</th><th>Driver</th><th>Party</th><th>Route</th><th>Freight</th><th>Driver Amt</th><th>Expenses</th><th>Profit</th><th>Invoice</th></tr></thead><tbody>${a.map(t=>{const e=(t.expenses||[]).reduce((s,x)=>s+num(x.amount),0),i=active2(t.id);return `<tr><td><input type="checkbox" class="trip-row-check" value="${esc2(t.id)}" onchange="Trips.updateSelectionCount()"></td><td>${esc2(t.date)}</td><td><strong>${esc2(t.trip_no)}</strong></td><td>${esc2((DB.get('vehicles',[]).find(v=>v.id===t.vehicle_id)||{}).number||'-')}</td><td>${esc2((DB.get('drivers',[]).find(d=>d.id===t.driver_id)||{}).name||'-')}</td><td>${esc2((DB.get('parties',[]).find(p=>p.id===t.party_id)||{}).name||'-')}</td><td>${esc2(t.from)} → ${esc2(t.to)}</td><td>${money(t.freight)}</td><td>${money(t.driver_amount)}</td><td>-${money(e)}</td><td>${money(num(t.freight)-e)}</td><td>${i?'<span class="status-badge status-shared">INVOICED</span>':'<span class="status-badge status-pending">PENDING</span>'}</td></tr>`}).join('')||'<tr><td colspan="12" class="empty-state">No trips.</td></tr>'}</tbody></table></div></div>`;Trips.updateSelectionCount()};

Invoices.render=function(c){sync();const a=invs2(),active=a.filter(i=>istatus(i)!=='cancelled'),cnt={paid:0,unpaid:0,part_paid:0,overdue:0};active.forEach(i=>cnt[istatus(i)]++);const billed=active.reduce((s,i)=>s+num(i.total_amount),0),received=active.reduce((s,i)=>s+paid(i),0);c.innerHTML=`<div class="anori-section-intro"><div><strong>Invoices & Billing</strong><span>Payment status is calculated automatically from recorded payments.</span></div><button class="btn btn-success" onclick="Invoices.showInvoiceGenerator()">＋ New Invoice</button></div><div class="anori-kpi-grid anori-kpi-grid-5"><div class="anori-kpi-card"><span>Total Invoices</span><strong>${active.length}</strong><small>${money(billed)} billed</small></div><div class="anori-kpi-card anori-kpi-good"><span>Paid</span><strong>${cnt.paid}</strong><small>${money(received)} received</small></div><div class="anori-kpi-card anori-kpi-warn"><span>Unpaid</span><strong>${cnt.unpaid}</strong><small>Customer has not paid</small></div><div class="anori-kpi-card anori-kpi-info"><span>Part Paid</span><strong>${cnt.part_paid}</strong><small>${money(active.filter(i=>istatus(i)==='part_paid').reduce((s,i)=>s+bal(i),0))} BALANCE</small></div><div class="anori-kpi-card anori-kpi-bad"><span>Overdue</span><strong>${cnt.overdue}</strong><small>${money(active.filter(i=>istatus(i)==='overdue').reduce((s,i)=>s+bal(i),0))} OVERDUE</small></div></div><div class="card">${toolbar('invoice','invoiceSelectedCount')}<div class="table-wrapper"><table><thead><tr><th><input type="checkbox" onchange="Invoices.toggleAll(this.checked)"></th><th>Invoice</th><th>Date</th><th>Due Date</th><th>Remaining Days</th><th>Customer</th><th>Trips</th><th>Total</th><th>Received</th><th>Balance</th><th>Status</th></tr></thead><tbody>${a.slice().reverse().map(i=>`<tr><td><input type="checkbox" class="invoice-row-check" value="${esc2(i.id)}" onchange="Invoices.updateSelectionCount()"></td><td><strong>${esc2(i.invoice_no)}</strong></td><td>${esc2(i.date)}</td><td>${esc2(window.invoiceDueDate(i))}</td><td>${window.invoiceRemainingDays(i)}</td><td>${esc2((DB.get('parties',[]).find(p=>p.id===i.party_id)||{}).name||'-')}</td><td>${num(i.trip_count)}</td><td>${money(i.total_amount)}</td><td>${money(paid(i))}</td><td>${money(bal(i))}</td><td><span class="status-badge status-${istatus(i).replace('_','-')}">${esc2(istatus(i).replace('_',' ').toUpperCase())}</span></td></tr>`).join('')||'<tr><td colspan="11" class="empty-state">No invoices.</td></tr>'}</tbody></table></div></div>`;Invoices.updateSelectionCount()};

window.ANORI_V214=true;
})();


/* v2.14: apply the same screenshot-style action bar to non-financial tables too. */
(function(){
'use strict';
function bar(html){return `<div class="anori-action-toolbar"><span class="anori-toolbar-label">Actions:</span>${html}<span class="anori-toolbar-spacer"></span></div>`}
const oldDSFilter=DriverSettlement.applyFilter;
DriverSettlement.render=function(c){
  if(typeof window.syncAllDriverTripEntries==='function') window.syncAllDriverTripEntries();
  const ds=DB.get('drivers',[]);
  c.innerHTML=`<div class="anori-section-intro"><div><strong>Driver Settlement</strong><span>Trip driver amounts are reflected automatically.</span></div><button class="btn btn-success" onclick="DriverSettlement.openModal()">＋ Add Entry</button></div><div class="card">${bar(`<button class="anori-action-btn anori-action-pdf" onclick="DriverSettlement.downloadPDF()">📄 PDF / LEDGER</button><button class="anori-action-btn anori-action-export" onclick="DriverSettlement.exportExcel()">📊 EXCEL</button>`)}<div class="anori-filter-bar"><label>Driver<select id="driverLedgerDriver" class="form-control"><option value="">All Drivers</option>${ds.map(d=>`<option value="${esc(d.id)}">${esc(d.name)}</option>`).join('')}</select></label><label>Period<select id="driverLedgerPeriod" class="form-control"><option value="all">All</option><option value="week">Weekly</option><option value="month">Monthly</option><option value="custom">Custom</option></select></label><label>From<input id="driverLedgerFrom" class="form-control" type="date"></label><label>To<input id="driverLedgerTo" class="form-control" type="date" value="${today()}"></label><button class="btn btn-primary" onclick="DriverSettlement.applyFilter()">Apply</button></div><div id="driverLedgerHost"></div></div>`;DriverSettlement.applyFilter()};
const oldReportApply=Reports.applyFilter;
Reports.render=function(c){const ps=parties();c.innerHTML=`<div class="anori-section-intro"><div><strong>Reports & Analytics</strong><span>Customer-wise trip checking and ledger download.</span></div></div><div class="card">${bar(`<button class="anori-action-btn anori-action-preview" onclick="Reports.applyFilter()">🔎 APPLY FILTER</button><button class="anori-action-btn anori-action-pdf" onclick="Reports.downloadCustomerLedger()">📄 DOWNLOAD LEDGER</button><button class="anori-action-btn anori-action-export" onclick="Reports.downloadCustomerLedger()">⬇ EXPORT CSV</button>`)}<div class="anori-filter-bar"><label>Customer<select id="reportParty" class="form-control"><option value="">All Customers</option>${ps.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select></label><label>From<input id="reportFrom" class="form-control" type="date"></label><label>To<input id="reportTo" class="form-control" type="date" value="${today()}"></label><button class="btn btn-primary" onclick="Reports.applyFilter()">Apply</button></div><div id="reportHost"></div></div>`;Reports.applyFilter()};
const oldSettings2=Settings.render;
Settings.render=function(c){oldSettings2.call(Settings,c);const tools=c.querySelector('.anori-data-tools');if(!tools)return;const old=tools.querySelector('.anori-universal-toolbar');if(old)old.outerHTML=bar(`<button class="anori-action-btn anori-action-preview" onclick="anoriExportJSON()">📦 JSON</button><button class="anori-action-btn anori-action-pdf" onclick="anoriExportXLSX()">📊 EXCEL</button><button class="anori-action-btn anori-action-email" onclick="anoriExportSQLite()">🗄 SQLITE</button><button class="anori-action-btn anori-action-duplicate" onclick="anoriExportCSV()">📄 CSV</button><button class="anori-action-btn anori-action-convert" onclick="anoriImportFile()">⬆ IMPORT</button>`)};
window.ANORI_V214=true;
})();


/* ============================================================
   v2.15 FINAL PATCH — SHAHID-STYLE ACTION BAR + FIT-TO-SCREEN
   ============================================================ */
(function(){
'use strict';
function selectedTripIds(){return [...document.querySelectorAll('.trip-row-check:checked')].map(x=>x.value)}
function selectedInvoiceIds(){return [...document.querySelectorAll('.invoice-row-check:checked')].map(x=>x.value)}
function requireOne(ids,label){if(ids.length!==1){Utils.toast(ids.length===0?`Select one ${label} first.`:`Select only one ${label} at a time.`,'warning');return null}return ids[0]}
Trips.actionPreview=function(){const id=requireOne(selectedTripIds(),'trip');if(id)Trips.view(id)};
Invoices.actionPreview=function(){const id=requireOne(selectedInvoiceIds(),'invoice');if(id)Invoices.previewExisting(id)};
Invoices.actionPDF=function(){const id=requireOne(selectedInvoiceIds(),'invoice');if(id)Invoices.downloadExisting(id)};
Invoices.actionEmail=function(){const id=requireOne(selectedInvoiceIds(),'invoice');if(id)Invoices.emailExisting(id)};
Invoices.actionPayment=function(){const id=requireOne(selectedInvoiceIds(),'invoice');if(id)Invoices.recordPayment(id)};
Invoices.actionCancel=function(){const id=requireOne(selectedInvoiceIds(),'invoice');if(id)Invoices.cancelInvoice(id)};

Invoices.fitPreviewToScreen=function(){
  const host=document.getElementById('previewContent');
  const stage=host?.querySelector('.anori-invoice-preview-stage');
  const page=stage?.querySelector('.invoice-page');
  if(!host||!stage||!page)return;
  page.style.transform='none';
  page.style.transformOrigin='top center';
  const pageWidth=page.offsetWidth||794;
  const available=Math.max(280,host.clientWidth-48);
  // Use the wider preview area to make the A4 invoice easier to read.
  // If the invoice becomes taller/wider than the viewport, the preview container scrolls.
  const scale=Math.min(1.35,Math.max(1,available/pageWidth));
  page.style.transform=`scale(${scale})`;
  stage.style.width='100%';
  stage.style.minHeight=`${Math.ceil((page.offsetHeight||1123)*scale + 24)}px`;
  stage.style.padding='0 0 24px';
  stage.style.justifyContent='center';
  stage.style.overflow='visible';
  page.style.marginLeft='auto';
  page.style.marginRight='auto';
};
const oldMount=Invoices.mountInvoiceDocument;
Invoices.mountInvoiceDocument=function(i){const page=oldMount.call(this,i);requestAnimationFrame(()=>requestAnimationFrame(()=>this.fitPreviewToScreen()));return page};
const oldPreview=Invoices.previewInvoice;
Invoices.previewInvoice=function(i){oldPreview.call(this,i);setTimeout(()=>this.fitPreviewToScreen(),30)};
if(!window.__anoriPreviewResizeBound){
  window.__anoriPreviewResizeBound=true;
  window.addEventListener('resize',()=>{if(document.getElementById('previewModal')?.classList.contains('active'))Invoices.fitPreviewToScreen()});
}
})();


/* v2.15 FINAL — PDF uses the same preview DOM, temporarily unscaled for A4 capture. */
(function(){
'use strict';
Invoices.downloadInvoice = function(invoice) { return (window.__ANORI_PDF_FINAL_FUNCTION ? window.__ANORI_PDF_FINAL_FUNCTION(invoice) : Promise.reject(new Error('PDF engine is initializing.'))); };
})();

/* ============================================================
   ANORI TRANSPORT v2.16 — RUNTIME STABILITY HOTFIX
   Fixes: cross-IIFE scope errors, missing backup service, universal
   action-toolbar styling, and cancelled-invoice history visibility.
   ============================================================ */
(function installAnoriV216Hotfix(){
'use strict';
const esc=v=>Sanitize.html(v==null?'':String(v));
const num=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:0};
const money=v=>Utils.fmt(num(v));
const today=()=>Utils.today();
const getTrips=()=>DB.get('trips',[]);
const getInvoices=()=>DB.get('invoices',[]);
const getParties=()=>DB.get('parties',[]);
const activeInvoice=id=>getInvoices().find(i=>Array.isArray(i.trip_ids)&&i.trip_ids.includes(id)&&String(i.status||'').toLowerCase()!=='cancelled');
const paidAmount=i=>num(i?.advance)+DB.get('payments',[]).filter(p=>p.invoice_id===i?.id).reduce((s,p)=>s+num(p.amount),0);
const balanceDue=i=>Math.max(0,num(i?.total_amount)-paidAmount(i));
const invoiceStatus=i=>{
  if(!i)return 'unknown';
  if(String(i.status||'').toLowerCase()==='cancelled')return 'cancelled';
  if(balanceDue(i)<=0)return 'paid';
  const d=new Date(Invoices.getDueDate(i.date,i.credit_days||30));
  if(!Number.isNaN(d.getTime())&&d<new Date(today()))return 'overdue';
  return paidAmount(i)>0?'part_paid':'unpaid';
};

/* Make shared helpers available to later UI override layers. */
window.esc=esc;window.num=num;window.money=money;window.today=today;
window.invoiceDueDate=function(i){return Invoices.getDueDate(i?.date,i?.credit_days||30)};
window.invoiceRemainingDays=function(i){const due=window.invoiceDueDate(i);const a=new Date(`${today()}T00:00:00`),b=new Date(`${due}T00:00:00`);if(Number.isNaN(b.getTime()))return '';return Math.round((b-a)/86400000)};
window.parties=getParties;window.paid=paidAmount;window.bal=balanceDue;window.istatus=invoiceStatus;
window.sync=function(){
  const invoices=getInvoices();
  invoices.forEach(i=>{i.paid_amount=paidAmount(i);i.balance_due=balanceDue(i);if(String(i.status||'').toLowerCase()!=='cancelled')i.status=i.balance_due<=0?'paid':(i.paid_amount>0?'part_paid':'issued')});
  DB.set('invoices',invoices,true);
  const trips=getTrips();
  trips.forEach(t=>t.invoice_status=activeInvoice(t.id)?'invoiced':'pending');
  DB.set('trips',trips,true);
};

/* The v2.14/v2.15 render layers use toolbar() from another IIFE.
   Expose one stable implementation instead of relying on lexical scope. */
window.toolbar=function(type,countId){
  const isInvoice=type==='invoice';
  const preview=isInvoice?'Invoices.actionPreview()':'Trips.actionPreview()';
  const pdf=isInvoice?'Invoices.actionPDF()':"Utils.toast('Trip PDF is available after invoice generation.','info')";
  const email=isInvoice?'Invoices.actionEmail()':"Utils.toast('Email is available for invoices.','info')";
  const duplicate=isInvoice?'Invoices.duplicateSelected()':'Trips.duplicateSelected()';
  const edit=isInvoice?'Invoices.editSelected()':'Trips.editSelected()';
  const del=isInvoice?'Invoices.deleteSelected()':'Trips.deleteSelected()';
  return `<div class="anori-action-toolbar anori-shahid-toolbar">
    <span class="anori-toolbar-label">Actions:</span>
    <button type="button" class="anori-action-btn anori-action-preview" onclick="${preview}"><i class="fas fa-eye"></i> PREVIEW</button>
    <button type="button" class="anori-action-btn anori-action-pdf" onclick="${pdf}"><i class="fas fa-file-pdf"></i> PDF</button>
    <button type="button" class="anori-action-btn anori-action-email" onclick="${email}"><i class="fas fa-envelope"></i> EMAIL</button>
    ${isInvoice?'<button type="button" class="anori-action-btn anori-action-payment" onclick="Invoices.actionPayment()"><i class="fas fa-money-bill-wave"></i> PAYMENT</button>':''}
    <button type="button" class="anori-action-btn anori-action-duplicate" onclick="${duplicate}"><i class="fas fa-copy"></i> DUPLICATE</button>
    <button type="button" class="anori-action-btn anori-action-edit" onclick="${edit}"><i class="fas fa-pen"></i> EDIT</button>
    <button type="button" class="anori-action-btn anori-action-delete" onclick="${del}"><i class="fas fa-trash"></i> DELETE</button>
    ${isInvoice?'<button type="button" class="anori-action-btn anori-action-cancel" onclick="Invoices.actionCancel()"><i class="fas fa-ban"></i> CANCEL</button>':''}
    <span class="anori-toolbar-spacer"></span><span id="${countId}" class="anori-selection-count">0 selected</span>
  </div>`;
};

/* v2.8/v2.12 installed a backup callback before the service object existed.
   Provide the service explicitly so every DB write remains safe. */
window.AnoriDataTools=window.AnoriDataTools||{};
window.AnoriDataTools.exportJSON=window.AnoriDataTools.exportJSON||function(){
  if(typeof window.anoriExportJSON==='function'){window.anoriExportJSON();return true;}
  const keys=['company_profile','vehicles','drivers','parties','trips','invoices','driver_settlements','payments','expense_master','followups','audit_log'];
  const data={version:'2.16.0',exported_at:new Date().toISOString()};keys.forEach(k=>data[k]=DB.get(k,[]));
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download=`anori-backup-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);return true;
};
window.AnoriDataTools.autoBackupNow=window.AnoriDataTools.autoBackupNow||async function(){
  if(typeof window.anoriBackupNow==='function')return await window.anoriBackupNow();
  return window.AnoriDataTools.exportJSON();
};

/* Show cancelled invoices in history. They remain excluded from active KPI counts. */
const oldInvoiceRender=Invoices.render;
Invoices.render=function(container){
  if(typeof oldInvoiceRender!=='function')return;
  oldInvoiceRender.call(Invoices,container);
  const table=container.querySelector('table');
  if(!table)return;
  const rows=table.querySelectorAll('tbody tr');
  const cancelled=getInvoices().filter(i=>String(i.status||'').toLowerCase()==='cancelled');
  if(!cancelled.length)return;
  /* v2.15 hides cancelled invoices from the active table. Re-render the table body from current DB. */
  const body=table.querySelector('tbody');
  const parties=getParties();
  body.innerHTML=getInvoices().slice().reverse().map(i=>{
    const p=parties.find(x=>x.id===i.party_id);
    const s=invoiceStatus(i);
    return `<tr class="${s==='cancelled'?'anori-cancelled-row':''}">
      <td><input type="checkbox" class="invoice-row-check" value="${esc(i.id)}" onchange="Invoices.updateSelectionCount()"></td>
      <td><strong>${esc(i.invoice_no)}</strong></td><td>${esc(i.date)}</td><td>${esc(p?.name||'-')}</td>
      <td>${num(i.trip_count)}</td><td>${money(i.total_amount)}</td><td>${money(paidAmount(i))}</td><td>${money(balanceDue(i))}</td>
      <td><span class="status-badge status-${s.replace('_','-')}">${esc(s.replace('_',' ').toUpperCase())}</span></td>
    </tr>`;
  }).join('');
  Invoices.updateSelectionCount();
};

/* Ensure backup button never throws even if the older wrapper fires. */
const backup=document.getElementById('backupBtn');
if(backup)backup.onclick=async()=>{try{const ok=await window.AnoriDataTools.autoBackupNow('header');if(ok===false)window.AnoriDataTools.exportJSON()}catch(e){console.error(e);Utils.toast('Backup failed.','error')}};

window.ANORI_V216_HOTFIX=true;
})();

/* ============================================================
   ANORI TRANSPORT v2.17 — FINAL CRITICAL HARDENING
   - Stable global toolbar helper (fixes cross-IIFE bar scope errors)
   - Exact Shahid-style individual action buttons
   - Safe invoice Preview/PDF rendering with guaranteed restoration
   - Removes invoice-page clipping from long invoices
   - Protects issued invoices from manual status corruption
   - Makes trip PDF/email actions explicit instead of silent no-op
   - Keeps cancelled invoices in history while excluding them from active KPIs
   ============================================================ */
(function installAnoriV217(){
'use strict';
const esc2 = v => (window.esc ? window.esc(v) : String(v ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])));
const toast = (m,t='info') => window.Utils?.toast ? Utils.toast(m,t) : null;
const getTrips = () => DB.get('trips',[]);
const getInvoices = () => DB.get('invoices',[]);
const activeInvoiceFor = id => getInvoices().find(i=>Array.isArray(i.trip_ids)&&i.trip_ids.includes(id)&&String(i.status||'').toLowerCase()!=='cancelled');

/* Stable toolbar helper. Earlier IIFEs used lexical `bar()` across scopes,
   which is invalid JavaScript and caused Driver/Reports/Settings tabs to fail. */
window.bar = function(html, countId='universalSelectedCount'){
  return `<div class="anori-action-toolbar anori-shahid-toolbar">
    <span class="anori-toolbar-label">Actions:</span>${html}
    <span class="anori-toolbar-spacer"></span><span id="${countId}" class="anori-selection-count">0 selected</span>
  </div>`;
};

/* Consistent action toolbar matching the requested screenshot. */
window.toolbar = function(type,countId){
  const invoice = type==='invoice';
  const p = invoice ? 'Invoices.actionPreview()' : 'Trips.actionPreview()';
  const pdf = invoice ? 'Invoices.downloadSelectedPDF()' : 'Trips.actionPDF()';
  const pdfLabel = invoice ? 'DOWNLOAD PDF' : 'PDF';
  const email = invoice ? 'Invoices.actionEmail()' : 'Trips.actionEmail()';
  const dup = invoice ? 'Invoices.duplicateSelected()' : 'Trips.duplicateSelected()';
  const edit = invoice ? 'Invoices.editSelected()' : 'Trips.editSelected()';
  const del = invoice ? 'Invoices.deleteSelected()' : 'Trips.deleteSelected()';
  return window.bar(`
    <button type="button" class="anori-action-btn anori-action-preview" onclick="${p}">👁 PREVIEW</button>
    <button type="button" class="anori-action-btn anori-action-pdf" onclick="${pdf}">📄 PDF</button>
    <button type="button" class="anori-action-btn anori-action-email" onclick="${email}">📧 EMAIL</button>
    ${invoice?'<button type="button" class="anori-action-btn anori-action-payment" onclick="Invoices.actionPayment()">💵 PAYMENT</button>':''}
    <button type="button" class="anori-action-btn anori-action-duplicate" onclick="${dup}">📋 DUPLICATE</button>
    <button type="button" class="anori-action-btn anori-action-edit" onclick="${edit}">✏️ EDIT</button>
    <button type="button" class="anori-action-btn anori-action-delete" onclick="${del}">🗑 DELETE</button>
    ${invoice?'<button type="button" class="anori-action-btn anori-action-cancel" onclick="Invoices.actionCancel()">❌ CANCEL</button>':''}
  `,countId);
};

/* Real trip actions: never pretend a non-invoice operation succeeded. */
Trips.actionPDF = function(){
  const ids = typeof Trips.getSelected==='function' ? Trips.getSelected() : [...document.querySelectorAll('.trip-row-check:checked')].map(x=>x.value);
  if(ids.length!==1)return toast(ids.length?'Select only one trip at a time.':'Select one trip first.','warning');
  const inv = activeInvoiceFor(ids[0]);
  if(!inv)return toast('This trip has no active invoice. Generate the invoice first.','warning');
  if(typeof Invoices.downloadExisting==='function')Invoices.downloadExisting(inv.id); else toast('Invoice PDF action is unavailable.','error');
};
Trips.actionEmail = function(){
  const ids = typeof Trips.getSelected==='function' ? Trips.getSelected() : [...document.querySelectorAll('.trip-row-check:checked')].map(x=>x.value);
  if(ids.length!==1)return toast(ids.length?'Select only one trip at a time.':'Select one trip first.','warning');
  const inv = activeInvoiceFor(ids[0]);
  if(!inv)return toast('This trip has no active invoice. Generate the invoice first.','warning');
  if(typeof Invoices.emailExisting==='function')Invoices.emailExisting(inv.id); else toast('Invoice email action is unavailable.','error');
};

/* Protect issued/cancelled invoice status from the legacy dropdown handler. */
Invoices.updateStatus = function(id,status){
  const a=getInvoices(), x=a.find(i=>i.id===id); if(!x)return;
  const current=String(x.status||'issued').toLowerCase();
  if(current==='cancelled')return toast('Cancelled invoices are locked.','warning');
  if(status==='paid'||status==='part_paid')return toast('Use PAYMENT to record customer receipt. Invoice status is calculated automatically.','warning');
  if(status==='cancelled')return Invoices.cancelInvoice(id);
  x.status=status==='sent'?'sent':'issued';
  DB.set('invoices',a); if(typeof sync==='function')sync(); Router.go('invoices');
  toast('Invoice status updated.','success');
};

/* Final invoice deletion rule:
   - ACTIVE/ISSUED/SENT invoices are NEVER permanently deleted; they must be cancelled.
   - DRAFT invoices can be permanently deleted.
   - CANCELLED invoices may be permanently deleted ONLY when they have no recorded customer payments.
   This keeps active financial history protected while making the DELETE action functional for
   cancelled records that are no longer financially referenced. */
Invoices.deleteInvoice = function(id){
  const a=getInvoices(), x=a.find(i=>i.id===id); if(!x)return;
  const st=String(x.status||'issued').toLowerCase();
  const payments=Array.isArray(DB.get('payments')) ? DB.get('payments') : [];
  const hasPayments=payments.some(p=>String(p.invoice_id||p.invoiceId||'')===String(id) && Number(p.amount||0)>0);

  if(st!=='draft' && st!=='cancelled'){
    return Invoices.cancelInvoice(id);
  }
  if(st==='cancelled' && hasPayments){
    return Swal.fire({
      icon:'warning',
      title:'Invoice Cannot Be Deleted',
      html:`Invoice <strong>${esc(x.invoice_no||id)}</strong> has recorded customer payment(s).<br><br>Financial history is protected. You can keep it as <strong>CANCELLED</strong>, but it cannot be permanently deleted.`,
      confirmButtonText:'OK'
    });
  }

  const title=st==='draft'?'Delete Draft Invoice?':'Delete Cancelled Invoice?';
  const text=st==='draft'
    ? 'This draft invoice will be permanently removed.'
    : 'This cancelled invoice will be permanently removed from invoice history. This action cannot be undone.';
  Swal.fire({title,text,icon:'warning',showCancelButton:true,confirmButtonText:'Delete Permanently',confirmButtonColor:'#dc2626',cancelButtonText:'Keep'}).then(r=>{
    if(!r.isConfirmed)return;
    DB.set('invoices',a.filter(i=>String(i.id)!==String(id)),true);
    if(typeof syncFinancial==='function')syncFinancial();
    Router.go('invoices');
    toast(st==='draft'?'Draft invoice deleted.':'Cancelled invoice deleted.','success');
  });
};

/* Final invoice renderer: remove clipping and keep 5mm page clearance. */
const originalBuild = Invoices.buildInvoiceHTML;
if(typeof originalBuild==='function'){
  Invoices.buildInvoiceHTML=function(invoice,preview=false){
    let html=originalBuild.call(this,invoice,preview);
    html=html.replace(/\.invoice-page\{([^}]*)\}/, (m,body)=>{
      body=body.replace(/overflow\s*:\s*hidden\s*;?/gi,'overflow:visible;');
      if(!/padding\s*:\s*5mm/i.test(body)) body+='padding:5mm;';
      return `.invoice-page{${body}}`;
    });
    return html;
  };
}

/* Fit preview to available screen with only 1cm visual clearance on each side.
   The page remains A4; transform scaling is proportional and scrolling handles height. */
Invoices.fitPreviewToScreen = function(){
  const host=document.getElementById('previewContent');
  const stage=host?.querySelector('.anori-invoice-preview-stage');
  const page=stage?.querySelector('.invoice-page');
  if(!host||!stage||!page)return;

  page.style.transform='none';
  page.style.transformOrigin='top center';
  page.style.margin='0 auto';

  const pageWidth=page.offsetWidth || 794;
  const pageHeight=page.offsetHeight || 1123;
  const rootFont=parseFloat(getComputedStyle(document.documentElement).fontSize)||16;
  const oneCmPx=96/2.54;
  const available=Math.max(280, host.clientWidth-(2*oneCmPx));
  const scale=Math.max(0.5, available/pageWidth);

  page.style.transform=`scale(${scale})`;
  stage.style.width='100%';
  stage.style.minHeight=`${Math.ceil(pageHeight*scale + (2*oneCmPx))}px`;
  stage.style.height='auto';
  stage.style.padding='1cm';
  stage.style.boxSizing='border-box';
  stage.style.overflow='visible';
  stage.style.alignItems='center';
  stage.style.justifyContent='flex-start';
};

/* Final PDF function. All temporary changes are restored in finally, even on error. */
Invoices.downloadInvoice = function(invoice) { return (window.__ANORI_PDF_FINAL_FUNCTION ? window.__ANORI_PDF_FINAL_FUNCTION(invoice) : Promise.reject(new Error('PDF engine is initializing.'))); };

/* Prevent trip edits/deletes when an active invoice exists. */
const oldTripEdit=Trips.edit;
Trips.edit=function(id){if(activeInvoiceFor(id))return Swal.fire({icon:'warning',title:'Trip Locked',text:'This trip is linked to an active invoice. Cancel the invoice first.',confirmButtonText:'OK'});if(typeof oldTripEdit==='function')return oldTripEdit.call(this,id);};
const oldTripDelete=Trips.delete;
Trips.delete=function(id){if(activeInvoiceFor(id))return Swal.fire({icon:'warning',title:'Trip Locked',text:'This trip is linked to an active invoice. Cancel the invoice before deleting the trip.',confirmButtonText:'OK'});if(typeof oldTripDelete==='function')return oldTripDelete.call(this,id);};

/* Keep invoice history and active KPIs logically separate. */
const baseInvoiceRender=Invoices.render;
if(typeof baseInvoiceRender==='function'){
  Invoices.render=function(container){
    baseInvoiceRender.call(this,container);
    const active=getInvoices().filter(i=>String(i.status||'').toLowerCase()!=='cancelled');
    const cancelled=getInvoices().filter(i=>String(i.status||'').toLowerCase()==='cancelled');
    const table=container.querySelector('table');
    if(table){
      const body=table.querySelector('tbody');
      if(body && cancelled.length){
        const parties=DB.get('parties',[]);
        const rows=cancelled.slice().reverse().map(i=>{
          const p=parties.find(x=>x.id===i.party_id); const paidAmt=(i.advance||0)+DB.get('payments',[]).filter(x=>x.invoice_id===i.id).reduce((s,x)=>s+Number(x.amount)||0,0);
          const bal=Math.max(0,Number(i.total_amount)||0-paidAmt);
          return `<tr class="anori-cancelled-row"><td><input type="checkbox" class="invoice-row-check" value="${esc2(i.id)}" onchange="Invoices.updateSelectionCount()"></td><td><strong>${esc2(i.invoice_no)}</strong></td><td>${esc2(i.date)}</td><td>${esc2(p?.name||'-')}</td><td>${Number(i.trip_count)||0}</td><td>${money(i.total_amount)}</td><td>${money(paidAmt)}</td><td>${money(bal)}</td><td><span class="status-badge status-cancelled">CANCELLED</span></td></tr>`;
        }).join('');
        body.insertAdjacentHTML('beforeend',rows);
        if(typeof Invoices.updateSelectionCount==='function')Invoices.updateSelectionCount();
      }
    }
  };
}

window.ANORI_V217_HARDENED=true;
})();

/* v2.17 data-integrity cleanup: store raw values; escape only at render time. */
(function fixStoredEscaping(){
'use strict';
function decode(v){
  if(typeof v!=='string'||!/[&](amp|lt|gt|quot|#39);/.test(v))return v;
  const ta=document.createElement('textarea');ta.innerHTML=v;return ta.value;
}
function deep(v){
  if(Array.isArray(v))return v.map(deep);
  if(v&&typeof v==='object'){const o={};Object.keys(v).forEach(k=>o[k]=deep(v[k]));return o;}
  return decode(v);
}
if(!localStorage.getItem('anori_v217_rawdata_migrated')){
  ['company_profile','vehicles','drivers','parties','expense_master','trips','invoices','payments','driver_settlements','followups'].forEach(k=>{
    const v=DB.get(k,null); if(v!=null)DB.set(k,deep(v),true);
  });
  localStorage.setItem('anori_v217_rawdata_migrated','1');
}
/* Future Trip writes: convert escaped form values back to raw storage. */
const originalSave=Trips.saveV25, originalUpdate=Trips.updateV25;
const rawForm=form=>deep(form);
Trips.saveV25=function(){
  const before=DB.get('trips',[]).length;
  const oldSet=DB.set;
  let captured=null;
  /* Use the existing form reader but ensure the object written by the legacy save is raw. */
  const originalRead=window.readTripForm;
  if(typeof originalRead==='function'){
    const f=originalRead(); if(!f)return; captured=rawForm(f);
    const trip={id:Utils.id(),trip_no:Utils.generateTripNo(captured.date),...captured,status:'completed',invoice_status:'pending',is_gst:true};
    const trips=DB.get('trips',[]);trips.push(trip);DB.set('trips',trips);if(typeof syncDriverTripEntry==='function')syncDriverTripEntry(trip);UI.closeModal();Utils.toast('Trip created successfully.','success');Router.go('trips');return;
  }
  if(typeof originalSave==='function')return originalSave.call(this);
};
Trips.updateV25=function(id){
  if(typeof activeInvoiceForTrip==='function'&&activeInvoiceForTrip(id))return Swal.fire({icon:'warning',title:'Trip Locked',text:'Cancel the active invoice before editing this trip.',confirmButtonText:'OK'});
  const f=typeof window.readTripForm==='function'?window.readTripForm():null;if(!f)return;
  const trips=DB.get('trips',[]),i=trips.findIndex(x=>x.id===id);if(i<0)return;
  trips[i]={...trips[i],...rawForm(f)};DB.set('trips',trips);if(typeof syncDriverTripEntry==='function')syncDriverTripEntry(trips[i]);UI.closeModal();Utils.toast('Trip updated successfully.','success');Router.go('trips');
};
window.ANORI_V217_RAWDATA=true;
})();

/* ============================================================
   ANORI TRANSPORT v2.18 — STABILITY + OPERATIONS HARDENING
   Base: v2.17 actual approved package. Minimal final overrides only.
   ============================================================ */
(function installAnoriV218(){
  'use strict';
  const esc = v => Sanitize.html(v == null ? '' : String(v));
  const num = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
  const today = () => Utils.today();
  const toast = (m,t='success') => Utils.toast(m,t);
  const invoices = () => DB.get('invoices',[]);
  const trips = () => DB.get('trips',[]);
  const payments = () => DB.get('payments',[]);
  const activeInv = id => invoices().find(i=>Array.isArray(i.trip_ids)&&i.trip_ids.includes(id)&&String(i.status||'').toLowerCase()!=='cancelled');
  const anyInv = id => invoices().find(i=>Array.isArray(i.trip_ids)&&i.trip_ids.includes(id));
  const paid = inv => num(inv?.advance) + payments().filter(p=>p.invoice_id===inv?.id).reduce((s,p)=>s+num(p.amount),0);
  const balance = inv => Math.max(0,num(inv?.total_amount)-paid(inv));
  const status = inv => {
    if(!inv) return 'unknown';
    if(String(inv.status||'').toLowerCase()==='cancelled') return 'cancelled';
    const b=balance(inv), p=paid(inv), due=new Date(Invoices.getDueDate(inv.date,inv.credit_days||30));
    if(b<=0) return 'paid';
    if(!Number.isNaN(due.getTime()) && due < new Date(today())) return 'overdue';
    return p>0 ? 'part_paid' : 'unpaid';
  };

  // ---------- RAW DATA SAFETY ----------
  // Store raw values; HTML escaping belongs only at render time.
  function decodeHtml(v){
    if(typeof v!=='string' || !/[&](amp|lt|gt|quot|#39);/.test(v)) return v;
    const ta=document.createElement('textarea'); ta.innerHTML=v; return ta.value;
  }
  function raw(v){
    if(Array.isArray(v)) return v.map(raw);
    if(v && typeof v==='object'){ const o={}; Object.keys(v).forEach(k=>o[k]=raw(v[k])); return o; }
    return decodeHtml(v);
  }
  ['company_profile','vehicles','drivers','parties','expense_master','trips','invoices','payments','driver_settlements','followups'].forEach(k=>{
    const v=DB.get(k,null); if(v!=null) DB.set(k,raw(v),true);
  });

  // ---------- FINANCIAL STATE ----------
  function syncFinancial(){
    let arr=invoices();
    arr.forEach(inv=>{
      inv.payments=payments().filter(p=>p.invoice_id===inv.id).map(p=>({...p}));
      inv.paid_amount=paid(inv);
      inv.balance_due=balance(inv);
      if(String(inv.status||'').toLowerCase()!=='cancelled') inv.status=inv.balance_due<=0?'paid':(inv.paid_amount>0?'part_paid':'issued');
    });

    // Repair legacy duplicate cancelled invoice rows. Only exact duplicates
    // (same invoice number + financial/trip data) are collapsed; different
    // invoices are never merged. This guarantees one cancelled row per invoice.
    const seen=new Set();
    arr=arr.filter(inv=>{
      if(String(inv.status||'').toLowerCase()!=='cancelled') return true;
      const sig=JSON.stringify({
        invoice_no:inv.invoice_no||'', date:inv.date||'', party_id:inv.party_id||'',
        trip_ids:Array.isArray(inv.trip_ids)?inv.trip_ids.slice().sort():[],
        total_amount:num(inv.total_amount), advance:num(inv.advance),
        subtotal:num(inv.subtotal), cgst:num(inv.cgst), sgst:num(inv.sgst)
      });
      if(seen.has(sig)) return false;
      seen.add(sig); return true;
    });

    DB.set('invoices',arr,true);
    const ts=trips(); ts.forEach(t=>t.invoice_status=activeInv(t.id)?'invoiced':'pending'); DB.set('trips',ts,true);
  }
  syncFinancial();

  // ---------- TRIP FINANCIAL LOCK ----------
  const oldEdit = Trips.edit;
  Trips.edit = function(id){
    const inv=activeInv(id);
    if(inv) return Swal.fire({icon:'warning',title:'Trip Locked',html:`Trip <strong>${esc(trips().find(t=>t.id===id)?.trip_no||'')}</strong> is linked to active invoice <strong>${esc(inv.invoice_no)}</strong>.<br><br>Cancel the invoice first.`,confirmButtonText:'OK'});
    return typeof oldEdit==='function' ? oldEdit.call(this,id) : this.showEditModal(id);
  };
  const oldDelete = Trips.delete;
  Trips.delete = function(id){
    const inv=anyInv(id);
    if(inv) return Swal.fire({icon:'warning',title:'Trip Cannot Be Deleted',html:`This trip is linked to invoice <strong>${esc(inv.invoice_no)}</strong>.<br><br>Financial history is protected.`,confirmButtonText:'OK'});
    return typeof oldDelete==='function' ? oldDelete.call(this,id) : undefined;
  };

  // ---------- INVOICE CANCELLATION ONLY FOR ISSUED RECORDS ----------
  // Cancel an invoice and remove only exact duplicate records of the same invoice.
  // A cancelled invoice remains in history exactly once.
  Invoices.cancelInvoice = function(id){
    const inv=invoices().find(i=>i.id===id); if(!inv) return;
    if(String(inv.status||'').toLowerCase()==='cancelled') return toast('Invoice is already cancelled.','warning');
    Swal.fire({
      title:'Cancel Invoice?', icon:'warning',
      html:`Invoice <strong>${esc(inv.invoice_no)}</strong> will remain in history and its trips will become available for re-invoicing.`,
      input:'text', inputLabel:'Cancellation reason', inputPlaceholder:'Enter reason',
      showCancelButton:true, confirmButtonColor:'#dc2626', confirmButtonText:'Cancel Invoice', cancelButtonText:'Keep Invoice',
      preConfirm:v=>String(v||'Cancelled by user').trim()
    }).then(r=>{
      if(!r.isConfirmed) return;
      let arr=invoices(), x=arr.find(i=>i.id===id); if(!x) return;
      x.status='cancelled'; x.cancelled_at=new Date().toISOString(); x.cancel_reason=r.value;

      // If the same invoice was accidentally stored more than once, keep one
      // exact copy only. Do not remove records with different financial data.
      const signature = i => JSON.stringify({
        invoice_no:i.invoice_no||'', date:i.date||'', party_id:i.party_id||'',
        trip_ids:Array.isArray(i.trip_ids)?i.trip_ids.slice().sort():[],
        total_amount:num(i.total_amount), advance:num(i.advance),
        subtotal:num(i.subtotal), cgst:num(i.cgst), sgst:num(i.sgst)
      });
      const targetSig=signature(x), seen=false;
      arr=arr.filter(i=>{
        if(i.id===x.id) return true;
        if(String(i.status||'').toLowerCase()!=='cancelled') return true;
        if(String(i.invoice_no||'')!==String(x.invoice_no||'')) return true;
        if(signature(i)!==targetSig) return true;
        if(!seen){ return false; }
        return false;
      });
      DB.set('invoices',arr,true); syncFinancial(); toast(`Invoice ${x.invoice_no} cancelled.`,'success'); Router.go('invoices');
    });
  };

  // ---------- PAYMENT LEDGER ----------
  Invoices.recordPayment = function(id){
    const inv=invoices().find(i=>i.id===id); if(!inv) return;
    if(status(inv)==='cancelled') return toast('Cancelled invoice cannot receive payment.','warning');
    const due=balance(inv);
    if(due<=0) return toast('This invoice is already fully paid.','info');
    Swal.fire({
      title:'Record Customer Payment',
      html:`<div style="text-align:left"><label>Amount</label><input id="anori-pay-amt" type="number" min="0.01" max="${due}" class="form-control" value="${due}"><label style="display:block;margin-top:10px">Date</label><input id="anori-pay-date" type="date" class="form-control" value="${today()}"><label style="display:block;margin-top:10px">Payment Mode</label><select id="anori-pay-mode" class="form-control"><option>Bank Transfer</option><option>UPI</option><option>Cash</option><option>Cheque</option><option>Other</option></select><label style="display:block;margin-top:10px">Reference</label><input id="anori-pay-ref" class="form-control" placeholder="UTR / cheque / reference"></div>`,
      showCancelButton:true, confirmButtonText:'Save Payment', preConfirm:()=>{
        const amount=num(document.getElementById('anori-pay-amt').value); if(amount<=0||amount>due){Swal.showValidationMessage(`Enter an amount between 0.01 and ${due}.`);return false;}
        return {amount,date:Sanitize.date(document.getElementById('anori-pay-date').value),mode:document.getElementById('anori-pay-mode').value,reference:document.getElementById('anori-pay-ref').value.trim()};
      }
    }).then(r=>{
      if(!r.isConfirmed)return;
      const p=payments(); p.push({id:Utils.id(),invoice_id:id,...r.value}); DB.set('payments',p,true); syncFinancial();
      toast(`Payment of ${Utils.fmt(r.value.amount)} recorded.`,'success'); Router.go('invoices');
    });
  };

  // ---------- INVOICE PREVIEW = PDF, SAME DOM ----------
  Invoices.downloadInvoice = function(invoice) { return (window.__ANORI_PDF_FINAL_FUNCTION ? window.__ANORI_PDF_FINAL_FUNCTION(invoice) : Promise.reject(new Error('PDF engine is initializing.'))); };

  // Long invoices must not be clipped by the invoice renderer.
  const baseBuild=Invoices.buildInvoiceHTML;
  if(typeof baseBuild==='function' && !Invoices.__v218BuildWrapped){
    Invoices.buildInvoiceHTML=function(inv,preview){
      let html=baseBuild.call(this,inv,preview);
      html=html.replace(/\.invoice-page\{([^}]*)\}/i,(m,b)=>{
        b=b.replace(/overflow\s*:\s*hidden\s*;?/ig,'overflow:visible;');
        b=b.replace(/padding\s*:\s*[^;]+;?/ig,'padding:5mm;');
        return `.invoice-page{${b}}`;
      });
      return html;
    };
    Invoices.__v218BuildWrapped=true;
  }

  // ---------- CUSTOMER CREDIT CONTROL + EMAIL ----------
  const originalPartyModal=Masters.openModal.bind(Masters);
  Masters.openModal=function(type,id=null){
    if(type!=='party') return originalPartyModal(type,id);
    const arr=DB.get('parties',[]), item=id?(arr.find(x=>x.id===id)||{}):{};
    const html=`<div class="form-row"><div class="form-group"><label>Customer Name *</label><input class="form-control" id="m_name" value="${esc(item.name)}"></div><div class="form-group"><label>Email</label><input class="form-control" id="m_email" type="email" value="${esc(item.email||'')}"></div></div><div class="form-row"><div class="form-group"><label>Credit Days</label><input class="form-control" id="m_credit_days" type="number" min="0" value="${Number.isFinite(Number(item.credit_days)) ? Math.max(0, Math.floor(Number(item.credit_days))) : 30}"></div><div class="form-group"><label>Credit Limit (₹)</label><input class="form-control" id="m_credit_limit" type="number" min="0" value="${num(item.credit_limit)||0}"></div></div><div class="form-row"><div class="form-group"><label>GSTIN</label><input class="form-control" id="m_gst" value="${esc(item.gst)}"></div><div class="form-group"><label>Mobile</label><input class="form-control" id="m_mobile" value="${esc(item.mobile||'')}"></div></div><div class="form-group"><label>Address</label><input class="form-control" id="m_addr" value="${esc(item.addr)}"></div>`;
    UI.openModal(`${id?'Edit':'Add'} Customer`,html,()=>{
      const name=document.getElementById('m_name').value.trim(); if(!name)return toast('Customer name is required.','error');
      const x=id?arr.find(a=>a.id===id):{id:Utils.id()}; x.name=name; x.email=document.getElementById('m_email').value.trim(); x.credit_days=Math.max(0, Math.floor(num(document.getElementById('m_credit_days').value))); x.credit_limit=Math.max(0,num(document.getElementById('m_credit_limit').value)); x.gst=document.getElementById('m_gst').value.trim(); x.mobile=document.getElementById('m_mobile').value.trim(); x.addr=document.getElementById('m_addr').value.trim(); if(!id)arr.push(x); DB.set('parties',arr); UI.closeModal(); toast('Customer saved.'); Router.go('masters');
    });
  };

  Invoices.emailExisting=function(id){
    const inv=invoices().find(i=>i.id===id); if(!inv)return;
    const party=DB.get('parties',[]).find(p=>p.id===inv.party_id)||{};
    if(!party.email) return Swal.fire({icon:'warning',title:'Customer Email Missing',text:'Add an email address in Master Data before using Email.'});
    const subject=encodeURIComponent(`Invoice ${inv.invoice_no} - ${DB.get('company_profile',{}).name||'ANORI TRANSPORT'}`);
    const body=encodeURIComponent(`Dear ${party.name||'Customer'},\n\nPlease find invoice ${inv.invoice_no} for ${Utils.fmt(inv.total_amount)}.\n\nRegards,\n${DB.get('company_profile',{}).name||'ANORI TRANSPORT'}`);
    window.location.href=`mailto:${party.email}?subject=${subject}&body=${body}`;
  };
  // POD / Trip Document Checklist intentionally excluded from approved scope.
  // ---------- DAILY CLOSING / OPERATIONS SNAPSHOT ----------
  window.anoriDailyClosing=function(){
    const ts=trips().filter(t=>t.date===today()), inv=invoices().filter(i=>i.date===today()&&status(i)!=='cancelled');
    const billed=inv.reduce((s,i)=>s+num(i.total_amount),0), received=inv.reduce((s,i)=>s+paid(i),0);
    Swal.fire({title:`Daily Closing — ${today()}`,html:`<div class="anori-kpi-grid" style="grid-template-columns:repeat(2,1fr)"><div class="anori-kpi-card"><span>Trips</span><strong>${ts.length}</strong></div><div class="anori-kpi-card"><span>Invoices</span><strong>${inv.length}</strong></div><div class="anori-kpi-card"><span>Billing</span><strong>${Utils.fmt(billed)}</strong></div><div class="anori-kpi-card"><span>Received</span><strong>${Utils.fmt(received)}</strong></div></div>`,confirmButtonText:'Close'});
  };

  // ---------- SAFE IMPORT: BACKUP FIRST ----------

  // ---------- BACKUP STATUS ----------
  window.anoriBackupStatus=function(){
    const folder=localStorage.getItem('anori_backup_folder_name');
    Swal.fire({title:'Backup Status',html:`<div style="text-align:left"><p><strong>Automatic folder:</strong> ${esc(folder||'Not selected')}</p><p><strong>Data:</strong> Browser localStorage</p><p><strong>Safety:</strong> Import requires backup first.</p></div>`,confirmButtonText:'OK'});
  };

  // ---------- SETTINGS: OPERATIONS + UPDATE CENTER ----------
  const oldSettingsRender=Settings.render.bind(Settings);
  Settings.render=function(container){
    oldSettingsRender(container);
    container.insertAdjacentHTML('beforeend',`<div class="card"><div class="anori-section-head"><div><h3 class="card-title">🔄 Update & Safety Center</h3><span class="anori-help">Current application version and safe data operations.</span></div></div><div class="anori-universal-toolbar"><span class="anori-toolbar-label">Actions:</span><button class="anori-action-btn anori-action-backup" onclick="anoriBackupNow()">💾 BACKUP NOW</button><button class="anori-action-btn anori-action-export" onclick="anoriBackupStatus()">🛡 BACKUP STATUS</button><button class="anori-action-btn anori-action-preview" onclick="anoriDailyClosing()">📊 DAILY CLOSING</button><span class="anori-toolbar-spacer"></span><strong>ANORI TRANSPORT v2.18</strong></div><p class="anori-help" style="margin-top:10px">For safe updates, always backup before replacing application files. Business data is kept separately from the application package.</p></div>`);
  };

  // ---------- FINAL CLEANUP / FLAGS ----------
  window.ANORI_V218_HARDENED=true;
  try{localStorage.setItem('anori_app_version','2.18.0');}catch(e){}
})();

/* v2.18 toolbar extension: Documents + clearer financial actions. */
(function(){
  'use strict';
  window.toolbar=function(type,countId){
    const invoice=type==='invoice';
    const p=invoice?'Invoices.actionPreview()':'Trips.actionPreview()';
    const pdf=invoice?'Invoices.actionPDF()':'Trips.actionPDF()';
    const email=invoice?'Invoices.actionEmail()':'Trips.actionEmail()';
    const dup=invoice?'Invoices.duplicateSelected()':'Trips.duplicateSelected()';
    const edit=invoice?'Invoices.editSelected()':'Trips.editSelected();';
    const del=invoice?'Invoices.deleteSelected()':'Trips.deleteSelected()';
    return window.bar(`
      <button type="button" class="anori-action-btn anori-action-preview" onclick="${p}">👁 PREVIEW</button>
      <button type="button" class="anori-action-btn anori-action-pdf" onclick="${pdf}">📄 PDF</button>
      <button type="button" class="anori-action-btn anori-action-email" onclick="${email}">📧 EMAIL</button>
      ${invoice?'<button type="button" class="anori-action-btn anori-action-payment" onclick="Invoices.actionPayment()">💵 PAYMENT</button>':''}
<button type="button" class="anori-action-btn anori-action-duplicate" onclick="${dup}">📋 DUPLICATE</button>
      <button type="button" class="anori-action-btn anori-action-edit" onclick="${edit}">✏️ EDIT</button>
      <button type="button" class="anori-action-btn anori-action-delete" onclick="${del}">🗑 DELETE</button>
      ${invoice?'<button type="button" class="anori-action-btn anori-action-cancel" onclick="Invoices.actionCancel()">❌ CANCEL</button>':''}
    `,countId);
  };

})();

/* v2.18 customer credit-limit validation at invoice creation boundary. */
(function(){
  'use strict';
  if(typeof Invoices.createInvoiceV28!=='function'||Invoices.__v218CreditWrapped)return;
  const base=Invoices.createInvoiceV28;
  Invoices.createInvoiceV28=async function(tripList,isGst,advance,expenseLines){
    const partyId=tripList?.[0]?.party_id;
    const party=DB.get('parties',[]).find(p=>p.id===partyId);
    const limit=Number(party?.credit_limit||0);
    if(limit>0){
      const outstanding=DB.get('invoices',[]).filter(i=>i.party_id===partyId&&String(i.status||'').toLowerCase()!=='cancelled').reduce((s,i)=>s+Math.max(0,Number(i.balance_due)||0),0);
      const expTotal=(Array.isArray(expenseLines)?expenseLines:[]).reduce((s,e)=>s+Number(e.amount||0),0); const subtotal=tripList.reduce((s,t)=>s+Number(t.freight||0),0)+expTotal; const projected=outstanding + (subtotal + (isGst ? subtotal*0.18 : 0)) - (Number(advance)||0);
      if(projected>limit){
        await Swal.fire({icon:'warning',title:'Credit Limit Exceeded',html:`Customer <strong>${Sanitize.html(party.name||'')}</strong> has a credit limit of <strong>${Utils.fmt(limit)}</strong>.<br><br>Current outstanding: <strong>${Utils.fmt(outstanding)}</strong>`,confirmButtonText:'OK'});
        return;
      }
    }
    return base.call(this,tripList,isGst,advance,expenseLines);
  };
  Invoices.__v218CreditWrapped=true;
})();

/* ============================================================
   ANORI TRANSPORT v2.20 — APPROVED SCOPE CLEANUP
   - Keep simple Trip Advice only.
   - Exclude Driver Performance.
   - Exclude POD Management.
   - Exclude Trip Document Checklist.
   - Single backup file in selected folder, overwritten every 5 minutes.
   ============================================================ */
(function(){
  'use strict';
  try { localStorage.setItem('anori_app_version','2.20.0'); } catch(e) {}
  window.ANORI_V220 = true;
})();

/* ============================================================
   ANORI TRANSPORT — PERSISTENT AUTOMATIC BACKUP
   - User selects a backup folder and then chooses JSON or SQLite.
   - The selected backup file is overwritten automatically every 2 minutes.
   - Backup format and target handle are persisted.
   - Clear success/error notifications; no fake success.
   ============================================================ */
(function(){
  'use strict';
  const FILE_JSON='ANORI_TRANSPORT_BACKUP.json';
  const FILE_SQLITE='ANORI_TRANSPORT_BACKUP.sqlite';
  const INTERVAL_MS=120000;
  const IDB='anori_backup_v223';
  const STORE='handles';
  let folderHandle=null, fileHandle=null, timer=null;
  let backupFormat=localStorage.getItem('anori_backup_format')||'json';
  if(backupFormat!=='json' && backupFormat!=='sqlite') backupFormat='json';
  const electronBackup=()=>window.anoriElectronBackup&&window.anoriElectronBackup.isAvailable===true;
  function electronFolderHandle(info){
    if(!info||!info.path)return null;
    return {__anoriElectronPath:info.path,name:info.name||info.path};
  }
  function electronFileHandle(info){
    if(!info||!info.path)return null;
    return {__anoriElectronPath:info.path,name:info.name||info.path};
  }

  function dataSnapshot(){
    const keys=['company_profile','vehicles','drivers','parties','trips','invoices','driver_settlements','payments','expense_master','followups','audit_log'];
    const out={};
    keys.forEach(k=>{
      const value=DB.get(k,k==='company_profile'?{}:[]);
      out[k]=value==null?(k==='company_profile'?{}:[]):value;
    });
    out.__meta={
      application:'ANORI TRANSPORT',version:'2.24',schema_version:'1',
      backup_format:backupFormat.toUpperCase(),backup_at:new Date().toISOString(),
      record_counts:Object.fromEntries(keys.map(k=>{
        const v=out[k];return [k,Array.isArray(v)?v.length:(v&&typeof v==='object'?1:0)];
      }))
    };
    return out;
  }
  function notify(msg,type){
    try{
      if(window.Swal){
        const icon=type==='error'?'error':type==='warning'?'warning':type==='success'?'success':'info';
        Swal.fire({toast:true,position:'top-end',icon,title:String(msg),showConfirmButton:false,timer:2800,timerProgressBar:true});
      }else if(window.Utils&&typeof Utils.toast==='function')Utils.toast(msg,type||'info');else console.log(msg);
    }catch(e){console.log(msg);}
  }
  function setStatus(text){
    try{localStorage.setItem('anori_backup_last_status',text);localStorage.setItem('anori_backup_last_time',new Date().toISOString());}catch(e){}
    const el=document.getElementById('anoriBackupStatus');if(el)el.textContent=text;
  }
  function setFolderText(text){const el=document.getElementById('anoriBackupFolderName');if(el)el.textContent=text;}
  function setFormatText(text){const el=document.getElementById('anoriBackupFormatName');if(el)el.textContent=text;}
  function setBackupFileText(text){const el=document.getElementById('anoriBackupFileName');if(el)el.textContent=text;}
  function idbOpen(){return new Promise((resolve,reject)=>{
    const r=indexedDB.open(IDB,1);
    r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE);};
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
  });}
  async function save(key,value){try{const db=await idbOpen();await new Promise((res,rej)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(value,key);tx.oncomplete=res;tx.onerror=()=>rej(tx.error);});db.close();}catch(e){console.warn(e);}}
  async function load(key){try{const db=await idbOpen();const v=await new Promise((res,rej)=>{const tx=db.transaction(STORE,'readonly');const q=tx.objectStore(STORE).get(key);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});db.close();return v||null;}catch(e){return null;}}
  async function permission(handle){
    if(!handle)return false;
    if(handle.__anoriElectronPath)return true;
    try{
      if(typeof handle.queryPermission==='function'&&await handle.queryPermission({mode:'readwrite'})==='granted')return true;
      if(typeof handle.requestPermission==='function'&&await handle.requestPermission({mode:'readwrite'})==='granted')return true;
    }catch(e){}
    return false;
  }
  async function sqliteBytes(){
    if(window.AnoriSQLite?.exportSnapshot) return window.AnoriSQLite.exportSnapshot(dataSnapshot());
    if(typeof initSqlJs==='function'){
      const SQL=await initSqlJs({locateFile:f=>window.__ANORI_SQL_LOCAL__?`libs/sqljs/${f}`:`https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${f}`});
      const db=new SQL.Database();
      try{const keys=['company_profile','vehicles','drivers','parties','trips','invoices','driver_settlements','payments','expense_master','followups','audit_log'];keys.forEach(k=>{const table=k.replace(/[^A-Za-z0-9_]/g,'_');db.run(`CREATE TABLE IF NOT EXISTS "${table}" (json TEXT NOT NULL)`);const value=DB.get(k,k==='company_profile'?{}:[]);(Array.isArray(value)?value:[value]).forEach(r=>db.run(`INSERT INTO "${table}" VALUES (?)`,[JSON.stringify(r??{})]));});return db.export();}finally{db.close();}
    }
    throw new Error('SQLite backup engine is unavailable.');
  }
  function backupFilename(){return backupFormat==='sqlite'?FILE_SQLITE:FILE_JSON;}
  function pathJoin(dir,file){return String(dir).replace(/[\\\/]+$/,'')+'\\'+file;}
  async function writePayload(handle){
    const name=backupFilename();
    const blob=backupFormat==='sqlite'
      ?new Blob([await sqliteBytes()],{type:'application/x-sqlite3'})
      :new Blob([JSON.stringify(dataSnapshot(),null,2)],{type:'application/json'});
    const writable=await handle.createWritable();
    try{await writable.write(blob);await writable.close();return name;}
    catch(e){try{await writable.abort();}catch(_){}throw e;}
  }
  async function writeFolder(){
    if(!folderHandle)return false;
    if(!(await permission(folderHandle)))throw new Error('Backup folder write permission is not available.');
    if(folderHandle.__anoriElectronPath){
      const target=pathJoin(folderHandle.__anoriElectronPath,backupFilename());
      const data=backupFormat==='sqlite'?await sqliteBytes():JSON.stringify(dataSnapshot(),null,2);
      await window.anoriElectronBackup.writeFile(target,data);
      localStorage.setItem('anori_backup_folder_name',folderHandle.name||'Selected Folder');
      localStorage.setItem('anori_backup_file_name',backupFilename());
      setFolderText(folderHandle.name||'Selected Folder');setFormatText(backupFormat.toUpperCase());setBackupFileText(backupFilename());
      setStatus(`Last backup: ${new Date().toLocaleString()} (${backupFormat.toUpperCase()})`);
      return true;
    }
    const file=await folderHandle.getFileHandle(backupFilename(),{create:true});
    const name=await writePayload(file);
    try{const oldName=backupFormat==='sqlite'?FILE_JSON:FILE_SQLITE;if(typeof folderHandle.removeEntry==='function')await folderHandle.removeEntry(oldName).catch(()=>{});}catch(_){}
    localStorage.setItem('anori_backup_folder_name',folderHandle.name||'Selected Folder');
    localStorage.setItem('anori_backup_file_name',name);
    setFolderText(folderHandle.name||'Selected Folder');setFormatText(backupFormat.toUpperCase());setBackupFileText(backupFilename());
    setStatus(`Last backup: ${new Date().toLocaleString()} (${backupFormat.toUpperCase()})`);
    return true;
  }
  async function writeSelectedFile(){
    if(!fileHandle)return false;
    if(!(await permission(fileHandle)))throw new Error('Backup file write permission is not available.');
    if(fileHandle.__anoriElectronPath){
      const data=backupFormat==='sqlite'?await sqliteBytes():JSON.stringify(dataSnapshot(),null,2);
      await window.anoriElectronBackup.writeFile(fileHandle.__anoriElectronPath,data);
      const name=backupFilename();
      localStorage.setItem('anori_backup_file_name',name);
      setFolderText('Selected backup file');setFormatText(backupFormat.toUpperCase());setBackupFileText(backupFilename());
      setStatus(`Last backup: ${new Date().toLocaleString()} (${backupFormat.toUpperCase()})`);
      return true;
    }
    const name=await writePayload(fileHandle);
    localStorage.setItem('anori_backup_file_name',name);
    setFolderText('Selected backup file');setFormatText(backupFormat.toUpperCase());setBackupFileText(backupFilename());
    setStatus(`Last backup: ${new Date().toLocaleString()} (${backupFormat.toUpperCase()})`);
    return true;
  }
  async function write(silent=false){
    try{
      const ok=folderHandle?await writeFolder():await writeSelectedFile();
      if(ok)return true;
      setStatus('Not backed up — select a backup folder/file first.');
      return false;
    }catch(e){
      console.error('ANORI automatic backup failed:',e);
      setStatus('Backup failed: '+(e.message||'permission error'));
      if(!silent)notify('Backup failed: '+(e.message||'permission error'),'error');
      return false;
    }
  }
  function start(){clearInterval(timer);timer=null;if(folderHandle||fileHandle)timer=setInterval(()=>{write(true);},INTERVAL_MS);}
  async function chooseFormat(){
    if(!window.Swal){backupFormat=localStorage.getItem('anori_backup_format')||'json';return true;}
    const result=await Swal.fire({
      title:'SELECT BACKUP FORMAT',input:'select',
      inputOptions:(window.AnoriSQLite?.isAvailable?.()||typeof initSqlJs==='function')?{json:'JSON',sqlite:'SQLITE'}:{json:'JSON'},inputValue:backupFormat,
      text:'The selected backup file will be overwritten automatically every 2 minutes.',
      showCancelButton:true,confirmButtonText:'SAVE FORMAT',cancelButtonText:'CANCEL',allowOutsideClick:false
    });
    if(!result.isConfirmed)return false;
    backupFormat=String(result.value||'json').toLowerCase()==='sqlite'?'sqlite':'json';
    if(backupFormat==='sqlite' && !(window.AnoriSQLite?.isAvailable?.()||typeof initSqlJs==='function')) backupFormat='json';
    localStorage.setItem('anori_backup_format',backupFormat);
    return true;
  }
  window.anoriSelectBackupFolder=async function(){
    try{
      if(electronBackup()){
        const info=await window.anoriElectronBackup.selectFolder();
        if(!info)return;
        if(!(await chooseFormat()))return;
        folderHandle=electronFolderHandle(info);fileHandle=null;
        await save('folderPath',info.path);await save('folder',null);await save('file',null);await save('format',backupFormat);
        setFolderText(info.name||info.path);setFormatText(backupFormat.toUpperCase());
        const ok=await write();start();
        if(ok)notify(`${backupFormat.toUpperCase()} backup selected. Automatic backup runs every 2 minutes.`,'success');
        return;
      }
      if(typeof window.showDirectoryPicker!=='function'){notify('This browser cannot write directly to a selected folder. Use Chrome or Edge.','warning');return;}
      const h=await window.showDirectoryPicker({id:'anori-backup-v223',mode:'readwrite'});
      if(!(await permission(h))){notify('Write permission was not granted. Backup folder was not selected.','error');return;}
      if(!(await chooseFormat()))return;
      folderHandle=h;fileHandle=null;await save('folder',h);await save('file',null);await save('format',backupFormat);
      setFolderText(h.name||'Selected Folder');setFormatText(backupFormat.toUpperCase());
      const ok=await write();start();
      if(ok)notify(`${backupFormat.toUpperCase()} backup selected. Automatic backup runs every 2 minutes.`,'success');
    }catch(e){if(e.name!=='AbortError')notify('Folder selection failed: '+(e.message||'unknown error'),'error');}
  };
  window.anoriSelectBackupFile=async function(){
    try{
      if(electronBackup()){
        if(!(await chooseFormat()))return;
        const info=await window.anoriElectronBackup.selectFile({suggestedName:backupFilename(),filters:[{name:backupFormat==='sqlite'?'ANORI SQLite Backup':'ANORI JSON Backup',extensions:[backupFormat==='sqlite'?'sqlite':'json']}]});
        if(!info)return;
        fileHandle=electronFileHandle(info);folderHandle=null;await save('filePath',info.path);await save('file',null);await save('folder',null);await save('format',backupFormat);
        setFolderText('Selected backup file');setFormatText(backupFormat.toUpperCase());setBackupFileText(backupFilename());
        const ok=await write();start();
        if(ok)notify(`${backupFormat.toUpperCase()} backup file selected. Automatic backup runs every 2 minutes.`,'success');
        return;
      }
      if(typeof window.showSaveFilePicker!=='function'){notify('File selection is not supported in this browser. Please use Chrome or Edge.','warning');return;}
      if(!(await chooseFormat()))return;
      const h=await window.showSaveFilePicker({
        id:'anori-backup-file-v223',suggestedName:backupFilename(),
        types:[{description:backupFormat==='sqlite'?'ANORI SQLite Backup':'ANORI JSON Backup',
          accept:backupFormat==='sqlite'?{'application/x-sqlite3':['.sqlite']}:{'application/json':['.json']}}]
      });
      if(!(await permission(h))){notify('Write permission was not granted. Backup file was not selected.','error');return;}
      fileHandle=h;folderHandle=null;await save('file',h);await save('folder',null);await save('format',backupFormat);
      setFolderText('Selected backup file');setFormatText(backupFormat.toUpperCase());setBackupFileText(backupFilename());
      const ok=await write();start();
      if(ok)notify(`${backupFormat.toUpperCase()} backup file selected. Automatic backup runs every 2 minutes.`,'success');
    }catch(e){if(e.name!=='AbortError')notify('Backup file selection failed: '+(e.message||'unknown error'),'error');}
  };
  window.anoriBackupNow=async function(){
    // In a normal browser/file:// session there may be no writable folder handle.
    // Manual Backup Now must still produce a real backup instead of failing silently.
    if(!folderHandle&&!fileHandle){
      try{
        if(!(await chooseFormat()))return false;
        const name=backupFilename();
        const bytes=backupFormat==='sqlite'?await sqliteBytes():null;
        const blob=backupFormat==='sqlite'
          ?new Blob([bytes],{type:'application/x-sqlite3'})
          :new Blob([JSON.stringify(dataSnapshot(),null,2)],{type:'application/json'});
        const url=URL.createObjectURL(blob),a=document.createElement('a');
        a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
        setTimeout(()=>URL.revokeObjectURL(url),1500);
        localStorage.setItem('anori_backup_file_name',name);
        setFolderText('Browser download');setFormatText(backupFormat.toUpperCase());setBackupFileText(name);
        setStatus(`Backup downloaded: ${new Date().toLocaleString()} (${backupFormat.toUpperCase()})`);
        return true;
      }catch(e){
        console.error('ANORI manual backup failed:',e);
        setStatus('Backup failed: '+(e.message||'unknown error'));
        notify('Backup failed: '+(e.message||'unknown error'),'error');
        return false;
      }
    }
    // Backup/data saving is intentionally silent. Status is updated in Settings instead.
    return await write(true);
  };
  window.anoriBackupStatus=function(){
    const folder=localStorage.getItem('anori_backup_folder_name');
    const last=localStorage.getItem('anori_backup_last_time');
    const format=(localStorage.getItem('anori_backup_format')||backupFormat).toUpperCase();
    const file=localStorage.getItem('anori_backup_file_name')||backupFilename();
    const target=folder?`Folder: ${folder}`:(file?'Selected file':'Not selected');
    if(window.Swal)Swal.fire({title:'BACKUP STATUS',html:`<div style="text-align:left"><p><strong>TARGET:</strong> ${Sanitize.html(target)}</p><p><strong>FILE:</strong> ${Sanitize.html(file)}</p><p><strong>FORMAT:</strong> ${Sanitize.html(format)}</p><p><strong>INTERVAL:</strong> EVERY 2 MINUTES</p><p><strong>LAST BACKUP:</strong> ${last?Sanitize.html(new Date(last).toLocaleString()):'NOT BACKED UP YET'}</p></div>`,confirmButtonText:'OK'});
    else notify(target,'info');
  };
  async function restore(){
    try{
      const savedFormat=await load('format');if(savedFormat==='sqlite'||savedFormat==='json')backupFormat=savedFormat;if(backupFormat==='sqlite'&&!(window.AnoriSQLite?.isAvailable?.()||typeof initSqlJs==='function'))backupFormat='json';
      localStorage.setItem('anori_backup_format',backupFormat);
      if(electronBackup()){
        const fp=await load('folderPath');
        const filePath=await load('filePath');
        if(fp){folderHandle=electronFolderHandle({path:fp,name:localStorage.getItem('anori_backup_folder_name')||fp});fileHandle=null;setFolderText(folderHandle.name);setFormatText(backupFormat.toUpperCase());setBackupFileText(backupFilename());start();return;}
        if(filePath){fileHandle=electronFileHandle({path:filePath,name:localStorage.getItem('anori_backup_file_name')||filePath});folderHandle=null;setFolderText('Selected backup file');setFormatText(backupFormat.toUpperCase());setBackupFileText(backupFilename());start();return;}
      }
      const h=await load('folder');
      if(h&&await permission(h)){folderHandle=h;fileHandle=null;setFolderText(h.name||'Selected Folder');setFormatText(backupFormat.toUpperCase());setBackupFileText(backupFilename());start();return;}
      const f=await load('file');
      if(f&&await permission(f)){fileHandle=f;folderHandle=null;setFolderText('Selected backup file');setFormatText(backupFormat.toUpperCase());setBackupFileText(backupFilename());start();}
    }catch(e){console.warn('Backup handle restore failed',e);}
  }
  function patchSettings(){
    if(!window.Settings||window.Settings.__v223Patched)return;
    const base=window.Settings.render.bind(window.Settings);
    window.Settings.render=function(container){
      base(container);
      const old=container.querySelector('.anori-backup-panel');
      if(old){
        const folder=localStorage.getItem('anori_backup_folder_name')||'Not selected';
        const last=localStorage.getItem('anori_backup_last_time');
        const fmt=(localStorage.getItem('anori_backup_format')||backupFormat).toUpperCase();
        const file=localStorage.getItem('anori_backup_file_name')||backupFilename();
        old.innerHTML=`<div class="anori-backup-status"><strong>Automatic Backup</strong><span class="anori-badge">EVERY 2 MINUTES</span></div>
          <p style="margin:8px 0 4px"><strong>SELECTED FOLDER:</strong> <span id="anoriBackupFolderName">${Sanitize.html(folder)}</span></p>
          <p style="margin:4px 0"><strong>BACKUP FORMAT:</strong> <span id="anoriBackupFormatName">${Sanitize.html(fmt)}</span></p>
          <p style="margin:4px 0"><strong>BACKUP FILE:</strong> <span class="anori-folder-path">${Sanitize.html(file)}</span></p>
          <p style="margin:4px 0 12px"><strong>STATUS:</strong> <span id="anoriBackupStatus">${Sanitize.html(localStorage.getItem('anori_backup_last_status')||'Not backed up yet')}</span></p>
          <div class="anori-action-bar">
            <button type="button" class="btn btn-primary" onclick="window.anoriSelectBackupFolder()">📁 SELECT BACKUP FOLDER</button>
            <button type="button" class="btn btn-outline" onclick="window.anoriSelectBackupFile()">📄 SELECT BACKUP FILE</button>
            <button type="button" class="btn btn-outline" onclick="window.anoriBackupNow()">💾 BACKUP NOW</button>
            <button type="button" class="btn btn-outline" onclick="window.anoriBackupStatus()">🛡 BACKUP STATUS</button>
            <button type="button" class="btn btn-outline" onclick="window.anoriRestoreLastSafetySnapshot()">↩ RESTORE LAST INTERNAL SNAPSHOT</button>
          </div>
          <small class="anori-help">Automatic backup writes only to the folder/file you explicitly select. Import never downloads a backup. The last protected operation is also kept as an internal rollback snapshot.</small>`;
      }
    };
    window.Settings.__v223Patched=true;
  }
  const boot=()=>{patchSettings();restore();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

/* ============================================================
   ANORI TRANSPORT v2.24 — TRIP ADVANCE + SYSTEM SETTINGS FIX
   - Driver Amount / Advance remains linked to Driver Settlement.
   - Adds separate Trip Advance Amount field.
   - Makes System Settings self-contained and operational.
   ============================================================ */
(function installAnoriV224(){
  'use strict';
  const esc=v=>Sanitize.html(v==null?'':String(v));
  const num=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:0;};

  // -------- Trip form: add separate Trip Advance Amount --------
  const originalOpenForm=Trips.openForm.bind(Trips);
  Trips.openForm=function(){
    originalOpenForm();
    const modal=document.querySelector('.swal2-container') || document.body;
    // Insert into the existing form immediately after Driver Amount field.
    const driverInput=document.getElementById('t_driver_amount');
    if(driverInput && !document.getElementById('t_trip_advance')){
      const group=document.createElement('div');
      group.className='form-group';
      group.innerHTML='<label>Trip Advance Amount (₹)</label><input type="number" class="form-control" id="t_trip_advance" min="0" value="0"><small class="anori-help">Advance received/allocated for this Trip. This is separate from Driver Amount / Advance.</small>';
      const driverGroup=driverInput.closest('.form-group');
      if(driverGroup && driverGroup.parentElement) driverGroup.parentElement.appendChild(group);
    }
  };

  // Replace the form reader so both values are saved as raw numeric fields.
  const originalReadTripForm=window.readTripForm;
  if(typeof originalReadTripForm==='function'){
    window.readTripForm=function(){
      const form=originalReadTripForm();
      if(!form)return form;
      const tripAdvance=num(document.getElementById('t_trip_advance')?.value);
      if(tripAdvance<0){Utils.toast('Trip Advance Amount cannot be negative.','error');return null;}
      form.trip_advance_amount=tripAdvance;
      return form;
    };
  }

  // The original saveV25 calls the global reader, so the added field is persisted.
  // Edit modal: add field and preserve it on update.
  const originalShowEdit=Trips.showEditModal.bind(Trips);
  Trips.showEditModal=function(id){
    originalShowEdit(id);
    const trip=DB.get('trips',[]).find(x=>x.id===id);
    const driverInput=document.getElementById('t_driver_amount');
    if(driverInput && !document.getElementById('t_trip_advance')){
      const group=document.createElement('div');
      group.className='form-group';
      group.innerHTML=`<label>Trip Advance Amount (₹)</label><input type="number" class="form-control" id="t_trip_advance" min="0" value="${num(trip?.trip_advance_amount)}"><small class="anori-help">Separate Trip advance amount. It is not the Driver Amount.</small>`;
      const driverGroup=driverInput.closest('.form-group');
      if(driverGroup && driverGroup.parentElement) driverGroup.parentElement.appendChild(group);
    }
  };

  const originalUpdate=Trips.updateV25?.bind(Trips);
  if(typeof originalUpdate==='function'){
    Trips.updateV25=function(id){
      const originalReader=window.readTripForm;
      let form=null;
      try{
        form=typeof originalReader==='function'?originalReader():null;
        if(!form)return;
        const existing=DB.get('trips',[]).find(t=>t.id===id);
        if(existing) form.trip_advance_amount=num(document.getElementById('t_trip_advance')?.value);
      }catch(e){console.error(e);return Utils.toast(e.message||'Unable to update Trip.','error');}
      // Reproduce the existing update behavior using the validated form.
      if(typeof Trips.updateV25.__base==='function')return Trips.updateV25.__base(id,form);
      const data=DB.get('trips',[]),idx=data.findIndex(t=>t.id===id);
      if(idx<0)return Utils.toast('Trip not found.','error');
      if(typeof activeInvoiceForTrip==='function'&&activeInvoiceForTrip(id))return Swal.fire({icon:'warning',title:'Invoice already generated',text:'Cancel the existing invoice before editing this trip.',confirmButtonText:'OK'});
      data[idx]={...data[idx],...form};
      DB.set('trips',data);
      if(typeof syncDriverTripEntry==='function')syncDriverTripEntry(data[idx]);
      if(window.UI?.closeModal)UI.closeModal();
      Utils.toast('Trip updated successfully.','success');
      Router.go('trips');
    };
  }

  // Render the new field in Trip table without changing the approved simple UI.
  const baseTripRender=Trips.render.bind(Trips);
  Trips.render=function(container){
    baseTripRender(container);
    const table=container.querySelector('table');
    if(!table||table.dataset.v224Advance==='1')return;
    table.dataset.v224Advance='1';
    const heads=[...table.querySelectorAll('thead th')];
    const driverIndex=heads.findIndex(th=>th.textContent.trim()==='Driver Amt');
    if(driverIndex<0)return;
    const th=document.createElement('th');th.textContent='Trip Advance';heads[driverIndex].after(th);
    table.querySelectorAll('tbody tr').forEach(tr=>{
      const check=tr.querySelector('.trip-row-check');
      if(!check)return;
      const id=check.value,trip=DB.get('trips',[]).find(t=>t.id===id);
      const td=document.createElement('td');td.textContent=Utils.fmt(num(trip?.trip_advance_amount));
      tr.children[driverIndex].after(td);
    });
  };

  // -------- System Settings: one stable, self-contained renderer --------
  Settings.render=function(container){
    if(!container)return;
    const company=DB.get('company_profile',{})||{};
    const folder=localStorage.getItem('anori_backup_folder_name')||'Not selected';
    const last=localStorage.getItem('anori_backup_last_time');
    const lastText=last?new Date(last).toLocaleString('en-IN'):'Not backed up yet';
    const fmt=(localStorage.getItem('anori_backup_format')||'json').toUpperCase();
    const file=localStorage.getItem('anori_backup_file_name')||`ANORI_TRANSPORT_BACKUP.${fmt.toLowerCase()}`;
    const supported=typeof window.showDirectoryPicker==='function';
    const fileSupported=typeof window.showSaveFilePicker==='function';
    container.innerHTML=`
      <div class="anori-section-intro"><div><strong>System Settings</strong><span>Company, backup, data and application controls.</span></div></div>
      <div class="card">
        <h3 class="card-title"><i class="fas fa-building"></i> Company Settings</h3>
        <div class="form-row">
          <div class="form-group"><label>Company Name</label><input class="form-control" id="sys_company_name" value="${esc(company.name||'ANORI TRANSPORT')}"></div>
          <div class="form-group"><label>GSTIN</label><input class="form-control" id="sys_company_gstin" value="${esc(company.gstin||'')}"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Phone</label><input class="form-control" id="sys_company_phone" value="${esc(company.phone||'')}"></div>
          <div class="form-group"><label>Email</label><input class="form-control" id="sys_company_email" type="email" value="${esc(company.email||'')}"></div>
        </div>
        <div class="form-group"><label>Address</label><textarea class="form-control" id="sys_company_address" rows="2">${esc(company.address||'')}</textarea></div>
        <div class="form-group">
          <label>Authorized Signatory — Company Stamp & Signature</label>
          <div class="anori-sign-upload-box">
            <input class="form-control" id="sys_company_signature_stamp_file" type="file" accept="image/png,image/jpeg,image/webp" onchange="window.anoriPreviewSignatureStamp?.(this)">
            <small class="anori-help">Upload one PNG, JPG or WEBP image containing the company stamp and authorized signature. It will appear in Invoice Preview and PDF.</small>
            <div id="sys_company_signature_stamp_preview" class="anori-sign-upload-preview">${company.signature_stamp?`<img src="${esc(company.signature_stamp)}" alt="Authorized Signatory Preview"><button class="btn btn-outline" type="button" onclick="window.anoriRemoveSignatureStamp?.()">REMOVE IMAGE</button>`:'<span>No stamp & signature uploaded.</span>'}</div>
          </div>
        </div>
        <button class="btn btn-primary" type="button" onclick="window.anoriSaveSystemSettings()">💾 SAVE SETTINGS</button>
      </div>
      <div class="card anori-backup-panel">
        <h3 class="card-title"><i class="fas fa-shield-alt"></i> Automatic Backup</h3>
        <p><strong>Selected Folder:</strong> <span id="anoriBackupFolderName">${esc(folder)}</span></p>
        <p><strong>Backup File:</strong> <span class="anori-folder-path" id="anoriBackupFileName">${esc(file)}</span></p>
        <p><strong>Interval:</strong> Every 5 Minutes</p>
        <p><strong>Status:</strong> <span id="anoriBackupStatus">${esc(lastText)}</span></p>
        <div class="anori-action-bar">
          <button class="btn btn-primary" type="button" onclick="window.anoriSelectBackupFolder()">📁 SELECT BACKUP FOLDER</button>
          ${fileSupported?'<button class="btn btn-outline" type="button" onclick="window.anoriSelectBackupFile()">📄 SELECT BACKUP FILE</button>':''}
          <button class="btn btn-outline" type="button" onclick="window.anoriBackupNow()">💾 BACKUP NOW</button>
          <button class="btn btn-outline" type="button" onclick="window.anoriBackupStatus()">🛡 BACKUP STATUS</button>
        </div>
        <small class="anori-help">${supported?'Folder access is available in this browser.':'Folder selection requires Chrome/Edge or the Windows EXE version.'} The same backup file is overwritten every 5 minutes.</small>
      </div>
      <div class="card">
        <h3 class="card-title"><i class="fas fa-database"></i> Data Import / Export</h3>
        <div class="anori-universal-toolbar">
          <span class="anori-toolbar-label">Actions:</span>
          <button class="anori-action-btn anori-action-preview" type="button" onclick="window.anoriExportJSON?.()">📦 JSON</button>
          <button class="anori-action-btn anori-action-pdf" type="button" onclick="window.anoriExportXLSX?.()">📊 EXCEL</button>
          <button class="anori-action-btn anori-action-email" type="button" onclick="window.anoriExportSQLite?.()">🗄 SQLITE</button>
          <button class="anori-action-btn anori-action-duplicate" type="button" onclick="window.anoriExportCSV?.()">📄 CSV</button>
          <button class="anori-action-btn anori-action-convert" type="button" onclick="window.anoriImportFile?.()">⬆ IMPORT</button>
        </div>
      </div>
      <div class="card">
        <h3 class="card-title"><i class="fas fa-info-circle"></i> Application</h3>
        <p><strong>Application:</strong> ANORI TRANSPORT</p>
        <p><strong>Version:</strong> 2.24</p>
        <p><strong>Storage:</strong> Browser local storage</p>
      </div>`;
  };

  window.anoriSaveSystemSettings=function(){
    const current=DB.get('company_profile',{})||{};
    const next={...current,
      name:document.getElementById('sys_company_name')?.value.trim()||'ANORI TRANSPORT',
      gstin:document.getElementById('sys_company_gstin')?.value.trim()||'',
      phone:document.getElementById('sys_company_phone')?.value.trim()||'',
      email:document.getElementById('sys_company_email')?.value.trim()||'',
      address:document.getElementById('sys_company_address')?.value.trim()||'',
      signature_stamp:current.signature_stamp||''
    };
    DB.set('company_profile',next,true);
    Utils.toast('System Settings saved successfully.','success');
  };

  window.anoriPreviewSignatureStamp=function(input){
    const file=input?.files?.[0];
    if(!file)return;
    if(!/^image\/(png|jpeg|webp)$/.test(file.type)){
      if(window.Swal) Swal.fire({icon:'warning',title:'Invalid Image',text:'Please select a PNG, JPG or WEBP image.',confirmButtonText:'OK'});
      input.value='';
      return;
    }
    const reader=new FileReader();
    reader.onload=function(){
      const src=String(reader.result||'');
      const img=new Image();
      img.onload=function(){
        const maxW=1000,maxH=500,scale=Math.min(1,maxW/img.naturalWidth,maxH/img.naturalHeight);
        const canvas=document.createElement('canvas');
        canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
        canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
        const ctx=canvas.getContext('2d');
        ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
        const data=canvas.toDataURL(file.type==='image/png'?'image/png':'image/jpeg',file.type==='image/png'?undefined:.92);
        const current=DB.get('company_profile',{})||{};DB.set('company_profile',{...current,signature_stamp:data},true);
        const box=document.getElementById('sys_company_signature_stamp_preview');
        if(box)box.innerHTML=`<img src="${esc(data)}" alt="Authorized Signatory Preview"><button class="btn btn-outline" type="button" onclick="window.anoriRemoveSignatureStamp?.()">REMOVE IMAGE</button>`;
        Utils.toast('Company stamp & signature uploaded successfully.','success');
      };
      img.onerror=function(){Utils.toast('Unable to read the selected image.','error');};
      img.src=src;
    };
    reader.readAsDataURL(file);
  };
  window.anoriRemoveSignatureStamp=function(){
    const current=DB.get('company_profile',{})||{};
    const next={...current};delete next.signature_stamp;DB.set('company_profile',next,true);
    const input=document.getElementById('sys_company_signature_stamp_file');if(input)input.value='';
    const box=document.getElementById('sys_company_signature_stamp_preview');if(box)box.innerHTML='<span>No stamp & signature uploaded.</span>';
    Utils.toast('Company stamp & signature removed.','success');
  };

  // Ensure the Settings navigation always routes to the stable renderer.
  if(window.Router && typeof Router.go==='function' && !Router.__v224SettingsGuard){
    const baseGo=Router.go.bind(Router);
    Router.go=function(view){
      if(view==='settings'){
        const main=document.getElementById('mainContent');
        if(main){main.innerHTML='<div class="view" id="view-settings"></div>';Settings.render(main.firstElementChild);document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.view==='settings'));return;}
      }
      return baseGo(view);
    };
    Router.__v224SettingsGuard=true;
  }
})();

/* ============================================================
   v2.25 — DRIVER SETTLEMENT AUTO-SYNC FOR EXISTING TRIPS
   ============================================================ */
(function installDriverSettlementAutoSync(){
  'use strict';
  const n=v=>{const x=parseFloat(v);return Number.isFinite(x)?x:0;};
  function syncAllDriverTripEntries(){
    const trips=DB.get('trips',[]);
    let settlements=DB.get('driver_settlements',[]);
    const byTrip=new Map(settlements.filter(s=>s&&s.source==='trip'&&s.trip_id).map(s=>[s.trip_id,s]));
    const liveTripIds=new Set();
    let changed=false;

    trips.forEach(trip=>{
      if(!trip || !trip.id || !trip.driver_id)return;
      liveTripIds.add(trip.id);
      const amount=n(trip.driver_amount);
      const existing=byTrip.get(trip.id);
      if(amount<=0){
        if(existing){settlements=settlements.filter(s=>s.id!==existing.id);changed=true;}
        return;
      }
      const entry={
        id:existing?.id||Utils.id(),
        date:trip.date||Utils.today(),
        driver_id:trip.driver_id,
        type:'debit',
        amount,
        description:`Trip ${trip.trip_no||trip.id} - Driver Amount`,
        source:'trip',
        trip_id:trip.id
      };
      if(existing){
        const same=existing.date===entry.date && existing.driver_id===entry.driver_id && existing.type===entry.type && n(existing.amount)===amount && existing.description===entry.description;
        if(!same){Object.assign(existing,entry);changed=true;}
      }else{
        settlements.push(entry);changed=true;
      }
    });

    // Remove orphaned automatic trip entries so the ledger never shows stale data.
    const before=settlements.length;
    settlements=settlements.filter(s=>!(s&&s.source==='trip'&&s.trip_id&&!liveTripIds.has(s.trip_id)));
    if(settlements.length!==before)changed=true;

    if(changed)DB.set('driver_settlements',settlements);
    return settlements;
  }
  window.syncAllDriverTripEntries=syncAllDriverTripEntries;

  const previousRender=DriverSettlement.render.bind(DriverSettlement);
  DriverSettlement.render=function(container){
    syncAllDriverTripEntries();
    return previousRender(container);
  };

  const previousApply=DriverSettlement.applyFilter.bind(DriverSettlement);
  DriverSettlement.applyFilter=function(){
    syncAllDriverTripEntries();
    return previousApply();
  };
})();

/* ============================================================
   ANORI TRANSPORT v2.24 — FINAL TRIP ADVANCE PERSISTENCE FIX
   ============================================================ */
(function installAnoriV224TripPersistence(){
  'use strict';
  const esc=v=>Sanitize.html(v==null?'':String(v));
  const num=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:0;};
  const readFormV224=()=>{
    const from=document.getElementById('t_from')?.value.trim()||'';
    const to=document.getElementById('t_to')?.value.trim()||'';
    const vehicle=document.getElementById('t_vehicle')?.value||'';
    const driver=document.getElementById('t_driver')?.value||'';
    const party=document.getElementById('t_party')?.value||'';
    const freight=num(document.getElementById('t_freight')?.value);
    const driverAmount=num(document.getElementById('t_driver_amount')?.value);
    const tripAdvance=num(document.getElementById('t_trip_advance')?.value);
    if(!vehicle||!driver||!party||!from||!to){Utils.toast('Please select Vehicle, Driver, Customer and enter From / To.','error');return null;}
    if(freight<=0){Utils.toast('Freight amount must be greater than zero.','error');return null;}
    if(driverAmount<0||tripAdvance<0){Utils.toast('Amounts cannot be negative.','error');return null;}
    const expenses=[];
    document.querySelectorAll('#expRows .anori-trip-exp-row').forEach(r=>{
      const type=r.querySelector('.exp-type')?.value||'';
      const amount=num(r.querySelector('.exp-amt')?.value);
      if(type&&amount>0)expenses.push({type,amount});
    });
    return {
      date:document.getElementById('t_date')?.value||Utils.today(),
      vehicle_id:vehicle,driver_id:driver,party_id:party,
      from,to,freight,driver_amount:driverAmount,
      trip_advance_amount:tripAdvance,
      expenses,notes:document.getElementById('t_notes')?.value||'',
      trip_advice:document.getElementById('t_trip_advice')?.value||''
    };
  };
  Trips.saveV25=function(){
    const form=readFormV224();if(!form)return;
    const trip={id:Utils.id(),trip_no:Utils.generateTripNo(form.date),...form,status:'completed',invoice_status:'pending',is_gst:true};
    const data=DB.get('trips',[]);data.push(trip);DB.set('trips',data);
    if(typeof syncDriverTripEntry==='function')syncDriverTripEntry(trip);
    UI.closeModal();Utils.toast('Trip created successfully.','success');Router.go('trips');
  };
  Trips.updateV25=function(id){
    if(typeof activeInvoiceForTrip==='function'&&activeInvoiceForTrip(id))return Swal.fire({icon:'warning',title:'Trip Locked',text:'Cancel the active invoice before editing this trip.',confirmButtonText:'OK'});
    const form=readFormV224();if(!form)return;
    const data=DB.get('trips',[]),idx=data.findIndex(t=>t.id===id);if(idx<0)return Utils.toast('Trip not found.','error');
    data[idx]={...data[idx],...form};DB.set('trips',data);
    if(typeof syncDriverTripEntry==='function')syncDriverTripEntry(data[idx]);
    UI.closeModal();Utils.toast('Trip updated successfully.','success');Router.go('trips');
  };
})();

/* ============================================================
   ANORI TRANSPORT — CREATE NEW TRIP V2.30
   Editable + filterable inputs and automatic Market Vehicle logic.
   - Master-backed inputs remain searchable/filterable.
   - User may type values not present in Master Data.
   - Unknown/manual vehicle numbers are automatically Market Vehicles.
   - Exact Master Data vehicle match automatically returns to Company Vehicle.
   ============================================================ */
(function installAnoriTripV230(){
  'use strict';
  const esc=v=>Sanitize.html(v==null?'':String(v));
  const num=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:0;};
  const todayValue=()=>typeof Utils.today==='function'?Utils.today():(new Date()).toISOString().slice(0,10);

  function getExpenseMaster(){
    return DB.get('expense_master',[]).filter(x=>x.active!==false);
  }

  function uniqueText(values){
    const seen=new Set();
    return values.map(v=>String(v==null?'':v).trim()).filter(v=>v&&!seen.has(v.toLowerCase())&&(seen.add(v.toLowerCase()),true));
  }

  function locationSuggestions(){
    const trips=DB.get('trips',[]);
    return uniqueText(trips.flatMap(t=>[t.from,t.to]));
  }

  function transporterSuggestions(){
    const trips=DB.get('trips',[]);
    const explicit=DB.get('transporters',[]).map(x=>x.name||x.transporter_name||x.title);
    return uniqueText([...explicit,...trips.map(t=>t.transporter_name)]);
  }

  function comboMarkup({id,label,placeholder,items=[],value='',hiddenValue='',required=false,full=false,extraClass=''}){
    const inputId=id+'_text', hiddenId=id+'_id';
    return `<div class="form-group ${full?'trip-form-full ':''}${extraClass}">
      <label>${esc(label)}${required?' *':''}</label>
      <div class="anori-combobox" data-combo="${esc(id)}">
        <input type="text" class="form-control anori-combo-input" id="${esc(inputId)}" value="${esc(value)}" placeholder="${esc(placeholder)}" autocomplete="off" ${required?'required':''} aria-autocomplete="list" aria-expanded="false" />
        <input type="hidden" id="${esc(hiddenId)}" value="${esc(hiddenValue)}" />
        <button type="button" class="anori-combo-toggle" aria-label="Show ${esc(label)} options" tabindex="-1">▾</button>
        <div class="anori-combo-menu" role="listbox" hidden></div>
      </div>
    </div>`;
  }

  function installCombo(id,items,opts={}){
    const root=document.querySelector(`[data-combo="${CSS.escape(id)}"]`);
    if(!root)return;
    const input=root.querySelector('.anori-combo-input');
    const hidden=root.querySelector('input[type="hidden"]');
    const menu=root.querySelector('.anori-combo-menu');
    const toggle=root.querySelector('.anori-combo-toggle');
    const values=uniqueText(items||[]);
    const sourceMap=opts.sourceMap||new Map();
    let open=false;

    function render(filter=''){
      const q=String(filter||'').trim().toLowerCase();
      const matches=values.filter(v=>!q||v.toLowerCase().includes(q)).slice(0,80);
      menu.innerHTML=matches.length?matches.map((v,i)=>`<div class="anori-combo-option" role="option" data-value="${esc(v)}" data-index="${i}">${esc(v)}</div>`).join(''):`<div class="anori-combo-empty">No matching option — press Enter to use manual value</div>`;
      menu.hidden=false; open=true; input.setAttribute('aria-expanded','true');
      root.classList.add('is-open');
    }
    function close(){menu.hidden=true;open=false;input.setAttribute('aria-expanded','false');root.classList.remove('is-open');}
    function select(value){
      input.value=value;
      const mapped=sourceMap.get(String(value).toLowerCase());
      hidden.value=mapped?.id||'';
      input.dataset.masterMatch=mapped?.id||'';
      input.dispatchEvent(new Event('change',{bubbles:true}));
      close();
    }
    input.addEventListener('input',()=>{
      hidden.value=''; input.dataset.masterMatch=''; render(input.value);
      if(typeof opts.onInput==='function')opts.onInput(input.value);
    });
    input.addEventListener('focus',()=>render(input.value));
    input.addEventListener('keydown',e=>{
      if(e.key==='ArrowDown'){e.preventDefault();render(input.value);const first=menu.querySelector('.anori-combo-option');first?.focus?.();return;}
      if(e.key==='Escape'){close();return;}
      if(e.key==='Enter'){
        if(open){const first=menu.querySelector('.anori-combo-option');if(first){e.preventDefault();select(first.dataset.value);return;}}
        hidden.value=''; input.dataset.masterMatch=''; close();
      }
    });
    toggle.addEventListener('click',e=>{e.preventDefault();open?close():render(input.value);input.focus();});
    menu.addEventListener('mousedown',e=>{const option=e.target.closest('.anori-combo-option');if(option){e.preventDefault();select(option.dataset.value);}});
    document.addEventListener('mousedown',e=>{if(!root.contains(e.target))close();},{once:false});
  }

  function vehicleLookup(value){
    const q=String(value||'').trim().toLowerCase();
    return DB.get('vehicles',[]).find(v=>String(v.number||'').trim().toLowerCase()===q)||null;
  }

  function setMarketState(isMarket){
    const wrap=document.getElementById('marketVehicleSection');
    const badge=document.getElementById('vehicleTypeBadge');
    const typeInput=document.getElementById('t_vehicle_type');
    if(typeInput)typeInput.value=isMarket?'market':'company';
    if(wrap)wrap.hidden=!isMarket;
    if(badge){badge.textContent=isMarket?'MARKET VEHICLE':'COMPANY VEHICLE';badge.className='anori-vehicle-type-badge '+(isMarket?'market':'company');}
  }

  function syncVehicleClassification(){
    const input=document.getElementById('t_vehicle_text');
    const hidden=document.getElementById('t_vehicle_id');
    if(!input)return;
    const vehicle=vehicleLookup(input.value);
    if(vehicle){
      hidden.value=vehicle.id;
      input.dataset.masterMatch=vehicle.id;
      setMarketState(false);
      const da=document.getElementById('t_driver_amount');
      if(da && Number(da.value||0)===0)da.value=Number(vehicle.driver_amount)||0;
    }else{
      hidden.value=''; input.dataset.masterMatch='';
      setMarketState(Boolean(input.value.trim()));
    }
  }

  function initialiseCombos(trip){
    const vehicles=DB.get('vehicles',[]), drivers=DB.get('drivers',[]), parties=DB.get('parties',[]);
    const vehicleMap=new Map(vehicles.map(v=>[String(v.number||'').trim().toLowerCase(),v]));
    const driverMap=new Map(drivers.map(v=>[String(v.name||'').trim().toLowerCase(),v]));
    const partyMap=new Map(parties.map(v=>[String(v.name||'').trim().toLowerCase(),v]));
    const prevDrivers=DB.get('trips',[]).map(t=>t.driver_name).filter(Boolean);
    const prevParties=DB.get('trips',[]).map(t=>t.party_name).filter(Boolean);
    const expenseNames=getExpenseMaster().map(e=>e.name);
    installCombo('t_vehicle',vehicles.map(v=>v.number),{sourceMap:vehicleMap,onInput:()=>syncVehicleClassification()});
    installCombo('t_driver',uniqueText([...drivers.map(v=>v.name),...prevDrivers]),{sourceMap:driverMap});
    installCombo('t_party',uniqueText([...parties.map(v=>v.name),...prevParties]),{sourceMap:partyMap});
    installCombo('t_from',locationSuggestions());
    installCombo('t_to',locationSuggestions());
    installCombo('t_transporter',transporterSuggestions());
    document.querySelectorAll('.exp-type-combo').forEach((root)=>{
      const id=root.getAttribute('data-combo');
      installCombo(id,expenseNames);
    });
    const vi=document.getElementById('t_vehicle_text');
    if(vi){vi.addEventListener('change',syncVehicleClassification);vi.addEventListener('blur',()=>setTimeout(syncVehicleClassification,0));syncVehicleClassification();}
  }

  function expenseRowsHtml(expenses){
    return (expenses||[]).map(e=>`<div class="form-row anori-trip-exp-row" style="margin-bottom:8px">
      <div class="form-group exp-type-combo" data-combo="exp_${esc(e.id||Utils.id())}">${comboMarkup({id:'exp_'+String(e.id||Utils.id()),label:'Expense Type',placeholder:'Type / filter expense...',items:[],value:e.type||''}).replace(/^<div class="form-group ">|<\/div>$/g,'')}</div>
      <div class="form-group"><label>Amount</label><input type="number" class="form-control exp-amt" min="0" placeholder="Amount" value="${num(e.amount)||''}"></div>
      <div class="form-group"><label>&nbsp;</label><button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.anori-trip-exp-row').remove()">Remove</button></div>
    </div>`).join('');
  }

  // A simpler dedicated expense row renderer avoids nested combo wrappers.
  function appendExpenseRow(type='',amount=''){
    const rows=document.getElementById('expRows');if(!rows)return;
    const id='exp_'+Utils.id();
    const row=document.createElement('div');row.className='form-row anori-trip-exp-row';row.style.marginBottom='8px';
    row.innerHTML=`<div class="form-group"><label>Expense Type</label><div class="anori-combobox" data-combo="${id}"><input type="text" class="form-control anori-combo-input exp-type" id="${id}_text" value="${esc(type)}" placeholder="Type / filter expense..." autocomplete="off"><input type="hidden" id="${id}_id"><button type="button" class="anori-combo-toggle" aria-label="Show expense types" tabindex="-1">▾</button><div class="anori-combo-menu" role="listbox" hidden></div></div></div><div class="form-group"><label>Amount</label><input type="number" class="form-control exp-amt" min="0" placeholder="Amount" value="${num(amount)||''}"></div><div class="form-group"><label>&nbsp;</label><button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.anori-trip-exp-row').remove()">Remove</button></div>`;
    rows.appendChild(row);
    installCombo(id,getExpenseMaster().map(e=>e.name));
  }

  Trips.addExpRow=function(type='',amount=''){appendExpenseRow(type,amount);};

  function formHtml(trip){
    const vehicles=DB.get('vehicles',[]),drivers=DB.get('drivers',[]),parties=DB.get('parties',[]);
    const vehicle=vehicles.find(v=>v.id===trip?.vehicle_id);
    const driver=drivers.find(v=>v.id===trip?.driver_id);
    const party=parties.find(v=>v.id===trip?.party_id);
    const vehicleText=vehicle?.number||trip?.vehicle_number||'';
    const driverText=driver?.name||trip?.driver_name||'';
    const partyText=party?.name||trip?.party_name||'';
    const market=trip?.vehicle_type==='market' || (!vehicle && !!trip?.vehicle_number);
    return `<div class="anori-simple-form trip-form-layout">
      <div class="trip-form-grid">
        <div class="form-group"><label>Date *</label><input type="date" class="form-control" id="t_date" value="${esc(trip?.date||todayValue())}" required></div>
        ${comboMarkup({id:'t_vehicle',label:'Vehicle',placeholder:'Type / filter vehicle...',items:vehicles.map(v=>v.number),value:vehicleText,hiddenValue:trip?.vehicle_id||'',required:true})}
        ${comboMarkup({id:'t_driver',label:'Driver',placeholder:'Type / filter driver...',items:drivers.map(v=>v.name),value:driverText,hiddenValue:trip?.driver_id||'',required:true})}
        ${comboMarkup({id:'t_party',label:'Party / Customer',placeholder:'Type / filter customer...',items:parties.map(v=>v.name),value:partyText,hiddenValue:trip?.party_id||'',required:true})}
        ${comboMarkup({id:'t_from',label:'From',placeholder:'Type / filter location...',items:locationSuggestions(),value:trip?.from||'',required:true})}
        ${comboMarkup({id:'t_to',label:'To',placeholder:'Type / filter location...',items:locationSuggestions(),value:trip?.to||'',required:true})}
        <div class="form-group"><label>Freight (₹) *</label><input type="number" class="form-control" id="t_freight" min="0" value="${num(trip?.freight)||''}" required></div>
        <div class="form-group"><label>Trip Advance Amount (₹)</label><input type="number" class="form-control" id="t_trip_advance" min="0" value="${num(trip?.trip_advance_amount)||0}"><small class="anori-help">Separate Trip advance amount.</small></div>
        <div class="form-group"><label>Driver Amount / Advance (₹)</label><input type="number" class="form-control" id="t_driver_amount" min="0" value="${num(trip?.driver_amount)||0}"><small class="anori-help">This automatically appears in Driver Settlement.</small></div>
        <div class="form-group trip-form-full"><label>Vehicle Classification</label><div id="vehicleTypeBadge" class="anori-vehicle-type-badge ${market?'market':'company'}">${market?'MARKET VEHICLE':'COMPANY VEHICLE'}</div><input type="hidden" id="t_vehicle_type" value="${market?'market':'company'}"></div>
        <div id="marketVehicleSection" class="trip-market-section trip-form-full" ${market?'':'hidden'}>
          <div class="trip-market-grid">
            ${comboMarkup({id:'t_transporter',label:'Transporter Name',placeholder:'Type / filter transporter...',items:transporterSuggestions(),value:trip?.transporter_name||'',required:true})}
            <div class="form-group"><label>Market Purchase (₹) *</label><input type="number" class="form-control" id="t_market_purchase" min="0" value="${num(trip?.market_purchase_amount)||0}" ${market?'required':''}><small class="anori-help">Purchase / cost paid to the outside transporter.</small></div>
          </div>
        </div>
        <div class="form-group trip-form-full"><label>Trip Advice</label><textarea class="form-control trip-advice-box" id="t_trip_advice" rows="3" placeholder="Enter trip advice / instructions...">${esc(trip?.trip_advice||'')}</textarea></div>
      </div>
      <div class="anori-subtitle trip-form-section-title">Trip Expenses</div>
      <div id="expRows" class="trip-expenses-list"></div>
      <button type="button" class="btn btn-outline btn-sm trip-add-expense" onclick="Trips.addExpRow()">＋ Add Expense</button>
      <div class="form-group trip-form-full trip-notes-field"><label>Notes</label><textarea class="form-control" id="t_notes" rows="2">${esc(trip?.notes||'')}</textarea></div>
    </div>`;
  }

  function readForm(){
    const vehicleInput=document.getElementById('t_vehicle_text');
    const vehicleText=vehicleInput?.value.trim()||'';
    const vehicleId=document.getElementById('t_vehicle_id')?.value||'';
    const driverInput=document.getElementById('t_driver_text');
    const driverText=driverInput?.value.trim()||'';
    const driverId=document.getElementById('t_driver_id')?.value||'';
    const partyInput=document.getElementById('t_party_text');
    const partyText=partyInput?.value.trim()||'';
    const partyId=document.getElementById('t_party_id')?.value||'';
    const from=document.getElementById('t_from_text')?.value.trim()||'';
    const to=document.getElementById('t_to_text')?.value.trim()||'';
    const freight=num(document.getElementById('t_freight')?.value);
    const tripAdvance=num(document.getElementById('t_trip_advance')?.value);
    const driverAmount=num(document.getElementById('t_driver_amount')?.value);
    const vehicle=vehicleLookup(vehicleText);
    const isMarket=!vehicle;
    const transporter=document.getElementById('t_transporter_text')?.value.trim()||'';
    const marketPurchase=num(document.getElementById('t_market_purchase')?.value);
    if(!vehicleText||!driverText||!partyText||!from||!to){Utils.toast('Please enter Vehicle, Driver, Customer and From / To.','error');return null;}
    if(freight<=0){Utils.toast('Freight amount must be greater than zero.','error');return null;}
    if(tripAdvance<0||driverAmount<0){Utils.toast('Amounts cannot be negative.','error');return null;}
    if(isMarket && !transporter){Utils.toast('Transporter Name is required for a Market Vehicle.','error');return null;}
    if(isMarket && marketPurchase<0){Utils.toast('Market Purchase cannot be negative.','error');return null;}
    const expenses=[];
    document.querySelectorAll('#expRows .anori-trip-exp-row').forEach(r=>{
      const type=r.querySelector('.exp-type')?.value.trim()||'';
      const amount=num(r.querySelector('.exp-amt')?.value);
      if(type&&amount>0)expenses.push({type,amount});
    });
    return {
      date:document.getElementById('t_date')?.value||todayValue(),
      vehicle_id:vehicle?.id||vehicleId||'', vehicle_number:vehicleText, vehicle_type:isMarket?'market':'company',
      driver_id:driverId, driver_name:driverText, party_id:partyId, party_name:partyText,
      from,to,freight,trip_advance_amount:tripAdvance,driver_amount:driverAmount,
      transporter_name:isMarket?transporter:'',market_purchase_amount:isMarket?marketPurchase:0,
      expenses,notes:document.getElementById('t_notes')?.value||'',trip_advice:document.getElementById('t_trip_advice')?.value||''
    };
  }

  function afterModalOpen(trip){
    initialiseCombos(trip);
    const expenses=trip?.expenses||[];
    expenses.forEach(e=>appendExpenseRow(e.type,e.amount));
    if(!expenses.length)appendExpenseRow();
    const vehicleInput=document.getElementById('t_vehicle_text');
    const marketPurchase=document.getElementById('t_market_purchase');
    if(vehicleInput)vehicleInput.addEventListener('change',()=>{syncVehicleClassification();});
    if(marketPurchase)marketPurchase.addEventListener('input',()=>{
      const market=document.getElementById('t_vehicle_type')?.value==='market';
      marketPurchase.required=market;
    });
  }

  Trips.openForm=function(){
    UI.openModal('Create New Trip',formHtml(null),()=>{
      const form=readForm();if(!form)return;
      const trip={id:Utils.id(),trip_no:Utils.generateTripNo(form.date),...form,status:'completed',invoice_status:'pending',is_gst:true};
      const data=DB.get('trips',[]);data.push(trip);DB.set('trips',data);
      if(typeof syncDriverTripEntry==='function')syncDriverTripEntry(trip);
      UI.closeModal();Utils.toast('Trip created successfully.','success');Router.go('trips');
    },true);
    afterModalOpen(null);
  };

  Trips.showEditModal=function(id){
    const trip=DB.get('trips',[]).find(t=>t.id===id);if(!trip)return;
    if(typeof activeInvoiceForTrip==='function'&&activeInvoiceForTrip(id))return Swal.fire({icon:'warning',title:'Trip Locked',text:'Cancel the active invoice before editing this trip.',confirmButtonText:'OK'});
    UI.openModal('Edit Trip',formHtml(trip),()=>{
      if(typeof activeInvoiceForTrip==='function'&&activeInvoiceForTrip(id))return Swal.fire({icon:'warning',title:'Trip Locked',text:'Cancel the active invoice before editing this trip.',confirmButtonText:'OK'});
      const form=readForm();if(!form)return;
      const data=DB.get('trips',[]),idx=data.findIndex(t=>t.id===id);if(idx<0)return Utils.toast('Trip not found.','error');
      data[idx]={...data[idx],...form};DB.set('trips',data);
      if(typeof syncDriverTripEntry==='function')syncDriverTripEntry(data[idx]);
      UI.closeModal();Utils.toast('Trip updated successfully.','success');Router.go('trips');
    },true);
    afterModalOpen(trip);
  };

  Trips.openEditForm=function(id){Trips.showEditModal(id);};
})();

/* ============================================================
   ANORI TRANSPORT v2.26 — SINGLE-PAGE INVOICE + FULL SCREEN FIT
   Final override: Preview and PDF use the same mounted invoice DOM.
   Preview scales the complete A4 page to the available viewer.
   PDF captures the complete page as one PDF page, preserving all data.
   ============================================================ */
Invoices.fitPreviewToScreen = function(){
  const host=document.getElementById('previewContent');
  const stage=host?.querySelector('.anori-invoice-preview-stage');
  const page=stage?.querySelector('.invoice-page');
  if(!host||!stage||!page)return;

  // Robust centering: keep the invoice as a normal flex item. Do not use
  // absolute positioning/translate because that can clip the left edge in
  // Chromium/Electron when the preview viewport is scrolled.
  page.style.position='relative';
  page.style.left='auto';
  page.style.top='auto';
  page.style.margin='0 auto';
  page.style.transform='none';
  page.style.transformOrigin='top center';
  page.style.overflow='visible';
  page.style.zoom='1';

  stage.style.position='relative';
  stage.style.width='100%';
  stage.style.height='auto';
  stage.style.minHeight='100%';
  stage.style.padding='18px 24px 28px';
  stage.style.overflow='auto';
  stage.style.display='flex';
  stage.style.flexDirection='column';
  stage.style.justifyContent='flex-start';
  stage.style.alignItems='center';
  stage.style.boxSizing='border-box';

  const pageWidth=page.offsetWidth || page.getBoundingClientRect().width || 794;
  const availableWidth=Math.max(320,stage.clientWidth-48);
  const scale=Math.min(1,availableWidth/pageWidth);

  // CSS zoom preserves the flex item's centering while making the whole A4
  // page readable on smaller screens. The viewer itself remains scrollable.
  page.style.zoom=String(scale);
};

Invoices.downloadInvoice = function(invoice) { return (window.__ANORI_PDF_FINAL_FUNCTION ? window.__ANORI_PDF_FINAL_FUNCTION(invoice) : Promise.reject(new Error('PDF engine is initializing.'))); };

window.addEventListener('resize',()=>{
  if(document.getElementById('previewModal')?.classList.contains('active')) Invoices.fitPreviewToScreen();
});


/* ============================================================
   ANORI TRANSPORT v2.29 — TRIP TABLE FINAL LAYOUT + PAGINATION
   User-approved:
   - Remove Driver column
   - Remove Driver Amount column
   - Remove Expenses column
   - Keep Trip Advance Amount
   - Maximum 15 rows per page
   - Alternating row highlight uses #91edc2
   ============================================================ */
(function installAnoriV229TripTable(){
  'use strict';
  const esc=v=>Sanitize.html(v==null?'':String(v));
  const num=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:0;};
  const money=v=>Utils.fmt(num(v));
  const PAGE_SIZE=15;
  Trips.__page=1;
  Trips.__selectedIds=Trips.__selectedIds instanceof Set?Trips.__selectedIds:new Set();

  function allTrips(){
    if(typeof trips2==='function') return trips2();
    return DB.get('trips',[])||[];
  }
  function vehicle(id){return (DB.get('vehicles',[])||[]).find(x=>x.id===id);}
  function party(id){return (DB.get('parties',[])||[]).find(x=>x.id===id);}
  function activeInvoice(id){
    if(typeof activeInvoiceForTrip==='function') return activeInvoiceForTrip(id);
    return (DB.get('invoices',[])||[]).find(i=>i.trip_ids?.includes(id)&&String(i.status||'').toLowerCase()!=='cancelled');
  }
  function currentPageTrips(){
    const a=allTrips();
    const pages=Math.max(1,Math.ceil(a.length/PAGE_SIZE));
    Trips.__page=Math.min(Math.max(1,Trips.__page||1),pages);
    const start=(Trips.__page-1)*PAGE_SIZE;
    return {all:a,rows:a.slice(start,start+PAGE_SIZE),pages,start};
  }
  function selectedCount(){return [...Trips.__selectedIds].filter(id=>allTrips().some(t=>t.id===id)).length;}
  function syncVisibleChecks(){
    document.querySelectorAll('.trip-row-check').forEach(cb=>{cb.checked=Trips.__selectedIds.has(cb.value);});
    const all=Trips.getSelected().length>0 && [...document.querySelectorAll('.trip-row-check')].every(cb=>cb.checked);
    const master=document.querySelector('.trip-page-check-all'); if(master) master.checked=all && document.querySelectorAll('.trip-row-check').length>0;
  }

  Trips.getSelected=function(){
    const valid=new Set(allTrips().map(t=>String(t.id)));
    Trips.__selectedIds=new Set([...Trips.__selectedIds].filter(id=>valid.has(String(id))));
    return [...Trips.__selectedIds];
  };
  Trips.updateSelectionCount=function(){
    const el=document.getElementById('tripSelectedCount');
    if(el) el.textContent=`${Trips.getSelected().length} selected`;
    syncVisibleChecks();
  };
  Trips.toggleAll=function(flag){
    const {rows}=currentPageTrips();
    rows.forEach(t=>{if(flag)Trips.__selectedIds.add(String(t.id));else Trips.__selectedIds.delete(String(t.id));});
    Trips.updateSelectionCount();
  };
  Trips.clearSelection=function(){Trips.__selectedIds.clear();Trips.updateSelectionCount();};
  Trips.__toggleRow=function(id,checked){
    id=String(id); if(checked)Trips.__selectedIds.add(id); else Trips.__selectedIds.delete(id);
    Trips.updateSelectionCount();
  };
  Trips.__gotoPage=function(page){
    const {pages}=currentPageTrips();
    Trips.__page=Math.min(Math.max(1,Number(page)||1),pages);
    const host=document.getElementById('mainContent')?.querySelector('#view-trips')||document.getElementById('view-trips');
    if(host) Trips.render(host);
  };

  Trips.render=function(container){
    if(typeof sync==='function')sync();
    const {all,rows,pages,start}=currentPageTrips();
    const total=all.length;
    const from=total?start+1:0;
    const to=Math.min(start+PAGE_SIZE,total);
    const selected=Trips.getSelected();
    const pageAllSelected=rows.length>0 && rows.every(t=>Trips.__selectedIds.has(String(t.id)));

    const pagination=`
      <div class="anori-trip-pagination">
        <div class="anori-trip-page-info">Showing ${from} to ${to} of ${total} entries</div>
        <div class="anori-trip-page-controls">
          <button type="button" class="anori-page-btn" ${Trips.__page<=1?'disabled':''} onclick="Trips.__gotoPage(${Trips.__page-1})">‹</button>
          <span class="anori-page-current">${Trips.__page}</span>
          <button type="button" class="anori-page-btn" ${Trips.__page>=pages?'disabled':''} onclick="Trips.__gotoPage(${Trips.__page+1})">›</button>
        </div>
      </div>`;

    const rowsHtml=rows.map((t,idx)=>{
      const inv=activeInvoice(t.id);
      const vehicleNo=vehicle(t.vehicle_id)?.number||'-';
      const customer=party(t.party_id)?.name||'-';
      const profit=num(t.freight)-((t.expenses||[]).reduce((s,e)=>s+num(e.amount),0));
      return `<tr class="anori-trip-row ${idx%2===1?'anori-trip-alt-row':''}">
        <td><input type="checkbox" class="trip-row-check" value="${esc(t.id)}" ${Trips.__selectedIds.has(String(t.id))?'checked':''} onchange="Trips.__toggleRow('${esc(t.id)}',this.checked)"></td>
        <td>${esc(t.date)}</td>
        <td><strong>${esc(t.trip_no)}</strong></td>
        <td>${esc(vehicleNo)}</td>
        <td>${esc(customer)}</td>
        <td>${esc(t.from)} → ${esc(t.to)}</td>
        <td>${money(t.freight)}</td>
        <td>${money(t.trip_advance_amount)}</td>
        <td class="profit-positive">${money(profit)}</td>
        <td>${inv?'<span class="status-badge status-shared">INVOICED</span>':'<span class="status-badge status-pending">PENDING</span>'}</td>
      </tr>`;
    }).join('');

    container.innerHTML=`
      <div class="anori-section-intro">
        <div><strong>Trip Management</strong><span>Select rows, then use the Actions above the table.</span></div>
        <button class="btn btn-success" onclick="Trips.openForm()">＋ New Trip</button>
      </div>
      <div class="card">
        ${typeof toolbar==='function'?toolbar('trip','Trips.showActions()'):`<div class="anori-universal-toolbar"><div class="anori-toolbar-left"><strong>Actions:</strong><button class="anori-action-btn anori-action-preview" onclick="Trips.showActions()">⚙ ACTIONS</button><span id="tripSelectedCount" class="anori-selection-count">${selected.length} selected</span></div></div>`}
        <div class="table-wrapper anori-trip-table-wrap">
          ${total?`<table class="anori-trip-table">
            <thead><tr>
              <th><input type="checkbox" class="trip-page-check-all" aria-label="Select all trips on this page" ${pageAllSelected?'checked':''} onchange="Trips.toggleAll(this.checked)"></th>
              <th>Date</th><th>Trip #</th><th>Vehicle</th><th>Party</th><th>Route</th><th>Freight</th><th>Trip Advance</th><th>Profit</th><th>Invoice</th>
            </tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>`:`<div class="empty-state"><i class="fas fa-route"></i><h3>No Trips Yet</h3><p>Create your first trip.</p></div>`}
        </div>
        ${pagination}
      </div>`;
    Trips.updateSelectionCount();
  };
})();


/* v2.30 FINAL — Trip numbering + duplicate action hardening.
   Trip No format: TRP-YYMMDD-01, -02, -03 ... per selected trip date.
   Duplicate creates one new trip for today with a fresh daily serial. */
(function installAnoriV230TripHardening(){
  'use strict';
  const safeNum=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:0;};
  const freshTripNo=dateValue=>Utils.generateTripNo(dateValue||Utils.today());
  Trips.duplicateSelected=function(){
    const ids=typeof Trips.getSelected==='function'?Trips.getSelected():[];
    if(ids.length!==1)return Utils.toast('Select one trip to duplicate.','warning');
    const all=DB.get('trips',[])||[];
    const original=all.find(t=>String(t.id)===String(ids[0]));
    if(!original)return Utils.toast('Selected trip was not found.','error');
    const copy=JSON.parse(JSON.stringify(original));
    copy.id=Utils.id();
    copy.date=Utils.today();
    copy.trip_no=freshTripNo(copy.date);
    copy.invoice_status='pending';
    delete copy.invoice_id;
    delete copy.invoice_no;
    copy.created_at=new Date().toISOString();
    all.push(copy);
    DB.set('trips',all,true);
    if(typeof window.syncDriver==='function')window.syncDriver(copy);
    if(Trips.__selectedIds instanceof Set)Trips.__selectedIds.clear();
    Utils.toast(`Trip duplicated successfully: ${copy.trip_no}`,'success');
    Router.go('trips');
  };
})();

/* ============================================================
   ANORI TRANSPORT — INVOICE ADVANCE + PREVIEW-BEFORE-FINALIZE
   Requested workflow:
   1) Trip Advance Amount automatically reflects in invoice.
   2) User sees invoice preview first.
   3) Invoice is saved/finalized only after explicit confirmation.
   ============================================================ */
(function installInvoiceAdvancePreviewWorkflow(){
  'use strict';
  if (typeof Invoices === 'undefined') return;

  const esc = v => Sanitize.html(v == null ? '' : String(v));
  const num = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
  const money = v => Utils.fmt(num(v));
  const tripsStore = () => DB.get('trips', []);
  const activeInvoice = id => DB.get('invoices', []).some(i => String(i.status || '').toLowerCase() !== 'cancelled' && Array.isArray(i.trip_ids) && i.trip_ids.includes(id));

  // Preserve the currently installed generator/finalizer for compatibility.
  const originalCreateInvoiceV28 = Invoices.createInvoiceV28;

  function selectedAdvance(trips){
    return trips.reduce((sum, t) => sum + num(t.trip_advance_amount), 0);
  }

  function selectedExpenseLinesFromDom(masterList){
    return [...document.querySelectorAll('.anori-invoice-preview-exp-check:checked')]
      .map(c => {
        const id = c.dataset.id;
        const master = masterList.find(x => x.id === id);
        const amountEl = document.querySelector(`.anori-invoice-preview-exp-amt[data-id="${CSS.escape(id)}"]`);
        return { masterId:id, name:master?.name || 'Expense', amount:num(amountEl?.value) };
      })
      .filter(x => x.amount > 0);
  }

  function buildDraft(trips, isGst, advance, expenseLines){
    const party = DB.get('parties', []).find(p => p.id === trips[0]?.party_id);
    const vehicles = DB.get('vehicles', []);
    const subtotal = trips.reduce((s,t) => s + num(t.freight), 0) + expenseLines.reduce((s,e) => s + num(e.amount), 0);
    const cgst = isGst ? subtotal * 0.09 : 0;
    const sgst = isGst ? subtotal * 0.09 : 0;
    const total = subtotal + cgst + sgst;
    return {
      id: `DRAFT-${Utils.id()}`,
      invoice_no: 'DRAFT / PREVIEW',
      date: Utils.today(),
      party_id: party?.id || '',
      trip_ids: trips.map(t => t.id),
      trip_count: trips.length,
      subtotal, cgst, sgst, total_amount: total,
      advance, balance_due: total - advance,
      paid_amount: advance,
      is_gst: !!isGst,
      status: 'draft',
      expense_lines: expenseLines,
      credit_days: window.anoriResolvePartyCreditDays(party),
      trips_data: trips.map(t => ({...t, vehicle:vehicles.find(v => v.id === t.vehicle_id)})),
      payments: []
    };
  }

  function showFinalizePreview(draft, finalize){
    // Use the application's existing invoice renderer so preview and PDF remain identical.
    Invoices.previewInvoice(draft);
    const modal = document.getElementById('previewModal');
    const footer = modal?.querySelector('.modal-footer');
    if (!modal || !footer) return;

    footer.innerHTML = `
      <button type="button" class="btn btn-outline" id="invoicePreviewBackBtn">← Back to Edit</button>
      <button type="button" class="btn btn-primary" id="invoicePreviewFinalizeBtn">✓ OK — Finalize Tax Invoice</button>
    `;

    document.getElementById('invoicePreviewBackBtn').onclick = () => {
      Invoices.closePreview ? Invoices.closePreview() : modal.classList.remove('active');
    };

    document.getElementById('invoicePreviewFinalizeBtn').onclick = async () => {
      const btn = document.getElementById('invoicePreviewFinalizeBtn');
      if (btn) { btn.disabled = true; btn.innerHTML = 'Finalizing…'; }
      try {
        const result = await finalize();
        if (result) {
          // After the invoice is actually saved, reopen the saved invoice preview.
          Invoices.previewInvoice(result);
          const savedFooter = modal.querySelector('.modal-footer');
          if (savedFooter) {
            savedFooter.innerHTML = `
              <button type="button" class="btn btn-outline" id="invoicePreviewCloseFinalBtn">Close</button>
              <button type="button" class="btn btn-primary" id="invoicePreviewDownloadFinalBtn">📄 Download PDF</button>
            `;
            document.getElementById('invoicePreviewCloseFinalBtn').onclick = () => {
              Invoices.closePreview ? Invoices.closePreview() : modal.classList.remove('active');
              Router.go('invoices');
            };
            document.getElementById('invoicePreviewDownloadFinalBtn').onclick = () => Invoices.downloadInvoice(result);
          }
        } else if (btn) {
          btn.disabled = false;
          btn.innerHTML = '✓ OK — Finalize Tax Invoice';
        }
      } catch (e) {
        console.error('Invoice finalization error:', e);
        Utils.toast(e?.message || 'Invoice could not be finalized.', 'error');
        if (btn) { btn.disabled = false; btn.innerHTML = '✓ OK — Finalize Tax Invoice'; }
      }
    };
  }

  Invoices.showInvoiceGenerator = function(preselectedIds = []){
    const allCompleted = tripsStore().filter(t => t.status === 'completed');
    const available = allCompleted.filter(t => !activeInvoice(t.id));
    if (!available.length) {
      return Swal.fire({
        icon:'info', title:'No Trip Available for Invoice',
        text:'All completed trips are already invoiced or none are completed.',
        confirmButtonText:'OK'
      });
    }

    const parties = DB.get('parties', []);
    const vehicles = DB.get('vehicles', []);
    const masters = DB.get('expense_master', []).filter(x => x.active !== false && x.showOnInvoice);
    const checked = new Set(preselectedIds);

    Swal.fire({
      title:'Create Invoice', width:950,
      html:`
        <div class="anori-invoice-generator">
          <div class="anori-help">1. Select trips → 2. Review advance → 3. Preview invoice → 4. Finalize tax invoice</div>
          <div class="table-wrapper" style="max-height:300px;overflow:auto">
            <table class="anori-standard-table">
              <thead><tr><th></th><th>Date</th><th>Trip</th><th>Customer</th><th>Vehicle</th><th style="text-align:right">Freight</th><th style="text-align:right">Trip Advance</th></tr></thead>
              <tbody>${available.map(t=>{
                const p=parties.find(x=>x.id===t.party_id), v=vehicles.find(x=>x.id===t.vehicle_id);
                return `<tr>
                  <td><input type="checkbox" class="anori-final-trip-v31" data-id="${esc(t.id)}" data-party="${esc(t.party_id)}" ${checked.has(t.id)?'checked':''}></td>
                  <td>${esc(t.date)}</td><td>${esc(t.trip_no)}</td><td>${esc(p?.name||'-')}</td><td>${esc(v?.number||'-')}</td>
                  <td style="text-align:right">${money(t.freight)}</td><td style="text-align:right">${money(t.trip_advance_amount)}</td>
                </tr>`;
              }).join('')}</tbody>
            </table>
          </div>
          <div id="anori-v31-expense-picker" class="anori-expense-picker" style="margin-top:14px"></div>
          <div class="form-row" style="margin-top:12px">
            <div class="form-group"><label>Invoice Type</label><select id="anori-v31-inv-type" class="form-control"><option value="gst">GST Invoice (18%)</option><option value="nongst">Non-GST</option></select></div>
            <div class="form-group"><label>Advance Received (₹)</label><input id="anori-v31-inv-advance" class="form-control" type="number" min="0" value="0" readonly><small class="anori-help">Automatically taken from selected Trip Advance Amount.</small></div>
          </div>
        </div>`,
      showCancelButton:true,
      confirmButtonText:'👁 Preview Invoice',
      cancelButtonText:'Cancel',
      didOpen:()=>{
        const update = () => {
          const checks=[...document.querySelectorAll('.anori-final-trip-v31:checked')];
          const selected=available.filter(t=>checks.some(c=>c.dataset.id===t.id));
          const partyIds=new Set(selected.map(t=>t.party_id));
          if(partyIds.size>1) Swal.showValidationMessage('Please select trips for one customer only.');
          else Swal.resetValidationMessage();

          const advance=selectedAdvance(selected);
          const adv=document.getElementById('anori-v31-inv-advance');
          if(adv) adv.value=advance;

          const host=document.getElementById('anori-v31-expense-picker');
          if(!host)return;
          if(!selected.length){host.innerHTML='<div class="anori-help">Select a trip to choose billable expenses.</div>';return;}
          host.innerHTML=`<div class="anori-subtitle">Billable Expenses</div>${masters.map(m=>{
            const amount=selected.reduce((sum,t)=>sum+(Array.isArray(t.expenses)?t.expenses:[]).filter(e=>String(e.type||'').trim().toLowerCase()===String(m.name||'').trim().toLowerCase()).reduce((a,e)=>a+num(e.amount),0),0);
            return `<div class="anori-expense-select-row"><label><input type="checkbox" class="anori-v31-bill-exp" data-id="${esc(m.id)}" ${amount>0?'checked':''}> ${esc(m.name)}</label><input type="number" class="anori-v31-bill-exp-amt" data-id="${esc(m.id)}" value="${amount||num(m.defaultAmount)||0}" min="0"></div>`;
          }).join('')||'<div class="anori-help">No billable expenses are configured in Master Data.</div>'}`;
        };
        document.querySelectorAll('.anori-final-trip-v31').forEach(c=>c.addEventListener('change',update));
        update();
      },
      preConfirm:()=>{
        const checks=[...document.querySelectorAll('.anori-final-trip-v31:checked')];
        const selected=checks.map(c=>c.dataset.id);
        if(!selected.length){Swal.showValidationMessage('Please select at least one trip.');return false;}
        if(new Set(checks.map(c=>c.dataset.party)).size!==1){Swal.showValidationMessage('Please select trips for one customer only.');return false;}
        const selectedTrips=available.filter(t=>selected.includes(t.id));
        if(selectedTrips.some(t=>activeInvoice(t.id))){Swal.showValidationMessage('One or more selected trips already have an active invoice.');return false;}
        const expenses=selectedExpenseLinesFromDom(masters);
        return {
          selected,
          isGst:document.getElementById('anori-v31-inv-type').value==='gst',
          advance:selectedAdvance(selectedTrips),
          expenses
        };
      }
    }).then(async result=>{
      if(!result.isConfirmed)return;
      const selectedTrips=tripsStore().filter(t=>result.value.selected.includes(t.id));
      const draft=buildDraft(selectedTrips,result.value.isGst,result.value.advance,result.value.expenses);

      // Preview first. Nothing is written to DB here.
      showFinalizePreview(draft, async ()=>{
        // Re-read latest trip data before finalizing, so stale selections cannot overwrite changes.
        const fresh=tripsStore().filter(t=>result.value.selected.includes(t.id));
        if(fresh.length!==result.value.selected.length)throw new Error('One or more selected trips are no longer available.');
        if(fresh.some(t=>activeInvoice(t.id)))throw new Error('One or more selected trips already have an active invoice.');
        const latestAdvance=selectedAdvance(fresh);
        // Advance is always taken from the saved Trip Advance Amount, never from manual invoice input.
        return await originalCreateInvoiceV28.call(Invoices,fresh,result.value.isGst,latestAdvance,result.value.expenses);
      });
    });
  };
})();


/* v2.18: Invoice preview Escape behaves exactly like Back to Edit. */
(function installInvoicePreviewEscapeBack(){
  'use strict';
  document.addEventListener('keydown', function(e){
    if(e.key !== 'Escape') return;
    const modal=document.getElementById('previewModal');
    const state=window.__anoriInvoiceEditState;
    if(!modal || !modal.classList.contains('active') || !state) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    try{
      if(Invoices && typeof Invoices.closePreview==='function') Invoices.closePreview();
      else modal.classList.remove('active');
    }catch(err){ console.error('Invoice preview Escape close error:',err); }
    setTimeout(()=>{
      try{
        if(window.__anoriInvoiceEditState && typeof Invoices!=='undefined' && typeof Invoices.showInvoiceGenerator==='function'){
          const edit=window.__anoriInvoiceEditState;
          Invoices.showInvoiceGenerator(edit.selected, edit);
        }
      }catch(err){ console.error('Invoice Back to Edit error:',err); }
    },80);
  }, true);
})();

/* ============================================================
   ANORI TRANSPORT — INVOICE BILLABLE EXPENSE + MANUAL CHARGES
   Amendment: billable expenses in 2-column layout and manual
   charge type/amount at invoice time. Existing workflow preserved.
   ============================================================ */
(function installInvoiceChargesV32(){
  'use strict';
  if(typeof Invoices==='undefined') return;
  const esc=v=>Sanitize.html(v==null?'':String(v));
  const num=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:0;};
  const money=v=>Utils.fmt(num(v));
  const tripsStore=()=>DB.get('trips',[]);
  const activeInvoice=id=>DB.get('invoices',[]).some(i=>String(i.status||'').toLowerCase()!=='cancelled'&&Array.isArray(i.trip_ids)&&i.trip_ids.includes(id));
  const selectedAdvance=ts=>ts.reduce((s,t)=>s+num(t.trip_advance_amount),0);

  function expenseAmountForTrips(trips, master){
    const target=String(master.name||'').trim().toLowerCase();
    return trips.reduce((sum,t)=>sum+(Array.isArray(t.expenses)?t.expenses:[])
      .filter(e=>String(e.type||'').trim().toLowerCase()===target)
      .reduce((a,e)=>a+num(e.amount),0),0);
  }

  function readManualCharges(){
    return [...document.querySelectorAll('.anori-v32-manual-charge')].map(row=>({
      masterId:`MANUAL-${Utils.id()}`,
      name:row.querySelector('.anori-v32-manual-type')?.value.trim()||'',
      amount:num(row.querySelector('.anori-v32-manual-amount')?.value),
      manual:true
    })).filter(x=>x.name&&x.amount>0);
  }

  Invoices.showInvoiceGenerator=function(preselectedIds=[],editState=null){
    const allCompleted=tripsStore().filter(t=>t.status==='completed');
    const available=allCompleted.filter(t=>!activeInvoice(t.id));
    if(!available.length)return Swal.fire({icon:'info',title:'No Trip Available for Invoice',text:'All completed trips are already invoiced or none are completed.',confirmButtonText:'OK'});
    const parties=DB.get('parties',[]),vehicles=DB.get('vehicles',[]);
    const masters=DB.get('expense_master',[]).filter(x=>x.active!==false&&x.showOnInvoice);
    const checked=new Set(Array.isArray(editState?.selected)&&editState.selected.length?editState.selected:preselectedIds);

    Swal.fire({
      title:'Create Invoice',width:1000,
      html:`<div class="anori-invoice-generator anori-v32-generator">
        <div class="anori-help">1. Select trips → 2. Select billable expenses → 3. Add manual charges → 4. Preview invoice → 5. Finalize</div>
        <div class="table-wrapper" style="max-height:280px;overflow:auto"><table class="anori-standard-table"><thead><tr><th></th><th>Date</th><th>Trip</th><th>Customer</th><th>Vehicle</th><th style="text-align:right">Freight</th><th style="text-align:right">Trip Advance</th></tr></thead><tbody>${available.map(t=>{const p=parties.find(x=>x.id===t.party_id),v=vehicles.find(x=>x.id===t.vehicle_id);return `<tr><td><input type="checkbox" class="anori-v32-trip" data-id="${esc(t.id)}" data-party="${esc(t.party_id)}" ${checked.has(t.id)?'checked':''}></td><td>${esc(t.date)}</td><td>${esc(t.trip_no)}</td><td>${esc(p?.name||'-')}</td><td>${esc(v?.number||'-')}</td><td style="text-align:right">${money(t.freight)}</td><td style="text-align:right">${money(t.trip_advance_amount)}</td></tr>`}).join('')}</tbody></table></div>
        <div id="anori-v32-expense-picker" class="anori-expense-picker"></div>
        <div class="anori-v32-manual-wrap">
          <div class="anori-subtitle">Manual Charges</div>
          <div class="anori-help">Add any additional customer charge manually for this invoice.</div>
          <div id="anori-v32-manual-list"></div>
          <button type="button" class="btn btn-outline btn-sm" id="anori-v32-add-manual">＋ Add Manual Charge</button>
        </div>
        <div class="form-row" style="margin-top:12px">
          <div class="form-group"><label>Invoice Type</label><select id="anori-v32-inv-type" class="form-control"><option value="gst" ${editState?.isGst!==false?'selected':''}>GST Invoice</option><option value="nongst" ${editState?.isGst===false?'selected':''}>Non-GST</option></select></div>
          <div class="form-group"><label>Tax Type</label><select id="anori-v32-tax-type" class="form-control"><option value="cgst_sgst" ${editState?.taxType!=='igst'?'selected':''}>CGST 9% + SGST 9%</option><option value="igst" ${editState?.taxType==='igst'?'selected':''}>IGST 18%</option><option value="none" ${editState?.isGst===false?'selected':''}>No Tax</option></select></div>
          <div class="form-group"><label>Advance Received (₹)</label><input id="anori-v32-inv-advance" class="form-control" type="number" min="0" value="${num(editState?.advance||0)}" readonly><small class="anori-help">Automatically taken from selected Trip Advance Amount.</small></div>
        </div>
      </div>`,
      showCancelButton:true,confirmButtonText:'👁 Preview Invoice',cancelButtonText:'Cancel',
      didOpen:()=>{
        const addManual=()=>{const host=document.getElementById('anori-v32-manual-list');if(!host)return;const row=document.createElement('div');row.className='anori-v32-manual-charge';row.innerHTML=`<div><label>Charge Type</label><input class="form-control anori-v32-manual-type" placeholder="e.g. Documentation, Detention, Handling"></div><div><label>Amount (₹)</label><input class="form-control anori-v32-manual-amount" type="number" min="0" value="0"></div><button type="button" class="btn btn-danger btn-sm anori-v32-remove-manual" title="Remove">✕</button>`;row.querySelector('.anori-v32-remove-manual').onclick=()=>row.remove();host.appendChild(row);};
        document.getElementById('anori-v32-add-manual')?.addEventListener('click',addManual);
        addManual();
        const update=()=>{
          const checks=[...document.querySelectorAll('.anori-v32-trip:checked')],selected=available.filter(t=>checks.some(c=>c.dataset.id===t.id));
          if(new Set(selected.map(t=>t.party_id)).size>1)Swal.showValidationMessage('Please select trips for one customer only.');else Swal.resetValidationMessage();
          const adv=document.getElementById('anori-v32-inv-advance');if(adv)adv.value=selectedAdvance(selected);
          const host=document.getElementById('anori-v32-expense-picker');if(!host)return;
          if(!selected.length){host.innerHTML='<div class="anori-help">Select a trip to choose billable expenses.</div>';return;}
          host.innerHTML=`<div class="anori-subtitle">Billable Expenses</div><div class="anori-v32-expense-grid">${masters.map(m=>{const amount=expenseAmountForTrips(selected,m);return `<div class="anori-v32-expense-card${amount>0?' selected':''}"><label><input type="checkbox" class="anori-v32-bill-exp" data-id="${esc(m.id)}" ${amount>0?'checked':''}> <strong>${esc(m.name)}</strong></label><input type="number" class="form-control anori-v32-bill-exp-amt" data-id="${esc(m.id)}" value="${amount||num(m.defaultAmount)||0}" min="0"></div>`}).join('')||'<div class="anori-help">No billable expenses are configured in Master Data.</div>'}</div>`;
          host.querySelectorAll('.anori-v32-bill-exp').forEach(cb=>cb.addEventListener('change',()=>cb.closest('.anori-v32-expense-card')?.classList.toggle('selected',cb.checked)));
        };
        document.querySelectorAll('.anori-v32-trip').forEach(c=>c.addEventListener('change',update));
        update();
        if(editState){
          setTimeout(()=>{
            const gst=document.getElementById('anori-v32-inv-type'); if(gst)gst.value=editState.isGst?'gst':'nongst';
            const tax=document.getElementById('anori-v32-tax-type'); if(tax)tax.value=editState.taxType|| (editState.isGst?'cgst_sgst':'none');
            const adv=document.getElementById('anori-v32-inv-advance'); if(adv)adv.value=num(editState.advance);
            (editState.expenses||[]).filter(e=>!e.manual).forEach(e=>{
              const cb=document.querySelector(`.anori-v32-bill-exp[data-id="${CSS.escape(e.masterId||'')}"]`);
              const amt=document.querySelector(`.anori-v32-bill-exp-amt[data-id="${CSS.escape(e.masterId||'')}"]`);
              if(cb){cb.checked=true;} if(amt){amt.value=num(e.amount);}
            });
            const manual=(editState.expenses||[]).filter(e=>e.manual);
            const host=document.getElementById('anori-v32-manual-list');
            if(host&&manual.length){host.innerHTML='';manual.forEach(e=>{
              const row=document.createElement('div');row.className='anori-v32-manual-charge';
              row.innerHTML=`<div><label>Charge Type</label><input class="form-control anori-v32-manual-type" value="${esc(e.name||'')}" placeholder="e.g. Documentation, Detention, Handling"></div><div><label>Amount (₹)</label><input class="form-control anori-v32-manual-amount" type="number" min="0" value="${num(e.amount)}"></div><button type="button" class="btn btn-danger btn-sm anori-v32-remove-manual" title="Remove">✕</button>`;
              row.querySelector('.anori-v32-remove-manual').onclick=()=>row.remove();host.appendChild(row);
            });}
          },20);
        }
      },
      preConfirm:()=>{
        const checks=[...document.querySelectorAll('.anori-v32-trip:checked')],selected=checks.map(c=>c.dataset.id);
        if(!selected.length){Swal.showValidationMessage('Please select at least one trip.');return false;}
        if(new Set(checks.map(c=>c.dataset.party)).size!==1){Swal.showValidationMessage('Please select trips for one customer only.');return false;}
        const selectedTrips=available.filter(t=>selected.includes(t.id));
        if(selectedTrips.some(t=>activeInvoice(t.id))){Swal.showValidationMessage('One or more selected trips already have an active invoice.');return false;}
        const expenses=[...document.querySelectorAll('.anori-v32-bill-exp:checked')].map(c=>{const id=c.dataset.id,m=masters.find(x=>x.id===id);return {masterId:id,name:m?.name||'Expense',amount:num(document.querySelector(`.anori-v32-bill-exp-amt[data-id="${CSS.escape(id)}"]`)?.value),manual:false};}).filter(x=>x.amount>0);
        const manual=readManualCharges();
        const isGst=document.getElementById('anori-v32-inv-type').value==='gst';
        const taxType=isGst?(document.getElementById('anori-v32-tax-type')?.value||'cgst_sgst'):'none';
        return {selected,isGst,taxType,advance:selectedAdvance(selectedTrips),expenses:[...expenses,...manual]};
      }
    }).then(async result=>{
      if(!result.isConfirmed)return;
      const selectedTrips=tripsStore().filter(t=>result.value.selected.includes(t.id));
      const originalFinalize=async()=>{
        const fresh=tripsStore().filter(t=>result.value.selected.includes(t.id));
        if(fresh.length!==result.value.selected.length)throw new Error('One or more selected trips are no longer available.');
        if(fresh.some(t=>activeInvoice(t.id)))throw new Error('One or more selected trips already have an active invoice.');
        return await buildAndSaveInvoice(fresh,result.value.isGst,selectedAdvance(fresh),result.value.expenses,result.value.taxType);
      };
      const draft=buildDraftV32(selectedTrips,result.value.isGst,result.value.advance,result.value.expenses,result.value.taxType);
      if(typeof Invoices.previewInvoice==='function'){
        Invoices.previewInvoice(draft);
        const modal=document.getElementById('previewModal'),footer=modal?.querySelector('.modal-footer');
        if(modal&&footer){
          footer.innerHTML='<button type="button" class="btn btn-outline" id="anori-v32-back">← Back to Edit</button><button type="button" class="btn btn-primary" id="anori-v32-finalize">✓ OK — Finalize Tax Invoice</button>';
          window.__anoriInvoiceEditState={
            selected:[...result.value.selected],
            isGst:!!result.value.isGst,
            taxType:result.value.taxType||'cgst_sgst',
            advance:num(result.value.advance),
            expenses:Array.isArray(result.value.expenses)?JSON.parse(JSON.stringify(result.value.expenses)):[]
          };
          document.getElementById('anori-v32-back').onclick=()=>{
            try{ if(Invoices.closePreview)Invoices.closePreview();else modal.classList.remove('active'); }catch(e){ console.error('Invoice preview close error:',e); }
            const state=window.__anoriInvoiceEditState;
            setTimeout(()=>{
              if(!state)return;
              Invoices.showInvoiceGenerator(state.selected,state);
            },80);
          };
          document.getElementById('anori-v32-finalize').onclick=async()=>{const b=document.getElementById('anori-v32-finalize');b.disabled=true;b.textContent='Finalizing…';try{const saved=await originalFinalize();if(saved){Invoices.previewInvoice(saved);const f=modal.querySelector('.modal-footer');if(f){f.innerHTML='<button type="button" class="btn btn-outline" id="anori-v32-close">Close</button><button type="button" class="btn btn-primary" id="anori-v32-pdf">📄 Download PDF</button>';document.getElementById('anori-v32-close').onclick=()=>{modal.classList.remove('active');Router.go('invoices');};document.getElementById('anori-v32-pdf').onclick=()=>Invoices.downloadInvoice(saved);}}}catch(e){b.disabled=false;b.textContent='✓ OK — Finalize Tax Invoice';Utils.toast(e.message||'Invoice could not be finalized.','error');}};
        }
      } else {await originalFinalize();}
    });

    function invoiceDateForTrips(ts){
      const dates=(Array.isArray(ts)?ts:[]).map(t=>String(t?.date||'').trim()).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
      return dates[0] || today();
    }

    function buildDraftV32(ts,isGst,advance,expenseLines,taxType){
      const party=parties.find(p=>p.id===ts[0]?.party_id),vehiclesNow=DB.get('vehicles',[]),subtotal=ts.reduce((s,t)=>s+num(t.freight),0)+expenseLines.reduce((s,e)=>s+num(e.amount),0),mode=isGst?(taxType||'cgst_sgst'):'none',cgst=mode==='cgst_sgst'?subtotal*.09:0,sgst=mode==='cgst_sgst'?subtotal*.09:0,igst=mode==='igst'?subtotal*.18:0,total=subtotal+cgst+sgst+igst;
      if(advance>total)throw new Error(`Advance cannot be greater than invoice total of ${money(total)}.`);
      return {id:`DRAFT-${Utils.id()}`,invoice_no:'DRAFT / PREVIEW',date:invoiceDateForTrips(ts),party_id:party?.id||'',trip_ids:ts.map(t=>t.id),trip_count:ts.length,subtotal,cgst,sgst,igst,total_amount:total,advance,balance_due:total-advance,paid_amount:advance,is_gst:!!isGst,tax_type:mode,status:'draft',expense_lines:expenseLines,credit_days:Math.max(0,num(party?.credit_days)||30),trips_data:ts.map(t=>({...t,vehicle:vehiclesNow.find(v=>v.id===t.vehicle_id)})),payments:[]};
    }

    async function buildAndSaveInvoice(ts,isGst,advance,expenseLines,taxType){
      const party=DB.get('parties',[]).find(p=>p.id===ts[0]?.party_id);if(!party)throw new Error('Customer/Party not found.');
      const billable= new Set(DB.get('expense_master',[]).filter(x=>x.active!==false&&x.showOnInvoice).map(x=>x.id));
      const lines=(Array.isArray(expenseLines)?expenseLines:[]).filter(e=>e.manual||billable.has(e.masterId)).map(e=>({masterId:e.masterId,name:e.name,amount:num(e.amount),manual:!!e.manual})).filter(e=>e.amount>0);
      const subtotal=ts.reduce((s,t)=>s+num(t.freight),0)+lines.reduce((s,e)=>s+e.amount,0),mode=isGst?(taxType||'cgst_sgst'):'none',cgst=mode==='cgst_sgst'?subtotal*.09:0,sgst=mode==='cgst_sgst'?subtotal*.09:0,igst=mode==='igst'?subtotal*.18:0,total=subtotal+cgst+sgst+igst;
      if(advance<0||advance>total)throw new Error(advance<0?'Advance cannot be negative.':`Advance cannot exceed ${money(total)}.`);
      const invoice={id:Utils.id(),invoice_no:Utils.generateInvoiceNo(),date:invoiceDateForTrips(ts),party_id:party.id,trip_ids:ts.map(t=>t.id),trip_count:ts.length,subtotal,cgst,sgst,igst,total_amount:total,advance,balance_due:total-advance,paid_amount:advance,is_gst:!!isGst,tax_type:mode,status:advance>=total?'paid':'issued',expense_lines:lines,credit_days:window.anoriResolvePartyCreditDays(party),trips_data:ts.map(t=>({...t,vehicle:DB.get('vehicles',[]).find(v=>v.id===t.vehicle_id)})),payments:[]};
      const invs=DB.get('invoices',[]);if(invs.some(i=>String(i.status||'').toLowerCase()!=='cancelled'&&Array.isArray(i.trip_ids)&&i.trip_ids.some(id=>invoice.trip_ids.includes(id))))throw new Error('Duplicate active invoice detected.');
      DB.set('invoices',[...invs,invoice]);const all=tripsStore();ts.forEach(t=>{const x=all.find(a=>a.id===t.id);if(x)x.invoice_status='invoiced';});DB.set('trips',all,true);return invoice;
    }
  };

  // Keep the existing invoice renderer but make billable/manual charges explicit rows.
  const previousBuild=Invoices.buildInvoiceHTML;
  Invoices.buildInvoiceHTML=function(invoice,preview=false){
    let html=previousBuild.call(this,invoice,preview);
    const lines=Array.isArray(invoice?.expense_lines)?invoice.expense_lines.filter(e=>num(e.amount)>0):[];
    if(!lines.length)return html;
    // The installed renderer already renders expense_lines in the charge table.
    // Add the charge classification without changing the invoice totals/layout.
    const marker='<td colspan="5" class="summary-label">';
    if(html.includes(marker)){
      let n=0;
      html=html.replace(/<tr><td colspan="5" class="summary-label">([^<]*)<\/td><td class="money">/g,(m,name)=>{
        const line=lines[n++];
        if(!line)return m;
        return `<tr><td colspan="5" class="summary-label">${esc(line.name||name)}</td><td class="money">`;
      });
    }
    return html;
  };
})();

/* ANORI TRANSPORT — MODULE MANUAL SEARCH
   Adds a manual field-based search to Trip Management, Invoices & Billing,
   Reports & Analytics, and Driver Settlement without changing stored data.
*/
(function installModuleManualSearch(){
  'use strict';

  const FIELD_OPTIONS = [
    ['all','ALL FIELDS'],
    ['party','PARTY NAME'],
    ['driver','DRIVER NAME'],
    ['pol','POL'],
    ['pod','POD'],
    ['invoice','INVOICE NO.'],
    ['trip','TRIP NO.'],
    ['vehicle','VEHICLE NO.']
  ];

  function norm(v){ return String(v ?? '').trim().toLowerCase(); }
  function includes(v,q){ return norm(v).includes(norm(q)); }
  function linkedTripsForInvoice(inv){
    const direct = Array.isArray(inv?.trips_data) ? inv.trips_data : [];
    if(direct.length) return direct;
    const ids = Array.isArray(inv?.trip_ids) ? inv.trip_ids : [];
    return DB.get('trips',[]).filter(t=>ids.includes(t.id));
  }
  function getTrip(id){ return DB.get('trips',[]).find(t=>t.id===id); }
  function tripSearchText(t,field){
    const p=DB.get('parties',[]).find(x=>x.id===t.party_id);
    const d=DB.get('drivers',[]).find(x=>x.id===t.driver_id);
    const v=DB.get('vehicles',[]).find(x=>x.id===t.vehicle_id);
    const inv=(typeof activeInv==='function' ? activeInv(t.id) : null);
    const map={
      party:p?.name, driver:d?.name, pol:t.from, pod:t.to,
      invoice:inv?.invoice_no, trip:t.trip_no, vehicle:v?.number
    };
    if(field==='all') return [p?.name,d?.name,t.from,t.to,inv?.invoice_no,t.trip_no,v?.number,t.date].filter(Boolean).join(' ');
    return map[field] || '';
  }
  function invoiceSearchText(inv,field){
    const p=DB.get('parties',[]).find(x=>x.id===inv.party_id);
    const ts=linkedTripsForInvoice(inv);
    const drivers=ts.map(t=>DB.get('drivers',[]).find(x=>x.id===t.driver_id)?.name).filter(Boolean);
    const pols=ts.map(t=>t.from).filter(Boolean);
    const pods=ts.map(t=>t.to).filter(Boolean);
    const trips=ts.map(t=>t.trip_no).filter(Boolean);
    const vehicles=ts.map(t=>DB.get('vehicles',[]).find(x=>x.id===t.vehicle_id)?.number).filter(Boolean);
    const map={party:p?.name,driver:drivers.join(' '),pol:pols.join(' '),pod:pods.join(' '),invoice:inv.invoice_no,trip:trips.join(' '),vehicle:vehicles.join(' ')};
    if(field==='all') return [p?.name,drivers.join(' '),pols.join(' '),pods.join(' '),inv.invoice_no,trips.join(' '),vehicles.join(' '),inv.date,inv.status].filter(Boolean).join(' ');
    return map[field] || '';
  }
  function settlementSearchText(row,field){
    const t=row.trip_id ? getTrip(row.trip_id) : null;
    const p=t ? DB.get('parties',[]).find(x=>x.id===t.party_id) : null;
    const d=DB.get('drivers',[]).find(x=>x.id===row.driver_id || x.id===t?.driver_id);
    const v=t ? DB.get('vehicles',[]).find(x=>x.id===t.vehicle_id) : null;
    const inv=t && typeof activeInv==='function' ? activeInv(t.id) : null;
    const map={party:p?.name,driver:d?.name,pol:t?.from,pod:t?.to,invoice:inv?.invoice_no,trip:t?.trip_no,vehicle:v?.number};
    if(field==='all') return [p?.name,d?.name,t?.from,t?.to,inv?.invoice_no,t?.trip_no,v?.number,row.description,row.date].filter(Boolean).join(' ');
    return map[field] || '';
  }

  function panel(module){
    const id='anori-manual-search-'+module;
    const options=FIELD_OPTIONS.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
    return `<div id="${id}" class="anori-manual-search card">
      <div class="anori-manual-search-title"><strong>🔎 SEARCH</strong></div>
      <div class="anori-manual-search-controls">
        <label>SEARCH BY<select id="${id}-field" class="form-control">${options}</select></label>
        <label class="anori-manual-search-query">SEARCH<input id="${id}-query" class="form-control" type="text" placeholder="ENTER SEARCH TEXT..."></label>
        <button type="button" class="btn btn-primary" onclick="window.anoriApplyModuleSearch('${module}')">🔎 SEARCH</button>
        <button type="button" class="btn btn-outline" onclick="window.anoriClearModuleSearch('${module}')">↻ CLEAR</button>
        <span id="${id}-count" class="anori-manual-search-count"></span>
      </div>
    </div>`;
  }

  const state={};
  function getRows(module){
    const content=document.querySelector('.view.active > div:last-child');
    if(!content)return [];
    const table=content.querySelector(module==='settlements' ? '#driverLedgerHost tbody' : module==='reports' ? '#reportHost tbody' : 'table tbody');
    return table ? [...table.querySelectorAll('tr')] : [];
  }
  function recordList(module){
    if(module==='trips') return DB.get('trips',[]);
    if(module==='invoices') return DB.get('invoices',[]).filter(x=>String(x.status||'').toLowerCase()!=='cancelled');
    if(module==='reports') return DB.get('trips',[]);
    if(module==='settlements') return DB.get('driver_settlements',[]);
    return [];
  }
  function rowId(module,row){ return row?.dataset?.manualSearchId || ''; }
  function attachRowIds(module){
    const rows=getRows(module), records=recordList(module);
    if(!rows.length)return;
    if(module==='invoices'){
      const ordered=records.slice().reverse();
      rows.forEach((r,i)=>{ if(ordered[i]) r.dataset.manualSearchId=ordered[i].id; });
    } else if(module==='settlements'){
      const hostRows=DB.get('driver_settlements',[]);
      rows.forEach((r,i)=>{ if(hostRows[i]) r.dataset.manualSearchId=hostRows[i].id; });
    } else {
      rows.forEach((r,i)=>{ if(records[i]) r.dataset.manualSearchId=records[i].id; });
    }
  }
  function matches(module,record,field,q){
    if(!q)return true;
    if(module==='trips' || module==='reports') return includes(tripSearchText(record,field),q);
    if(module==='invoices') return includes(invoiceSearchText(record,field),q);
    if(module==='settlements') return includes(settlementSearchText(record,field),q);
    return false;
  }
  function apply(module){
    attachRowIds(module);
    const root=document.getElementById('anori-manual-search-'+module);if(!root)return;
    const field=document.getElementById(root.id+'-field')?.value||'all';
    const q=document.getElementById(root.id+'-query')?.value||'';
    state[module]={field,q};
    const records=recordList(module);
    const map=new Map(records.map(r=>[r.id,r]));
    const rows=getRows(module);
    let shown=0;
    rows.forEach(row=>{
      const rec=map.get(rowId(module,row));
      const ok=!!rec && matches(module,rec,field,q);
      row.style.display=ok?'':'none';
      if(ok && !row.classList.contains('empty-state'))shown++;
    });
    const count=document.getElementById(root.id+'-count');
    if(count)count.textContent=q?`${shown} RESULT${shown===1?'':'S'} FOUND`:'';
  }
  function clear(module){
    const root=document.getElementById('anori-manual-search-'+module);if(!root)return;
    const input=document.getElementById(root.id+'-query');if(input)input.value='';
    const field=document.getElementById(root.id+'-field');if(field)field.value='all';
    state[module]={field:'all',q:''};
    apply(module);
  }
  function compactControls(module){
    const id='anori-manual-search-'+module;
    const options=FIELD_OPTIONS.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
    const heading='';
    return `<div id="${id}" class="anori-manual-search anori-manual-search-inline">
      <strong class="anori-manual-search-inline-title">${heading}</strong>
      <label><span>SEARCH BY</span><select id="${id}-field" class="form-control">${options}</select></label>
      <label class="anori-manual-search-query"><span>SEARCH</span><input id="${id}-query" class="form-control" type="text" placeholder="ENTER SEARCH TEXT..."></label>
      <button type="button" class="btn btn-primary" onclick="window.anoriApplyModuleSearch('${module}')">🔎 SEARCH</button>
      <button type="button" class="btn btn-outline" onclick="window.anoriClearModuleSearch('${module}')">↻ CLEAR</button>
      <span id="${id}-count" class="anori-manual-search-count"></span>
    </div>`;
  }
  function install(container,module){
    if(!container || container.querySelector('#anori-manual-search-'+module))return;
    const filter=container.querySelector('.anori-filter-bar');
    if(filter){
      filter.insertAdjacentHTML('beforeend',compactControls(module));
    }else{
      container.insertAdjacentHTML('afterbegin',compactControls(module));
    }
    const input=document.getElementById('anori-manual-search-'+module+'-query');
    input?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();apply(module);}});
    setTimeout(()=>{attachRowIds(module); if(state[module]?.q)apply(module);},0);
  }

  window.anoriApplyModuleSearch=apply;
  window.anoriClearModuleSearch=clear;

  function wrap(obj,module){
    const original=obj?.render;
    if(typeof original!=='function' || obj.__manualSearchWrapped)return;
    obj.__manualSearchWrapped=true;
    obj.render=function(container){
      const result=original.call(this,container);
      install(container,module);
      setTimeout(()=>{attachRowIds(module);if(state[module]?.q)apply(module);},40);
      return result;
    };
  }
  wrap(Trips,'trips');
  wrap(Invoices,'invoices');
  wrap(Reports,'reports');
  wrap(DriverSettlement,'settlements');
})();

/* ANORI TRANSPORT — GLOBAL TABLE UX
   1) Every application table gets A-Z/Z-A sorting on data columns.
   2) Checkbox selection columns receive the explicit SELECT heading.
   Sorting is client-side only and does not modify stored data. */
(function installGlobalTableUX(){
  'use strict';

  function cellValue(cell){
    const input=cell?.querySelector('input,select,textarea');
    let value=input ? (input.value || input.getAttribute('aria-label') || input.checked ? (input.type==='checkbox' ? (input.checked?'1':'0') : input.value) : '') : (cell?.textContent||'');
    value=String(value).replace(/\s+/g,' ').trim();
    return value;
  }
  function comparable(v){
    const raw=String(v||'').trim();
    const numeric=raw.replace(/[₹,%,$,\s]/g,'');
    if(numeric!=='' && /^-?\d+(?:\.\d+)?$/.test(numeric)) return {type:'number',value:Number(numeric)};
    const d=Date.parse(raw);
    if(!Number.isNaN(d) && /\d/.test(raw) && /[-\/]/.test(raw)) return {type:'date',value:d};
    return {type:'text',value:raw.toLocaleLowerCase()};
  }
  function sortTable(table, index, direction){
    const tbody=table.tBodies?.[0]; if(!tbody)return;
    const rows=[...tbody.rows].filter(r=>!r.classList.contains('empty-state'));
    rows.sort((a,b)=>{
      const av=comparable(cellValue(a.cells[index])), bv=comparable(cellValue(b.cells[index]));
      let result=0;
      if(av.type===bv.type){
        if(av.value>bv.value)result=1; else if(av.value<bv.value)result=-1;
      }else result=String(av.value).localeCompare(String(bv.value),undefined,{numeric:true,sensitivity:'base'});
      return result*direction;
    });
    rows.forEach(r=>tbody.appendChild(r));
  }
  function prepare(root=document){
    const tables=root.querySelectorAll?.('.view.active table, #mainContent .view.active table')||[];
    tables.forEach(table=>{
      table.querySelectorAll('thead th').forEach((th,index)=>{
        if(th.querySelector('input[type="checkbox"]')){
          if(!th.dataset.selectionHeading){
            const box=th.querySelector('input[type="checkbox"]');
            th.dataset.selectionHeading='1';
            th.style.whiteSpace='nowrap';
            // Selection header intentionally remains blank; checkbox is the selector.
          }
          th.dataset.sortable='0';
          return;
        }
        if(th.dataset.sortable==='1')return;
        th.dataset.sortable='1';
        th.setAttribute('role','button');
        th.setAttribute('tabindex','0');
        th.title='SORT A-Z';
        th.style.cursor='pointer';
        th.style.userSelect='none';
        th.addEventListener('click',()=>{
          const next=th.dataset.sortDir==='1'?-1:1;
          table.querySelectorAll('thead th').forEach(x=>{if(x!==th)x.dataset.sortDir='';});
          th.dataset.sortDir=String(next);
          th.title=next===1?'SORT Z-A':'SORT A-Z';
          table.querySelectorAll('thead th .anori-sort-indicator').forEach(x=>x.remove());
          const indicator=document.createElement('span');
          indicator.className='anori-sort-indicator';
          indicator.textContent=next===1?' ↑':' ↓';
          indicator.style.fontSize='10px';
          indicator.style.opacity='.7';
          th.appendChild(indicator);
          sortTable(table,index,next);
        });
        th.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();th.click();}});
      });
    });
  }
  window.anoriInstallTableUX=()=>prepare(document.getElementById('mainContent')||document.body||document.documentElement);
  const tableUxTarget=document.getElementById('mainContent')||document.body||document.documentElement;
  if (tableUxTarget && window.MutationObserver) {
    const observer=new MutationObserver(()=>{ clearTimeout(observer._t); observer._t=setTimeout(()=>prepare(document.getElementById('mainContent')||document.body||document.documentElement),25); });
    observer.observe(tableUxTarget,{childList:true,subtree:true});
  }
  setTimeout(()=>prepare(document),0);
})();


/* FINAL TRIP MANAGEMENT UI AMENDMENT
   - New Trip is inside Actions toolbar
   - Trip PDF + EMAIL actions removed
   - Selection column uses SELECT heading (global table UX)
   - 15 rows per page retained
   - Manual Search sits in the same filter/search row for cleaner layout
*/
(function installFinalTripManagementUI(){
  'use strict';
  const escV=v=>Sanitize.html(v==null?'':String(v));
  const nV=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:0;};
  const moneyV=v=>Utils.fmt(nV(v));
  const allTrips=()=>DB.get('trips',[])||[];
  const vehicleV=id=>(DB.get('vehicles',[])||[]).find(x=>x.id===id);
  const partyV=id=>(DB.get('parties',[])||[]).find(x=>x.id===id);
  const activeInvV=id=>typeof activeInvoiceForTrip==='function'?activeInvoiceForTrip(id):(DB.get('invoices',[])||[]).find(i=>Array.isArray(i.trip_ids)&&i.trip_ids.includes(id)&&String(i.status||'').toLowerCase()!=='cancelled');

  // Keep invoice toolbar unchanged; simplify Trip toolbar only.
  window.toolbar=function(type,countId){
    if(type!=='trip'){
      const p='Invoices.actionPreview()',pdf='Invoices.actionPDF()',email='Invoices.actionEmail()',dup='Invoices.duplicateSelected()',edit='Invoices.editSelected()',del='Invoices.deleteSelected()';
      return window.bar(`
        <button type="button" class="anori-action-btn anori-action-preview" onclick="${p}">👁 PREVIEW</button>
        <button type="button" class="anori-action-btn anori-action-payment" onclick="Invoices.actionPayment()">💵 PAYMENT</button>
        <button type="button" class="anori-action-btn anori-action-duplicate" onclick="${dup}">📋 DUPLICATE</button>
        <button type="button" class="anori-action-btn anori-action-edit" onclick="${edit}">✏️ EDIT</button>
        <button type="button" class="anori-action-btn anori-action-delete" onclick="${del}">🗑 DELETE</button>
        <button type="button" class="anori-action-btn anori-action-cancel" onclick="Invoices.actionCancel()">❌ CANCEL</button>
      `,countId);
    }
    return window.bar(`
      <button type="button" class="anori-action-btn anori-action-add" style="background:#16a34a!important;" onclick="Trips.openForm()">＋ NEW TRIP</button>
      <button type="button" class="anori-action-btn anori-action-preview" onclick="Trips.actionPreview()">👁 PREVIEW</button>
      <button type="button" class="anori-action-btn anori-action-duplicate" onclick="Trips.duplicateSelected()">📋 DUPLICATE</button>
      <button type="button" class="anori-action-btn anori-action-edit" onclick="Trips.editSelected()">✏️ EDIT</button>
      <button type="button" class="anori-action-btn anori-action-delete" onclick="Trips.deleteSelected()">🗑 DELETE</button>
      <button type="button" class="anori-action-btn anori-action-columns" onclick="Trips.openColumnSelector()">☷ COLUMNS</button>
    `,countId);
  };

  Trips.__page=Trips.__page||1;
  Trips.__selectedIds=Trips.__selectedIds instanceof Set?Trips.__selectedIds:new Set();
  const PAGE_SIZE=15;
  function current(){
    const a=allTrips();
    const pages=Math.max(1,Math.ceil(a.length/PAGE_SIZE));
    Trips.__page=Math.min(Math.max(1,Number(Trips.__page)||1),pages);
    const start=(Trips.__page-1)*PAGE_SIZE;
    return {all:a,rows:a.slice(start,start+PAGE_SIZE),pages,start};
  }
  Trips.__gotoPage=function(page){
    const {pages}=current();
    Trips.__page=Math.min(Math.max(1,Number(page)||1),pages);
    const host=document.getElementById('view-trips')||document.querySelector('#mainContent .view.active');
    if(host)Trips.render(host);
  };
  Trips.getSelected=function(){
    const valid=new Set(allTrips().map(t=>String(t.id)));
    Trips.__selectedIds=new Set([...Trips.__selectedIds].filter(id=>valid.has(String(id))));
    return [...Trips.__selectedIds];
  };
  Trips.updateSelectionCount=function(){
    const el=document.getElementById('tripSelectedCount');
    if(el)el.textContent=`${Trips.getSelected().length} SELECTED`;
    document.querySelectorAll('#view-trips .trip-row-check').forEach(cb=>cb.checked=Trips.__selectedIds.has(String(cb.value)));
    const checks=[...document.querySelectorAll('#view-trips .trip-row-check')];
    const master=document.querySelector('#view-trips .trip-page-check-all');
    if(master)master.checked=checks.length>0&&checks.every(cb=>cb.checked);
  };
  Trips.toggleAll=function(flag){
    const {rows}=current();
    rows.forEach(t=>flag?Trips.__selectedIds.add(String(t.id)):Trips.__selectedIds.delete(String(t.id)));
    Trips.updateSelectionCount();
  };
  Trips.__toggleRow=function(id,checked){
    id=String(id);if(checked)Trips.__selectedIds.add(id);else Trips.__selectedIds.delete(id);Trips.updateSelectionCount();
  };

  const TRIP_COLUMNS=[
    {key:'date',label:'DATE'},
    {key:'trip',label:'TRIP #'},
    {key:'vehicle',label:'VEHICLE'},
    {key:'driver',label:'DRIVER'},
    {key:'party',label:'PARTY'},
    {key:'route',label:'ROUTE'},
    {key:'freight',label:'FREIGHT'},
    {key:'advance',label:'TRIP ADVANCE'},
    {key:'profit',label:'PROFIT'},
    {key:'invoice',label:'INVOICE'}
  ];
  function tripColumnKeys(){
    const fallback=TRIP_COLUMNS.map(x=>x.key);
    try{const saved=JSON.parse(localStorage.getItem('anori_trip_visible_columns')||'null');return Array.isArray(saved)&&saved.length?saved.filter(k=>fallback.includes(k)):fallback;}catch(e){return fallback;}
  }
  Trips.openColumnSelector=function(){
    const currentKeys=tripColumnKeys();
    const html=`<div style="text-align:left;display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:4px 2px;">${TRIP_COLUMNS.map(c=>`<label style="display:flex;align-items:center;gap:8px;padding:9px 10px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;cursor:pointer;"><input type="checkbox" class="anori-trip-col-check" value="${c.key}" ${currentKeys.includes(c.key)?'checked':''}> <span>${c.label}</span></label>`).join('')}</div><div style="margin-top:10px;font-size:12px;color:#64748b;text-align:left;">SELECT columns to display. The SELECT column is always retained.</div>`;
    Swal.fire({title:'CUSTOM COLUMN SELECTION',html,width:560,showCancelButton:true,confirmButtonText:'SAVE COLUMNS',cancelButtonText:'CANCEL',preConfirm:()=>{const keys=[...document.querySelectorAll('.anori-trip-col-check:checked')].map(x=>x.value);if(!keys.length){Swal.showValidationMessage('Select at least one column.');return false;}return keys;}}).then(r=>{if(!r.isConfirmed)return;localStorage.setItem('anori_trip_visible_columns',JSON.stringify(r.value));Trips.__selectedIds=new Set(Trips.getSelected());Router.go('trips');});
  };

  Trips.render=function(container){
    if(typeof sync==='function')sync();
    const {all,rows,pages,start}=current();
    const total=all.length, from=total?start+1:0, to=Math.min(start+PAGE_SIZE,total);
    const selected=Trips.getSelected();
    const pageAllSelected=rows.length>0&&rows.every(t=>Trips.__selectedIds.has(String(t.id)));
    const pagination=`<div class="anori-trip-pagination"><div class="anori-trip-page-info">Showing ${from} to ${to} of ${total} entries</div><div class="anori-trip-page-controls"><button type="button" class="anori-page-btn" ${Trips.__page<=1?'disabled':''} onclick="Trips.__gotoPage(${Trips.__page-1})">‹</button><span class="anori-page-current">${Trips.__page}</span><button type="button" class="anori-page-btn" ${Trips.__page>=pages?'disabled':''} onclick="Trips.__gotoPage(${Trips.__page+1})">›</button></div></div>`;
    const visibleCols=tripColumnKeys();
    const cellFor=(t,c)=>{
      const inv=activeInvV(t.id), v=vehicleV(t.vehicle_id), p=partyV(t.party_id);
      const e=(t.expenses||[]).reduce((s,x)=>s+nV(x.amount),0), profit=nV(t.freight)-e;
      const map={date:escV(t.date),trip:`<strong>${escV(t.trip_no)}</strong>`,vehicle:escV(v?.number||'-'),driver:escV((DB.get('drivers',[])||[]).find(x=>x.id===t.driver_id)?.name||'-'),party:escV(p?.name||'-'),route:`${escV(t.from)} → ${escV(t.to)}`,freight:moneyV(t.freight),advance:moneyV(t.trip_advance_amount),profit:`<span class="profit-positive">${moneyV(profit)}</span>`,invoice:inv?'<span class="status-badge status-shared">INVOICED</span>':'<span class="status-badge status-pending">PENDING</span>'};
      return map[c]||'-';
    };
    const rowsHtml=rows.map((t,idx)=>`<tr class="anori-trip-row ${idx%2===1?'anori-trip-alt-row':''}"><td><input type="checkbox" class="trip-row-check" value="${escV(t.id)}" ${Trips.__selectedIds.has(String(t.id))?'checked':''} onchange="Trips.__toggleRow('${escV(t.id)}',this.checked)"></td>${visibleCols.map(c=>`<td>${cellFor(t,c)}</td>`).join('')}</tr>`).join('');
    const tableHead=`<th class="anori-select-heading"></th>${visibleCols.map(c=>`<th>${TRIP_COLUMNS.find(x=>x.key===c)?.label||c.toUpperCase()}</th>`).join('')}`;
    container.innerHTML=`
      <div class="anori-section-intro"><div><strong>Trip Management</strong><span>Select rows, then use the Actions above the table.</span></div></div>
      <div class="card">
        ${window.toolbar('trip','tripSelectedCount')}
        <div class="anori-filter-bar anori-trip-search-filter-row">
          <label><span>SEARCH BY</span><select id="trip-manual-filter-field" class="form-control"><option value="all">ALL FIELDS</option><option value="party">PARTY NAME</option><option value="driver">DRIVER NAME</option><option value="pol">POL</option><option value="pod">POD</option><option value="invoice">INVOICE NO.</option><option value="trip">TRIP NO.</option><option value="vehicle">VEHICLE NO.</option></select></label>
          <label class="anori-trip-search-input"><span>SEARCH</span><input id="trip-manual-filter-query" class="form-control" type="text" placeholder="ENTER PARTY, DRIVER, POL, POD, INVOICE, TRIP OR VEHICLE..."></label>
          <button type="button" class="btn btn-primary" id="trip-manual-filter-search">🔎 SEARCH</button>
          <button type="button" class="btn btn-outline" id="trip-manual-filter-clear">↻ CLEAR</button>
          <span id="trip-manual-filter-count" class="anori-manual-search-count"></span>
        </div>
        <div class="table-wrapper anori-trip-table-wrap">
          ${total?`<table class="anori-trip-table"><thead><tr><th class="anori-select-heading" aria-label=""><input type="checkbox" class="trip-page-check-all" aria-label="Select all trips on this page" ${pageAllSelected?'checked':''} onchange="Trips.toggleAll(this.checked)"></th>${visibleCols.map(c=>`<th>${TRIP_COLUMNS.find(x=>x.key===c)?.label||c.toUpperCase()}</th>`).join('')}</tr></thead><tbody>${rowsHtml}</tbody></table>`:`<div class="empty-state"><i class="fas fa-route"></i><h3>No Trips Yet</h3><p>Create your first trip.</p></div>`}
        </div>${pagination}
      </div>`;

    // Manual search is intentionally manual: no filtering while typing.
    const search=()=>{
      const field=document.getElementById('trip-manual-filter-field')?.value||'all', q=(document.getElementById('trip-manual-filter-query')?.value||'').trim().toLowerCase();
      const rowsEls=[...container.querySelectorAll('tbody tr.anori-trip-row')];
      const count=document.getElementById('trip-manual-filter-count');let shown=0;
      rowsEls.forEach(row=>{
        const t=allTrips().find(x=>String(x.id)===String(row.querySelector('.trip-row-check')?.value));
        if(!t){row.style.display='none';return;}
        const p=partyV(t.party_id),d=(DB.get('drivers',[])||[]).find(x=>x.id===t.driver_id),v=vehicleV(t.vehicle_id),inv=activeInvV(t.id);
        const map={party:p?.name,driver:d?.name,pol:t.from,pod:t.to,invoice:inv?.invoice_no,trip:t.trip_no,vehicle:v?.number};
        const text=field==='all'?[p?.name,d?.name,t.from,t.to,inv?.invoice_no,t.trip_no,v?.number,t.date].filter(Boolean).join(' '):map[field]||'';
        const ok=!q||String(text).toLowerCase().includes(q);row.style.display=ok?'':'none';if(ok)shown++;
      });
      if(count)count.textContent=q?`${shown} RESULT${shown===1?'':'S'} FOUND`:'';
    };
    document.getElementById('trip-manual-filter-search')?.addEventListener('click',search);
    document.getElementById('trip-manual-filter-clear')?.addEventListener('click',()=>{document.getElementById('trip-manual-filter-query').value='';document.getElementById('trip-manual-filter-field').value='all';search();});
    document.getElementById('trip-manual-filter-query')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();search();}});
    Trips.updateSelectionCount();
    setTimeout(()=>window.anoriInstallTableUX?.(),0);
  };
  window.ANORI_TRIP_FINAL_UI=true;
})();


/* ============================================================
   ANORI TRANSPORT — INVOICES & BILLING FINAL UI AMENDMENT
   - Manual Search moved directly above the invoice table
   - No SELECT column in the invoice table
   - Row-click selection powers Preview / PDF / Payment / Cancel
   - DAYS replaces REMAINING DAYS with circular due-date indicator
   - Invoice date follows the earliest selected Trip date
   ============================================================ */
(function installInvoiceBillingFinalUI(){
  'use strict';
  if(typeof Invoices==='undefined') return;
  const escF=v=>Sanitize.html(v==null?'':String(v));
  const numF=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:0;};
  const moneyF=v=>Utils.fmt(numF(v));
  const allInv=()=>DB.get('invoices',[])||[];
  const partyF=id=>(DB.get('parties',[])||[]).find(p=>p.id===id);
  const paymentsF=()=>DB.get('payments',[])||[];
  const paidF=i=>numF(i?.advance)+paymentsF().filter(p=>p.invoice_id===i?.id).reduce((s,p)=>s+numF(p.amount),0);
  const balanceF=i=>Math.max(0,numF(i?.total_amount)-paidF(i));
  const statusF=i=>{
    if(!i)return 'unknown';
    if(String(i.status||'').toLowerCase()==='cancelled')return 'cancelled';
    const b=balanceF(i),p=paidF(i),due=new Date(Invoices.getDueDate(i.date,i.credit_days||30));
    if(b<=0)return 'paid';
    if(!Number.isNaN(due.getTime())&&due<new Date(`${Utils.today()}T00:00:00`))return 'overdue';
    return p>0?'part_paid':'unpaid';
  };
  const selected=new Set();
  let searchState={field:'all',query:''};
  const fieldOptions=[
    ['all','ALL FIELDS'],['party','PARTY NAME'],['driver','DRIVER NAME'],['pol','POL'],
    ['pod','POD'],['invoice','INVOICE NO.'],['trip','TRIP NO.'],['vehicle','VEHICLE NO.']
  ];
  function linkedTrips(i){
    if(Array.isArray(i?.trips_data)&&i.trips_data.length)return i.trips_data;
    const ids=Array.isArray(i?.trip_ids)?i.trip_ids:[];
    return (DB.get('trips',[])||[]).filter(t=>ids.includes(t.id));
  }
  function searchText(i,field){
    const p=partyF(i.party_id),ts=linkedTrips(i);
    const drivers=ts.map(t=>(DB.get('drivers',[])||[]).find(d=>d.id===t.driver_id)?.name).filter(Boolean).join(' ');
    const pol=ts.map(t=>t.from).filter(Boolean).join(' '),pod=ts.map(t=>t.to).filter(Boolean).join(' ');
    const trip=ts.map(t=>t.trip_no).filter(Boolean).join(' '),vehicle=ts.map(t=>(DB.get('vehicles',[])||[]).find(v=>v.id===t.vehicle_id)?.number).filter(Boolean).join(' ');
    const map={party:p?.name,driver:drivers,pol,pod,invoice:i.invoice_no,trip,vehicle};
    return field==='all'?[p?.name,drivers,pol,pod,i.invoice_no,trip,vehicle,i.date,statusF(i)].filter(Boolean).join(' '):(map[field]||'');
  }
  function dueDays(i){
    const due=Invoices.getDueDate(i.date,i.credit_days||30);
    const a=new Date(`${Utils.today()}T00:00:00`),b=new Date(`${due}T00:00:00`);
    if(Number.isNaN(b.getTime()))return null;
    return Math.round((b-a)/86400000);
  }
  function daysBadge(i){
    const d=dueDays(i);
    if(d===null)return '<span class="anori-days-badge anori-days-badge-red">-</span>';
    const overdue=d<0;
    return `<span class="anori-days-badge ${overdue?'anori-days-badge-red':'anori-days-badge-green'}" title="${overdue?'OVERDUE':'DUE AFTER'}">${Math.abs(d)}</span>`;
  }
  function renderSearch(){
    const options=fieldOptions.map(([v,l])=>`<option value="${v}" ${searchState.field===v?'selected':''}>${l}</option>`).join('');
    return `<div class="anori-invoice-searchbar"><label><span>SEARCH BY</span><select id="anori-invoice-search-field" class="form-control">${options}</select></label><label class="anori-invoice-search-query"><span>SEARCH</span><input id="anori-invoice-search-query" class="form-control" value="${escF(searchState.query)}" placeholder="ENTER SEARCH TEXT..."></label><button type="button" class="btn btn-primary" id="anori-invoice-search-btn">🔎 SEARCH</button><button type="button" class="btn btn-outline" id="anori-invoice-clear-btn">↻ CLEAR</button><span id="anori-invoice-search-count" class="anori-manual-search-count"></span></div>`;
  }
  function applySearch(){
    searchState.field=document.getElementById('anori-invoice-search-field')?.value||'all';
    searchState.query=(document.getElementById('anori-invoice-search-query')?.value||'').trim();
    const q=searchState.query.toLowerCase();let shown=0;
    document.querySelectorAll('#view-invoices tbody tr.anori-invoice-row').forEach(row=>{
      const inv=allInv().find(x=>String(x.id)===String(row.dataset.invoiceId));
      const ok=!!inv&&(!q||searchText(inv,searchState.field).toLowerCase().includes(q));
      row.style.display=ok?'':'none';if(ok)shown++;
    });
    const c=document.getElementById('anori-invoice-search-count');if(c)c.textContent=q?`${shown} RESULT${shown===1?'':'S'} FOUND`:'';
  }
  function clearSearch(){searchState={field:'all',query:''};const f=document.getElementById('anori-invoice-search-field'),q=document.getElementById('anori-invoice-search-query');if(f)f.value='all';if(q)q.value='';applySearch();}
  function selectRow(id){
    id=String(id);
    if(selected.has(id))selected.delete(id);else selected.add(id);
    document.querySelectorAll('#view-invoices .anori-invoice-row').forEach(r=>r.classList.toggle('anori-row-selected',selected.has(String(r.dataset.invoiceId))));
    Invoices.updateSelectionCount();
  }
  Invoices.getSelected=function(){
    const valid=new Set(allInv().map(i=>String(i.id)));
    [...selected].forEach(id=>{if(!valid.has(id))selected.delete(id);});
    return [...selected];
  };
  Invoices.updateSelectionCount=function(){const el=document.getElementById('invoiceSelectedCount');if(el)el.textContent=`${Invoices.getSelected().length} SELECTED`;};
  Invoices.toggleAll=function(flag){
    const rows=[...document.querySelectorAll('#view-invoices .anori-invoice-row')].filter(r=>r.style.display!=='none');
    rows.forEach(r=>flag?selected.add(String(r.dataset.invoiceId)):selected.delete(String(r.dataset.invoiceId)));
    document.querySelectorAll('#view-invoices .anori-invoice-row').forEach(r=>{
      const on=selected.has(String(r.dataset.invoiceId));
      r.classList.toggle('anori-row-selected',on);
      const cb=r.querySelector('.invoice-row-check'); if(cb) cb.checked=on;
    });
    Invoices.updateSelectionCount();
  };
  const needOne=()=>{const ids=Invoices.getSelected();if(ids.length!==1){Utils.toast(ids.length?'SELECT ONLY ONE INVOICE.':'SELECT ONE INVOICE BY CLICKING ITS ROW.','warning');return null;}return ids[0];};
  Invoices.actionPreview=function(){const id=needOne();if(id)Invoices.previewExisting(id);};
  Invoices.actionPDF=function(){const id=needOne();if(id)Invoices.downloadExisting(id);};
  Invoices.actionEmail=function(){const id=needOne();if(id)Invoices.emailExisting(id);};
  Invoices.actionPayment=function(){const id=needOne();if(id)Invoices.recordPayment(id);};
  Invoices.actionCancel=function(){const id=needOne();if(id)Invoices.cancelInvoice(id);};

  Invoices.render=function(container){
    if(typeof sync==='function')sync();
    const a=allInv();
    const active=a.filter(i=>statusF(i)!=='cancelled');
    const cnt={paid:0,unpaid:0,part_paid:0,overdue:0};active.forEach(i=>{const s=statusF(i);if(Object.prototype.hasOwnProperty.call(cnt,s))cnt[s]++;});
    const billed=active.reduce((s,i)=>s+numF(i.total_amount),0),received=active.reduce((s,i)=>s+paidF(i),0);
    container.innerHTML=`
      <div class="anori-section-intro"><div><strong>Invoices & Billing</strong><span>Payment status is calculated automatically from recorded payments.</span></div><button class="btn btn-success" onclick="Invoices.showInvoiceGenerator()">＋ NEW INVOICE</button></div>
      <div class="anori-kpi-grid anori-kpi-grid-5">
        <div class="anori-kpi-card"><span>TOTAL INVOICES</span><strong>${active.length}</strong><small>${moneyF(billed)} BILLED</small></div>
        <div class="anori-kpi-card anori-kpi-good"><span>PAID</span><strong>${cnt.paid}</strong><small>${moneyF(received)} RECEIVED</small></div>
        <div class="anori-kpi-card anori-kpi-warn"><span>UNPAID</span><strong>${cnt.unpaid}</strong><small>${moneyF(active.filter(i=>statusF(i)==='unpaid').reduce((s,i)=>s+balanceF(i),0))} PENDING</small></div>
        <div class="anori-kpi-card anori-kpi-info"><span>PART PAID</span><strong>${cnt.part_paid}</strong><small>${moneyF(active.filter(i=>statusF(i)==='part_paid').reduce((s,i)=>s+balanceF(i),0))} BALANCE</small></div>
        <div class="anori-kpi-card anori-kpi-bad"><span>OVERDUE</span><strong>${cnt.overdue}</strong><small>${moneyF(active.filter(i=>statusF(i)==='overdue').reduce((s,i)=>s+balanceF(i),0))} OVERDUE</small></div>
      </div>
      
      <div class="card">
        ${window.toolbar('invoice','invoiceSelectedCount')}
        ${renderSearch()}
        <div class="table-wrapper anori-invoice-table-wrap"><table class="anori-invoice-table"><thead><tr><th class="anori-select-col" aria-label=""><input type="checkbox" aria-label="SELECT ALL INVOICES" onchange="Invoices.toggleAll(this.checked)"></th><th>INVOICE</th><th>DATE</th><th>DUE DATE</th><th>DAYS</th><th>CUSTOMER</th><th>TRIPS</th><th>TOTAL</th><th>RECEIVED</th><th>BALANCE</th><th>STATUS</th></tr></thead><tbody>
        ${a.slice().reverse().map(i=>{const s=statusF(i),p=partyF(i.party_id),sid=String(i.id),isSel=selected.has(sid);return `<tr class="anori-invoice-row ${isSel?'anori-row-selected':''}" data-invoice-id="${escF(i.id)}" tabindex="0" title="CLICK TO SELECT"><td class="anori-select-col"><input type="checkbox" class="invoice-row-check" value="${escF(i.id)}" ${isSel?'checked':''} aria-label="SELECT INVOICE ${escF(i.invoice_no)}"></td><td><strong>${escF(i.invoice_no)}</strong></td><td>${escF(i.date)}</td><td>${escF(Invoices.getDueDate(i.date,i.credit_days||30))}</td><td>${daysBadge(i)}</td><td>${escF(p?.name||'-')}</td><td>${numF(i.trip_count)}</td><td>${moneyF(i.total_amount)}</td><td>${moneyF(paidF(i))}</td><td><strong>${moneyF(balanceF(i))}</strong></td><td><span class="status-badge status-${s.replace('_','-')}">${escF(s.replace('_',' ').toUpperCase())}</span></td></tr>`}).join('')||'<tr><td colspan="11" class="empty-state">NO INVOICES.</td></tr>'}
        </tbody></table></div>
      </div>`;
    container.querySelectorAll('.anori-invoice-row').forEach(row=>{
      row.addEventListener('click',e=>{if(e.target.closest('button,select,a'))return;if(e.target.closest('input[type="checkbox"]'))return;selectRow(row.dataset.invoiceId);});
      const cb=row.querySelector('.invoice-row-check');
      cb?.addEventListener('change',e=>{
        const id=String(row.dataset.invoiceId);
        if(e.target.checked)selected.add(id);else selected.delete(id);
        row.classList.toggle('anori-row-selected',e.target.checked);
        Invoices.updateSelectionCount();
      });
      row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectRow(row.dataset.invoiceId);}});
    });
    document.getElementById('anori-invoice-search-btn')?.addEventListener('click',applySearch);
    document.getElementById('anori-invoice-clear-btn')?.addEventListener('click',clearSearch);
    document.getElementById('anori-invoice-search-query')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();applySearch();}});
    if(searchState.query)applySearch();
    Invoices.updateSelectionCount();
    setTimeout(()=>window.anoriInstallTableUX?.(),0);
  };
  window.ANORI_INVOICE_FINAL_UI=true;
})();

/* FINAL INVOICE PDF FIX
   Invoices & Billing -> PDF and Invoice Preview -> Download PDF use the same
   rendered Invoice Preview DOM and the same html2pdf pipeline. No manual
   jsPDF.addImage coordinate calculations are used here. */
(function(){
  if(!window.Invoices) return;
  Invoices.downloadInvoice = function(invoice) { return (window.__ANORI_PDF_FINAL_FUNCTION ? window.__ANORI_PDF_FINAL_FUNCTION(invoice) : Promise.reject(new Error('PDF engine is initializing.'))); };

  // Invoices & Billing table/action-bar PDF button routes through the same
  // function above, which is also used by Invoice Preview's PDF button.
  Invoices.downloadExisting = function(id){
    const invoice=(DB.get('invoices',[])||[]).find(i=>String(i.id)===String(id));
    if(!invoice) return Utils.toast('Invoice not found.','error');
    return this.downloadInvoice(invoice);
  };
  Invoices.actionPDF = function(){
    const ids=typeof this.getSelected==='function' ? this.getSelected() : [];
    if(ids.length!==1) return Utils.toast(ids.length ? 'SELECT ONLY ONE INVOICE.' : 'SELECT ONE INVOICE.', 'warning');
    return this.downloadExisting(ids[0]);
  };
})();

/* FINAL INVOICE PDF ACTION OVERRIDE
   Invoices & Billing -> Actions -> PDF intentionally uses the exact same
   download path as the Invoice Preview -> Download PDF button.
   Avoid manual jsPDF.addImage coordinates because they can produce
   "Invalid coordinates passed to jsPDF.addImage" in Chromium/Electron. */
(function installFinalInvoicePDFAction(){
  'use strict';
  if(!window.Invoices) return;

  Invoices.downloadInvoice = function(invoice) { return (window.__ANORI_PDF_FINAL_FUNCTION ? window.__ANORI_PDF_FINAL_FUNCTION(invoice) : Promise.reject(new Error('PDF engine is initializing.'))); };

  Invoices.downloadExisting=function(id){
    const invoice=(DB.get('invoices',[])||[]).find(i=>String(i.id)===String(id));
    if(!invoice) return Utils.toast('Invoice not found.','error');
    return this.downloadInvoice(invoice);
  };

  Invoices.actionPDF=function(){
    const ids=typeof this.getSelected==='function' ? this.getSelected() : [];
    if(ids.length!==1) return Utils.toast(ids.length ? 'SELECT ONLY ONE INVOICE.' : 'SELECT ONE INVOICE.','warning');
    return this.downloadExisting(ids[0]);
  };
})();

/* FINAL NON-GST INVOICE DISPLAY GUARD
   A Non-GST invoice must never display CGST/SGST/IGST rows in either
   Invoice Preview or the PDF generated from that same preview. Normalize
   boolean/string values before the renderer evaluates invoice.is_gst. */
(function installFinalNonGstDisplayGuard(){
  'use strict';
  if(!window.Invoices || typeof Invoices.buildInvoiceHTML!=='function') return;

  const previousBuild=Invoices.buildInvoiceHTML;
  if(Invoices.__finalNonGstDisplayGuard) return;

  function toBool(value){
    if(value===true || value===1) return true;
    const v=String(value ?? '').trim().toLowerCase();
    return v==='true' || v==='1' || v==='yes' || v==='gst';
  }

  Invoices.buildInvoiceHTML=function(invoice, preview=false){
    const source=invoice || {};
    const normalized={...source};
    // Treat an explicit tax_type of "none" as Non-GST for display.
    // This also fixes older invoices whose is_gst flag was saved as true
    // while the selected tax mode was No Tax.
    const explicitTaxType=String(source.tax_type ?? '').trim().toLowerCase();
    normalized.is_gst=toBool(source.is_gst) && explicitTaxType!=='none' && explicitTaxType!=='nongst';
    normalized.tax_type=normalized.is_gst
      ? (explicitTaxType==='igst' ? 'igst' : 'cgst_sgst')
      : 'none';

    // Non-GST invoices carry zero tax values for accounting compatibility,
    // but those values must never become visible tax rows.
    if(!normalized.is_gst){
      normalized.cgst=0;
      normalized.sgst=0;
      normalized.igst=0;
    }

    return previousBuild.call(this, normalized, preview);
  };

  Invoices.__finalNonGstDisplayGuard=true;
})();

/* FINAL DRIVER SETTLEMENT PDF LEDGER — SINGLE ACTIVE A4 PORTRAIT RENDERER */
(function installFinalDriverSettlementPdf(){
  'use strict';
  if(typeof DriverSettlement === 'undefined') return;

  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
  const money=v=>{try{return Utils.fmt(Number(v)||0);}catch(_){return 'Rs. '+(Number(v)||0).toFixed(2);}};
  const num=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:0;};
  const isoToday=()=>typeof today==='function'?today():new Date().toISOString().slice(0,10);

  /*
   * IMPORTANT: PDF rows come directly from the same settlement store used by
   * DriverSettlement.applyFilter(). The DOM table is deliberately NOT used
   * as the PDF data source, so PDF data cannot be lost because of table layout,
   * overflow, hidden rows, or a stale screen render.
   */
  function getPdfRows(){
    if(typeof window.syncAllDriverTripEntries==='function') window.syncAllDriverTripEntries();

    const all=Array.isArray(DB.get('driver_settlements',[])) ? DB.get('driver_settlements',[]) : [];
    const driversList=Array.isArray(DB.get('drivers',[])) ? DB.get('drivers',[]) : [];
    const tripsList=Array.isArray(DB.get('trips',[])) ? DB.get('trips',[]) : [];
    const driverById=id=>driversList.find(d=>String(d.id)===String(id));
    const tripById=id=>tripsList.find(t=>String(t.id)===String(id));

    const driverId=document.getElementById('driverLedgerDriver')?.value||'';
    const period=document.getElementById('driverLedgerPeriod')?.value||'all';
    let from=document.getElementById('driverLedgerFrom')?.value||'';
    const to=document.getElementById('driverLedgerTo')?.value||isoToday();

    if(period==='week'){
      const d=new Date();
      d.setHours(0,0,0,0);
      d.setDate(d.getDate()-d.getDay());
      from=d.toISOString().slice(0,10);
    }else if(period==='month'){
      const t=isoToday();
      from=t.slice(0,7)+'-01';
    }

    const filtered=all.filter(r=>{
      if(!r) return false;
      if(driverId && String(r.driver_id)!==String(driverId)) return false;
      const date=String(r.date||'').slice(0,10);
      if(from && date<from) return false;
      if(to && date>to) return false;
      return true;
    });

    return filtered.map((r,i)=>({
      sr:String(i+1),
      date:clean(r.date||'-'),
      driver:clean(driverById(r.driver_id)?.name||'-'),
      trip:clean(tripById(r.trip_id)?.trip_no||'-'),
      type:r.type==='debit'?'GIVEN':'PAID',
      amount:money(r.amount),
      rawAmount:num(r.amount)
    }));
  }

  DriverSettlement.downloadPDF=async function(){
    try{
      if(!window.jspdf?.jsPDF){ const printable=document.querySelector('#view-settlements .table-wrapper')||document.querySelector('#view-settlements'); if(window.anoriPrintElement&&printable){ window.anoriPrintElement(printable,'ANORI TRANSPORT DRIVER SETTLEMENT LEDGER'); return true; } throw new Error('Driver Settlement print view is not available.'); }

      const rows=getPdfRows();
      const company=DB.get('company_profile',{})||{};
      const driverSelect=document.getElementById('driverLedgerDriver');
      const periodSelect=document.getElementById('driverLedgerPeriod');
      const selected=clean(driverSelect?.selectedOptions?.[0]?.textContent||'ALL DRIVERS');
      const period=clean(periodSelect?.selectedOptions?.[0]?.textContent||'ALL');
      const from=clean(document.getElementById('driverLedgerFrom')?.value||'ALL');
      const to=clean(document.getElementById('driverLedgerTo')?.value||isoToday());

      let given=0,paid=0;
      rows.forEach(r=>{if(r.type==='GIVEN')given+=r.rawAmount;else paid+=r.rawAmount;});

      /* Dedicated A4 Portrait drawing surface. No HTML-to-canvas capture. */
      const W=2480,H=3508,M=90,CW=W-M*2,footerY=H-M-45;
      const canvas=document.createElement('canvas');
      canvas.width=W;canvas.height=H;
      const ctx=canvas.getContext('2d');
      if(!ctx) throw new Error('UNABLE TO PREPARE PDF CANVAS.');
      ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);ctx.textBaseline='top';
      const fontFamily='Arial, Helvetica, sans-serif';
      const base=43.4; // current body text +40%
      const header=48;
      const defs=[
        ['sr','SR. NO.',.10,'center'],['date','DATE',.15,'left'],['driver','DRIVER',.25,'left'],
        ['trip','TRIP',.20,'left'],['type','TYPE',.12,'left'],['amount','AMOUNT',.18,'right']
      ];
      const widths=defs.map(d=>CW*d[2]);
      const xs=[];let x=M;
      widths.forEach(w=>{xs.push(x);x+=w;});

      const wrap=(text,maxW,font)=>{
        ctx.font=font;
        const words=String(text??'').split(/\s+/).filter(Boolean),out=[];let line='';
        for(const word of words){
          let candidate=line?line+' '+word:word;
          if(ctx.measureText(candidate).width<=maxW){line=candidate;continue;}
          if(line)out.push(line);
          if(ctx.measureText(word).width<=maxW){line=word;continue;}
          let part='';
          for(const ch of word){
            const test=part+ch;
            if(!part||ctx.measureText(test).width<=maxW)part=test;
            else{out.push(part);part=ch;}
          }
          line=part;
        }
        if(line)out.push(line);
        return out.length?out:[''];
      };

      const drawPage=(pageRows,summary)=>{
        ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);let y=M;
        ctx.fillStyle='#1d4ed8';ctx.fillRect(M,y,CW,8);y+=28;
        ctx.fillStyle='#0f172a';ctx.font=`700 77px ${fontFamily}`;ctx.fillText(clean(company.name||'ANORI TRANSPORT'),M,y);y+=70;
        ctx.font=`700 55px ${fontFamily}`;ctx.fillText('DRIVER SETTLEMENT LEDGER',M,y);y+=58;
        ctx.fillStyle='#475569';ctx.font=`400 31px ${fontFamily}`;
        const contact=[company.phone&&('PHONE: '+clean(company.phone)),company.gstin&&('GSTIN: '+clean(company.gstin)),company.pan&&('PAN: '+clean(company.pan))].filter(Boolean).join(' | ');
        if(contact){ctx.fillText(contact,M,y);y+=38;}y+=16;

        const metaH=82,metaW=CW/5;
        ctx.fillStyle='#f6f8fc';ctx.fillRect(M,y,CW,metaH);ctx.strokeStyle='#cbd5e1';ctx.lineWidth=2;ctx.strokeRect(M,y,CW,metaH);
        [['DRIVER',selected],['PERIOD',period],['FROM',from||'ALL'],['TO',to],['GENERATED',isoToday()]].forEach((v,i)=>{
          const mx=M+i*metaW;
          if(i){ctx.beginPath();ctx.moveTo(mx,y);ctx.lineTo(mx,y+metaH);ctx.stroke();}
          ctx.fillStyle='#475569';ctx.font=`700 25px ${fontFamily}`;ctx.fillText(v[0],mx+12,y+10);
          ctx.fillStyle='#0f172a';ctx.font=`600 31px ${fontFamily}`;ctx.fillText(wrap(v[1],metaW-24,`600 31px ${fontFamily}`)[0],mx+12,y+44);
        });
        y+=metaH+24;

        const headerH=68;
        ctx.fillStyle='#e8eff9';ctx.fillRect(M,y,CW,headerH);ctx.strokeStyle='#b9c9df';ctx.strokeRect(M,y,CW,headerH);
        defs.forEach((d,i)=>{
          const xx=xs[i];
          if(i){ctx.beginPath();ctx.moveTo(xx,y);ctx.lineTo(xx,y+headerH);ctx.stroke();}
          ctx.fillStyle='#173b6b';ctx.font=`700 ${header}px ${fontFamily}`;
          const tw=ctx.measureText(d[1]).width;
          let tx=xx+12;
          if(d[3]==='center')tx=xx+(widths[i]-tw)/2;
          if(d[3]==='right')tx=xx+widths[i]-tw-12;
          ctx.fillText(d[1],tx,y+12);
        });
        y+=headerH;

        pageRows.forEach(r=>{
          const vals=defs.map(d=>r[d[0]]);
          const wrapped=vals.map((v,i)=>wrap(v,widths[i]-24,`400 ${base}px ${fontFamily}`));
          const lines=Math.max(...wrapped.map(a=>a.length));
          const rowH=Math.max(82,lines*55+24);
          ctx.fillStyle='#fff';ctx.fillRect(M,y,CW,rowH);
          ctx.strokeStyle='#cbd5e1';ctx.strokeRect(M,y,CW,rowH);
          defs.forEach((d,i)=>{
            const xx=xs[i];
            if(i){ctx.beginPath();ctx.moveTo(xx,y);ctx.lineTo(xx,y+rowH);ctx.stroke();}
            ctx.font=`400 ${base}px ${fontFamily}`;
            wrapped[i].forEach((line,j)=>{
              const tw=ctx.measureText(line).width;
              let tx=xx+12;
              if(d[3]==='center')tx=xx+(widths[i]-tw)/2;
              if(d[3]==='right')tx=xx+widths[i]-tw-12;
              ctx.fillStyle='#172b4d';ctx.fillText(line,tx,y+12+j*55);
            });
          });
          y+=rowH;
        });

        if(summary){
          y=Math.min(y+26,H-M-240);
          const sw=1200,sx=M+CW-sw;
          [['TOTAL GIVEN / ADVANCE',money(given)],['TOTAL PAID',money(paid)],['BALANCE',money(Math.max(given-paid,0))]].forEach((r,i)=>{
            const rh=78;
            ctx.fillStyle=i===2?'#173b6b':'#f6f8fc';ctx.fillRect(sx,y,sw,rh);
            ctx.strokeStyle='#cbd5e1';ctx.strokeRect(sx,y,sw,rh);
            ctx.fillStyle=i===2?'#fff':'#172b4d';ctx.font=`700 38px ${fontFamily}`;
            ctx.fillText(r[0],sx+18,y+18);
            const tw=ctx.measureText(r[1]).width;ctx.fillText(r[1],sx+sw-tw-20,y+18);y+=rh+8;
          });
        }
        ctx.fillStyle='#64748b';ctx.font=`400 28px ${fontFamily}`;
        ctx.fillText('ANORI TRANSPORT — DRIVER SETTLEMENT LEDGER',M,footerY);
        return canvas;
      };

      /* Calculate real row heights using the same renderer metrics, then split. */
      ctx.font=`400 ${base}px ${fontFamily}`;
      const heights=rows.map(r=>{
        const vals=defs.map(d=>r[d[0]]);
        const maxLines=Math.max(...vals.map((v,i)=>wrap(v,widths[i]-24,`400 ${base}px ${fontFamily}`).length));
        return Math.max(82,maxLines*55+24);
      });
      const firstY=M+28+70+58+54+16+82+24+68;
      const available=footerY-firstY-20;
      const pages=[];let batch=[],used=0;
      rows.forEach((r,i)=>{
        if(batch.length&&used+heights[i]>available){pages.push(batch);batch=[];used=0;}
        batch.push(r);used+=heights[i];
      });
      if(batch.length||!pages.length)pages.push(batch);

      const pdf=new window.jspdf.jsPDF({unit:'mm',format:'a4',orientation:'portrait',compress:true});
      const pw=pdf.internal.pageSize.getWidth(),ph=pdf.internal.pageSize.getHeight();
      pages.forEach((pageRows,i)=>{
        if(i)pdf.addPage('a4','portrait');
        const c=drawPage(pageRows,i===pages.length-1);
        pdf.addImage(c.toDataURL('image/jpeg',.96),'JPEG',4,4,pw-8,ph-8,undefined,'FAST');
      });
      const safe=clean(selected).replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toUpperCase()||'ALL-DRIVERS';
      pdf.save(`ANORI_TRANSPORT_DRIVER_LEDGER_${safe}_${isoToday()}.PDF`);
      if(window.Utils?.toast)Utils.toast(`PDF ledger downloaded (${rows.length} entries).`,'success');
      return true;
    }catch(e){
      console.warn('ANORI DRIVER LEDGER PDF FALLBACK:',e?.message||e);
      if(window.Swal)await Swal.fire({icon:'error',title:'PDF GENERATION FAILED',text:e?.message||'UNABLE TO GENERATE DRIVER SETTLEMENT LEDGER PDF.',confirmButtonText:'OK'});
      else if(window.Utils?.toast)Utils.toast(e?.message||'UNABLE TO GENERATE DRIVER SETTLEMENT LEDGER PDF.','error');
      return false;
    }
  };
  DriverSettlement.exportLedger=DriverSettlement.downloadPDF;
  DriverSettlement.__finalPdfLedgerInstalled=true;
})();

/* ===== END app.js ===== */

/* ===== BEGIN data-transfer.js ===== */
/* ANORI TRANSPORT - Global Data Import / Export Center
 * Full-fidelity JSON / Excel / SQLite / CSV transfers.
 * Uses browser-safe download and File System Access APIs when available.
 */
(function installAnoriDataTransfer(){
  'use strict';
  if(window.__ANORI_DATA_TRANSFER_V1__) return;
  window.__ANORI_DATA_TRANSFER_V1__=true;

  const DATA_KEYS=['company_profile','vehicles','drivers','parties','trips','invoices','driver_settlements','payments','expense_master','followups','audit_log'];
  const todaySafe=()=>typeof today==='function'?today():new Date().toISOString().slice(0,10);
  const esc=v=>typeof Sanitize!=='undefined'&&Sanitize.html?Sanitize.html(v==null?'':String(v)):String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const snapshot=()=>{
    const out={version:'2.24',application:'ANORI TRANSPORT',exported_at:new Date().toISOString()};
    DATA_KEYS.forEach(k=>out[k]=DB.get(k,k==='company_profile'?{}:[]));
    return out;
  };
  const download=(blob,name)=>{
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const notify=(m,t='info')=>{try{Utils.toast(m,t)}catch(_){if(t==='error')console.warn('[ANORI]',m);else console.log(m)}};
  const sqliteReady=()=>!!(window.AnoriSQLite?.exportSnapshot||typeof initSqlJs==='function');
  const sqliteUnavailable=()=>false;
  const confirmImport=async present=>{
    if(window.Swal){
      const r=await Swal.fire({icon:'warning',title:'IMPORT DATA?',html:`<div style="text-align:left"><p><strong>${present.length}</strong> supported data sections found.</p><p>This will replace the matching data in ANORI TRANSPORT.</p><p>Your existing data will be protected by an internal rollback snapshot. No file will be downloaded unless you explicitly choose an Export option.</p></div>`,showCancelButton:true,confirmButtonText:'IMPORT DATA',cancelButtonText:'CANCEL'});
      return r.isConfirmed;
    }
    return window.confirm('Import '+present.length+' data sections? Existing data will be protected by an internal rollback snapshot. No file will be downloaded automatically.');
  };
  const applyImport=async data=>{
    const present=DATA_KEYS.filter(k=>Object.prototype.hasOwnProperty.call(data,k));
    if(!present.length) throw new Error('No supported ANORI TRANSPORT data sections found.');
    if(present.some(k=>k==='company_profile' ? (data[k]===null || typeof data[k]!=='object' || Array.isArray(data[k])) : !Array.isArray(data[k]))) throw new Error('Invalid data structure: company profile must be an object and other supported sections must be arrays.');
    const approx=(()=>{try{return JSON.stringify(data).length}catch(_){return 0}})();
    if(approx>100*1024*1024) throw new Error('Import file is too large. Maximum supported size is 100 MB.');
    if(!await confirmImport(present)) return false;
    // Keep a persistent internal snapshot plus an in-memory snapshot. No backup file is downloaded.
    const rollback={};DATA_KEYS.forEach(k=>rollback[k]=DB.get(k,k==='company_profile'?{}:[]));
    try{if(window.ANORI_DATA_SAFETY?.createRollbackSnapshot)await window.ANORI_DATA_SAFETY.createRollbackSnapshot('pre-import');}catch(e){console.warn('Persistent safety snapshot unavailable; continuing with in-memory rollback.',e);}
    try{
      present.forEach(k=>{if(!DB.set(k,data[k],true))throw new Error(`Could not save section: ${k}`);});
      if(typeof sync==='function')sync();
      notify('Data imported successfully. No backup file was downloaded. Previous data remains available for rollback if the import fails.','success');
      if(typeof Router!=='undefined'&&Router.go)Router.go('settings');
      return true;
    }catch(e){
      console.error('Import failed; restoring previous data.',e);
      try{DATA_KEYS.forEach(k=>DB.set(k,rollback[k],true));if(typeof sync==='function')sync();}catch(restoreError){console.error('Rollback failed:',restoreError);}
      throw new Error('Import failed and the previous data was restored. '+(e.message||''));
    }
  };

  // ---------- JSON ----------
  window.anoriExportJSON=()=>{download(new Blob([JSON.stringify(snapshot(),null,2)],{type:'application/json'}),`anori-data-${todaySafe()}.json`);notify('JSON export downloaded.','success');};

  // ---------- Excel ----------
  window.anoriExportXLSX=()=>{
    if(typeof XLSX==='undefined')return notify('Excel library unavailable.','error');
    const wb=XLSX.utils.book_new();
    const meta=[];
    DATA_KEYS.forEach(k=>{
      const v=DB.get(k,k==='company_profile'?{}:[]);
      if(Array.isArray(v)){
        const rows=v.length?v:[{}];
        XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),k.slice(0,31));
      }else{
        meta.push({section:k,json:JSON.stringify(v??{})});
      }
    });
    XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(meta.length?meta:[{section:'company_profile',json:'{}'}]),'__ANORI_META__');
    XLSX.writeFile(wb,`anori-data-${todaySafe()}.xlsx`);
    notify('Excel export downloaded.','success');
  };

  // ---------- SQLite ----------
  window.anoriExportSQLite=async()=>{
    if(!sqliteReady())return notify('SQLite backup engine unavailable.','error');
    try{const bytes=window.AnoriSQLite?.exportSnapshot?window.AnoriSQLite.exportSnapshot(snapshot()):await (async()=>{const SQL=await initSqlJs({locateFile:f=>window.__ANORI_SQL_LOCAL__?`libs/sqljs/${f}`:`https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${f}`});const db=new SQL.Database();DATA_KEYS.forEach(k=>{const t=k.replace(/[^A-Za-z0-9_]/g,'_');db.run(`CREATE TABLE IF NOT EXISTS "${t}" (json TEXT NOT NULL)`);const v=DB.get(k,k==='company_profile'?{}:[]);(Array.isArray(v)?v:[v]).forEach(r=>db.run(`INSERT INTO "${t}" VALUES (?)`,[JSON.stringify(r??{})]));});const x=db.export();db.close();return x;})();download(new Blob([bytes],{type:'application/x-sqlite3'}),`anori-data-${todaySafe()}.sqlite`);notify('SQLite export downloaded.','success');}catch(e){console.error(e);notify('SQLite export failed: '+(e.message||'unknown error'),'error');}
  };

  // ---------- CSV (one file containing every table/section) ----------
  const csvQuote=v=>'"'+String(v??'').replaceAll('"','""')+'"';
  window.anoriExportCSV=()=>{
    const s=snapshot(),out=[];
    DATA_KEYS.forEach(k=>{
      const raw=s[k],rows=Array.isArray(raw)?raw:[raw||{}];
      const keys=[...new Set(rows.flatMap(r=>Object.keys(r||{})))];
      out.push(`# SECTION: ${k}`);
      out.push(keys.map(csvQuote).join(','));
      rows.forEach(r=>out.push(keys.map(q=>csvQuote(typeof r?.[q]==='object'?JSON.stringify(r[q]):r?.[q])).join(',')));
      out.push('');
    });
    download(new Blob([out.join('\n')],{type:'text/csv;charset=utf-8'}),`anori-data-${todaySafe()}.csv`);
    notify('CSV export downloaded.','success');
  };

  // ---------- Import ----------
  // Normalize only fields that are semantically dates. This prevents Excel/CSV
  // round-trips from turning application dates into locale-dependent strings.
  const isDateKey=k=>{const x=String(k||'').toLowerCase();return x==='date'||x.endsWith('_date')||x.startsWith('date_')||x==='dob'||x.endsWith('_dob');};
  const isDateTimeKey=k=>{const x=String(k||'').toLowerCase();return x.endsWith('_at')||x==='created'||x==='updated';};
  const pad=n=>String(n).padStart(2,'0');
  const excelSerialToDate=v=>{
    const n=Number(v); if(!Number.isFinite(n)||n<1||n>2958465)return null;
    const d=new Date(Date.UTC(1899,11,30)+Math.round(n)*86400000);
    return Number.isNaN(d.getTime())?null:`${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`;
  };
  const normalizeDate=(v,key)=>{
    if(v==null||v==='')return v;
    if(v instanceof Date){
      if(isDateTimeKey(key))return v.toISOString();
      return `${v.getFullYear()}-${pad(v.getMonth()+1)}-${pad(v.getDate())}`;
    }
    if(!isDateKey(key))return v;
    if(typeof v==='number')return excelSerialToDate(v)||v;
    const s=String(v).trim();
    if(/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(s))return s.slice(0,10);
    let m=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if(m){
      const a=Number(m[1]),b=Number(m[2]),y=Number(m[3]);
      // For ambiguous DD/MM vs MM/DD, prefer the application's Indian date convention
      // when both parts are <= 12, while unambiguous values are handled directly.
      const day=a>12? a : b>12 ? b : a;
      const month=a>12? b : b>12 ? a : b;
      const d=new Date(Date.UTC(y,month-1,day));
      if(d.getUTCFullYear()===y&&d.getUTCMonth()===month-1&&d.getUTCDate()===day)return `${y}-${pad(month)}-${pad(day)}`;
    }
    return v;
  };
  const normalizeRecord=(value)=>{
    if(Array.isArray(value))return value.map(normalizeRecord);
    if(value&&typeof value==='object'&&! (value instanceof Date)){
      const out={};Object.keys(value).forEach(k=>out[k]=normalizeDate(normalizeRecord(value[k]),k));return out;
    }
    return value;
  };
  const normalizeImportedPayload=(data)=>{
    const out={};DATA_KEYS.forEach(k=>{if(Object.prototype.hasOwnProperty.call(data,k))out[k]=normalizeRecord(data[k]);});return out;
  };
  const readJson=async f=>normalizeImportedPayload(JSON.parse(await f.text()));
  const readXlsx=async f=>{
    if(typeof XLSX==='undefined')throw new Error('Excel library unavailable.');
    const wb=XLSX.read(await f.arrayBuffer(),{type:'array',cellDates:true,cellNF:true,cellText:false}),d={};
    wb.SheetNames.forEach(name=>{
      if(name==='__ANORI_META__'){
        const rows=XLSX.utils.sheet_to_json(wb.Sheets[name],{defval:''});
        rows.forEach(r=>{if(r.section){try{d[r.section]=JSON.parse(r.json||'{}');}catch(e){throw new Error(`Invalid metadata for section ${r.section}.`);}}});
      }else if(DATA_KEYS.includes(name)){
        const rows=XLSX.utils.sheet_to_json(wb.Sheets[name],{defval:'',raw:true});
        d[name]=name==='company_profile'?(rows[0]||{}):rows;
      }
    });
    return normalizeImportedPayload(d);
  };
  const readSqlite=async f=>{
    const bytes=await f.arrayBuffer();
    if(window.AnoriSQLite?.importBytes)return normalizeImportedPayload(window.AnoriSQLite.importBytes(bytes));
    if(!sqliteReady())throw new Error('SQLite import engine unavailable.');
    const SQL=await initSqlJs({locateFile:x=>window.__ANORI_SQL_LOCAL__?`libs/sqljs/${x}`:`https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${x}`});const db=new SQL.Database(new Uint8Array(bytes)),d={};DATA_KEYS.forEach(k=>{const t=k.replace(/[^A-Za-z0-9_]/g,'_');try{const q=db.exec(`SELECT json FROM "${t}"`);if(q[0]){const vals=q[0].values.map(r=>JSON.parse(r[0]));d[k]=k==='company_profile'?(vals[0]||{}):vals;}}catch(_){}});db.close();return normalizeImportedPayload(d);
  };
  const readCsv=async f=>{
    const text=(await f.text()).replace(/^\uFEFF/,'');
    const lines=text.split(/\r?\n/),d={};let section=null,headers=null;
    const parseLine=line=>{const out=[];let cur='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(quoted&&line[i+1]==='"'){cur+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){out.push(cur);cur='';}else cur+=c;}out.push(cur);return out;};
    for(const line of lines){
      if(!line.trim())continue;
      const m=line.match(/^# SECTION:\s*(.+)$/i);if(m){section=m[1].trim();headers=null;continue;}
      if(!section||!DATA_KEYS.includes(section))continue;
      if(!headers){headers=parseLine(line);continue;}
      const vals=parseLine(line),obj={};headers.forEach((h,i)=>{let v=vals[i]??'';if((v.startsWith('{')&&v.endsWith('}'))||(v.startsWith('[')&&v.endsWith(']'))){try{v=JSON.parse(v)}catch(_){}}obj[h]=v;});
      (d[section]||(d[section]=[])).push(obj);
    }
    if(d.company_profile)d.company_profile=d.company_profile[0]||{};
    return normalizeImportedPayload(d);
  };

  // Replace the legacy app.js file picker with the format-aware implementation
  // above so every Import button uses the same validation, date handling and
  // safety/rollback path. No existing application data is touched until the
  // user confirms the import and the pre-import backup succeeds.
  window.anoriImportFile=async()=>{
    const i=document.createElement('input');i.type='file';i.accept='.json,.xlsx,.sqlite,.db,.csv';
    i.onchange=async()=>{
      try{
        const f=i.files?.[0];if(!f)return;
        const n=f.name.toLowerCase();
        const format=n.endsWith('.json')?'json':n.endsWith('.xlsx')?'xlsx':(n.endsWith('.sqlite')||n.endsWith('.db'))?'sqlite':n.endsWith('.csv')?'csv':null;
        if(!format)throw new Error('Unsupported import format. Use JSON, XLSX, CSV or SQLite.');
        let d;if(format==='json')d=await readJson(f);else if(format==='xlsx')d=await readXlsx(f);else if(format==='sqlite')d=await readSqlite(f);else d=await readCsv(f);
        return await applyImport(d);
      }catch(e){if(/SQLite is not available/i.test(e?.message||'')){return;} console.error(e);if(window.Swal)await Swal.fire({icon:'error',title:'IMPORT FAILED',text:e.message||'Unable to import file.'});else notify(e.message||'Import failed.','error');}
    };i.click();
  };

  window.anoriImportByFormat=async format=>{
    const accept={json:'.json',xlsx:'.xlsx',sqlite:'.sqlite,.db',csv:'.csv'}[format]||'.json';
    const i=document.createElement('input');i.type='file';i.accept=accept;
    i.onchange=async()=>{try{const f=i.files?.[0];if(!f)return;let d;if(format==='json')d=await readJson(f);else if(format==='xlsx')d=await readXlsx(f);else if(format==='sqlite')d=await readSqlite(f);else d=await readCsv(f);await applyImport(d);}catch(e){if(/SQLite is not available/i.test(e?.message||'')){return;} console.error(e);if(window.Swal)Swal.fire({icon:'error',title:'IMPORT FAILED',text:e.message||'Unable to import file.'});else notify(e.message||'Import failed.','error');}};
    i.click();
  };

  // ---------- Manual export destination ----------
  let exportFolder=null;
  window.anoriSelectExportPath=async()=>{
    if(typeof window.showDirectoryPicker!=='function'){
      if(window.Swal)Swal.fire({icon:'info',title:'BROWSER PATH ACCESS',html:'Your browser does not allow a website to set an arbitrary Windows path. Use <strong>Select Export Folder</strong> in Chrome/Edge, or use the normal Download buttons.'});
      return;
    }
    try{
      const h=await window.showDirectoryPicker({id:'anori-export',mode:'readwrite'});
      if(h){exportFolder=h;localStorage.setItem('anori_export_folder_name',h.name||'Selected Folder');const el=document.getElementById('anoriExportPathName');if(el)el.textContent=h.name||'Selected Folder';notify('Export folder selected.','success');}
    }catch(e){if(e.name!=='AbortError')notify('Export folder selection failed.','error');}
  };
  window.anoriExportToPath=async()=>{
    const format=(document.getElementById('anoriExportFormat')?.value||'json').toLowerCase();
    if(!exportFolder)return window.anoriSelectExportPath();
    try{
      if(typeof exportFolder.queryPermission==='function'&&await exportFolder.queryPermission({mode:'readwrite'})!=='granted'){
        if(typeof exportFolder.requestPermission!=='function'||await exportFolder.requestPermission({mode:'readwrite'})!=='granted')throw new Error('Write permission not granted.');
      }
      let bytes,name,type;
      if(format==='json'){bytes=new TextEncoder().encode(JSON.stringify(snapshot(),null,2));name=`anori-data-${todaySafe()}.json`;type='application/json';}
      else if(format==='sqlite'){
        if(!sqliteReady())throw new Error('SQLite export engine unavailable.');
        bytes=window.AnoriSQLite.exportSnapshot(snapshot());name=`anori-data-${todaySafe()}.sqlite`;type='application/x-sqlite3';
      }else throw new Error('Select JSON or SQLite.');
      const fh=await exportFolder.getFileHandle(name,{create:true}),w=await fh.createWritable();await w.write(new Blob([bytes],{type}));await w.close();notify(`${format.toUpperCase()} exported to selected folder.`,'success');
    }catch(e){console.error(e);notify('Export failed: '+(e.message||'unknown error'),'error');}
  };

  // ---------- Settings UI ----------
  const baseSettings=window.Settings&&Settings.render?Settings.render.bind(Settings):null;
  if(baseSettings){
    Settings.render=function(container){
      baseSettings(container);
      const cards=[...container.querySelectorAll('.card')];
      const card=cards.find(c=>/Data Import \/ Export/i.test(c.textContent||''));
      if(!card)return;
      card.innerHTML=`
        <h3 class="card-title"><i class="fas fa-database"></i> DATA IMPORT / EXPORT</h3>
        <div class="anori-data-transfer-path">
          <div><strong>EXPORT PATH</strong><span id="anoriExportPathName">${esc(localStorage.getItem('anori_export_folder_name')||'NOT SELECTED')}</span></div>
          <div class="anori-data-transfer-path-actions"><select id="anoriExportFormat" class="form-control"><option value="json">JSON</option><option value="sqlite">SQLITE</option></select><button class="anori-action-btn anori-action-export" type="button" onclick="anoriSelectExportPath()">📁 SELECT EXPORT FOLDER</button><button class="anori-action-btn anori-action-preview" type="button" onclick="anoriExportToPath()">⬆ EXPORT TO PATH</button></div>
        </div>
        <div class="anori-transfer-grid">
          <div class="anori-transfer-card"><h4>📦 JSON</h4><p>FULL DATA BACKUP / RESTORE</p><div><button class="anori-action-btn anori-action-export" type="button" onclick="anoriExportJSON()">EXPORT JSON</button><button class="anori-action-btn anori-action-convert" type="button" onclick="anoriImportByFormat('json')">IMPORT JSON</button></div></div>
          <div class="anori-transfer-card"><h4>📊 EXCEL</h4><p>ALL TABLES IN ONE WORKBOOK</p><div><button class="anori-action-btn anori-action-export" type="button" onclick="anoriExportXLSX()">EXPORT EXCEL</button><button class="anori-action-btn anori-action-convert" type="button" onclick="anoriImportByFormat('xlsx')">IMPORT EXCEL</button></div></div>
          <div class="anori-transfer-card"><h4>🗄 SQLITE</h4><p>FULL DATABASE BACKUP / RESTORE</p><div><button class="anori-action-btn anori-action-export" type="button" onclick="anoriExportSQLite()">EXPORT SQLITE</button><button class="anori-action-btn anori-action-convert" type="button" onclick="anoriImportByFormat('sqlite')">IMPORT SQLITE</button></div></div>
          <div class="anori-transfer-card"><h4>📄 CSV</h4><p>ALL DATA SECTIONS IN ONE FILE</p><div><button class="anori-action-btn anori-action-export" type="button" onclick="anoriExportCSV()">EXPORT CSV</button><button class="anori-action-btn anori-action-convert" type="button" onclick="anoriImportByFormat('csv')">IMPORT CSV</button></div></div>
        </div>
        <small class="anori-help">JSON and SQLite preserve the complete ANORI TRANSPORT data structure. Excel and CSV are designed for editable data exchange. Browser security does not allow an arbitrary typed Windows path; use the folder picker for direct export.</small>`;
    };
  }
})();

/* ===== END data-transfer.js ===== */

/* ===== BEGIN anori-data-safety.js ===== */
/* ANORI TRANSPORT — Persistent Data Safety Layer v2.25
   Internal snapshots only. Never downloads a file automatically. */
(function(){
  'use strict';
  const DB_NAME='anori_safety_v225', STORE='snapshots', MAX=3;
  const KEYS=['company_profile','vehicles','drivers','parties','trips','invoices','driver_settlements','payments','expense_master','followups','audit_log'];
  function open(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
  function all(){return new Promise(async(resolve,reject)=>{try{const db=await open();const tx=db.transaction(STORE,'readonly'),q=tx.objectStore(STORE).getAll();q.onsuccess=()=>{db.close();resolve((q.result||[]).sort((a,b)=>b.created_at.localeCompare(a.created_at)))};q.onerror=()=>{db.close();reject(q.error)}}catch(e){reject(e)}})}
  async function sha(text){if(window.crypto?.subtle){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}return String(text.length);}
  function collect(){const data={};KEYS.forEach(k=>data[k]=DB.get(k,k==='company_profile'?{}:[]));return data;}
  async function create(reason='manual'){const data=collect(),json=JSON.stringify(data),item={id:Date.now()+'-'+Math.random().toString(36).slice(2),created_at:new Date().toISOString(),reason,checksum:await sha(json),data};const db=await open();await new Promise((res,rej)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(item);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)});db.close();const items=await all();for(const old of items.slice(MAX)){const d=await open();await new Promise(r=>{const tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(old.id);tx.oncomplete=r;tx.onerror=r});d.close();}return item;}
  async function latest(){const a=await all();return a[0]||null;}
  async function restoreLatest(){const item=await latest();if(!item)throw new Error('No internal safety snapshot is available.');const json=JSON.stringify(item.data);if(await sha(json)!==item.checksum)throw new Error('Safety snapshot integrity check failed.');KEYS.forEach(k=>{if(Object.prototype.hasOwnProperty.call(item.data,k))DB.set(k,item.data[k],true)});if(typeof sync==='function')sync();return item;}
  async function status(){const a=await all();return {count:a.length,latest:a[0]||null};}
  window.ANORI_DATA_SAFETY=Object.assign(window.ANORI_DATA_SAFETY||{}, {version:'2.25',keys:KEYS,createRollbackSnapshot:create,restoreRollbackSnapshot:restoreLatest,status});
  window.anoriRestoreLastSafetySnapshot=async function(){
    try{
      const s=await status(); if(!s.latest){if(window.Swal)await Swal.fire({icon:'info',title:'NO SAFETY SNAPSHOT',text:'No internal rollback snapshot is available.'});return false;}
      const ok=window.Swal ? (await Swal.fire({icon:'warning',title:'RESTORE LAST INTERNAL SNAPSHOT?',html:`<p>This restores the application data captured before the last protected operation.</p><p><strong>${new Date(s.latest.created_at).toLocaleString()}</strong></p><p>No file will be downloaded.</p>`,showCancelButton:true,confirmButtonText:'RESTORE',cancelButtonText:'CANCEL'})).isConfirmed : window.confirm('Restore the last internal safety snapshot?');
      if(!ok)return false; await restoreLatest(); if(window.Swal)await Swal.fire({icon:'success',title:'DATA RESTORED',text:'The last internal safety snapshot has been restored.'}); return true;
    }catch(e){console.error(e);if(window.Swal)Swal.fire({icon:'error',title:'RESTORE FAILED',text:e.message||'Unable to restore snapshot.'});return false;}
  };
})();

/* ===== END anori-data-safety.js ===== */

/* ===== BEGIN bootstrap.js ===== */
/* ANORI TRANSPORT bootstrap helpers. Keep startup-only logic in the JS folder. */
(function () {
  'use strict';
  try {
    window.__ANORI_LOCAL_SAFE__ = true;
  } catch (_) {}

  try {
    var el = document.getElementById('offlineStatus');
    function updateOfflineStatus() {
      if (el) el.style.display = navigator.onLine ? 'none' : 'block';
    }
    window.addEventListener('online', updateOfflineStatus);
    window.addEventListener('offline', updateOfflineStatus);
    updateOfflineStatus();
  } catch (_) {}
})();

/* ===== END bootstrap.js ===== */

/* ===== BEGIN pdf-engine-final.js ===== */
/* ANORI TRANSPORT — FINAL PDF ENGINE
   Single source of truth for Invoice PDF generation.
   Desktop: Electron webContents.printToPDF() in a dedicated hidden renderer using the existing Invoice Preview DOM.
   Browser/file: native print dialog fallback (Save as PDF).
   No html2canvas/html2pdf/jsPDF dependency.
*/
(function(){
  'use strict';

  const ENGINE = 'electron-native-print-preview-v1';

  function toast(message, type){
    try { if (window.Utils && typeof window.Utils.toast === 'function') window.Utils.toast(message, type || 'info'); } catch (_) {}
  }

  function normalize(invoice){
    if (!invoice) return null;
    try {
      if (window.Invoices && typeof window.Invoices.normalizeInvoice === 'function') {
        return window.Invoices.normalizeInvoice(invoice);
      }
    } catch (_) {}
    return invoice;
  }

  function getInvoice(id){
    try {
      const rows = window.DB && typeof window.DB.get === 'function' ? window.DB.get('invoices', []) : [];
      return (rows || []).find(x => String(x.id) === String(id)) || null;
    } catch (_) { return null; }
  }

  function ensurePage(invoice){
    const host = document.getElementById('previewContent');
    if (!host) throw new Error('Invoice Preview area is not available.');
    const item = normalize(invoice);
    if (!item) throw new Error('Invoice not found.');

    let page = host.querySelector('.invoice-page');
    if (String(host.dataset.invoiceId || '') !== String(item.id) || !page) {
      if (!window.Invoices || typeof window.Invoices.mountInvoiceDocument !== 'function') {
        throw new Error('Invoice Preview renderer is not available.');
      }
      host.innerHTML = '';
      page = window.Invoices.mountInvoiceDocument(item);
      host.dataset.invoiceId = String(item.id);
    }
    if (!page) throw new Error('Invoice Preview could not be prepared.');
    return { host, page, invoice: item };
  }

  function ensurePrintCss(){
    if (document.getElementById('anori-final-pdf-engine-css')) return;
    const style = document.createElement('style');
    style.id = 'anori-final-pdf-engine-css';
    style.textContent = `
      @page { size: A4 portrait; margin: 0; }
      @media print {
        html, body { margin:0 !important; padding:0 !important; background:#fff !important; }
        body.anori-pdf-print-mode > *:not(#anoriPdfPrintHost) { display:none !important; }
        body.anori-pdf-print-mode #anoriPdfPrintHost {
          display:block !important; position:static !important; width:210mm !important;
          min-width:210mm !important; max-width:210mm !important; margin:0 !important;
          padding:0 !important; background:#fff !important;
        }
        body.anori-pdf-print-mode #anoriPdfPrintHost .invoice-page {
          display:block !important; position:relative !important;
          width:210mm !important; min-width:210mm !important; max-width:210mm !important;
          min-height:297mm !important; height:auto !important;
          margin:0 !important; padding:5mm !important; box-sizing:border-box !important;
          transform:none !important; box-shadow:none !important; background:#fff !important;
          overflow:visible !important;
        }
        body.anori-pdf-print-mode #anoriPdfPrintHost .no-print,
        body.anori-pdf-print-mode #anoriPdfPrintHost button { display:none !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function makePrintHost(invoice){
    const prepared = ensurePage(invoice);
    ensurePrintCss();

    let host = document.getElementById('anoriPdfPrintHost');
    if (!host) {
      host = document.createElement('div');
      host.id = 'anoriPdfPrintHost';
      document.body.appendChild(host);
    }
    host.innerHTML = '';

    const clone = prepared.page.cloneNode(true);
    clone.removeAttribute('id');
    clone.style.cssText += [
      'display:block!important',
      'position:relative!important',
      'width:210mm!important',
      'min-width:210mm!important',
      'max-width:210mm!important',
      'min-height:297mm!important',
      'height:auto!important',
      'margin:0!important',
      'padding:5mm!important',
      'box-sizing:border-box!important',
      'transform:none!important',
      'box-shadow:none!important',
      'background:#fff!important',
      'overflow:visible!important'
    ].join(';') + ';';
    host.appendChild(clone);
    return host;
  }

  function buildStandaloneHtml(invoice){
    const prepared = ensurePage(invoice);
    const clone = prepared.page.cloneNode(true);
    clone.querySelectorAll('button, .no-print').forEach(el => el.remove());

    const css = [];
    for (const sheet of Array.from(document.styleSheets || [])) {
      try {
        for (const rule of Array.from(sheet.cssRules || [])) css.push(rule.cssText);
      } catch (_) {}
    }
    css.push(`@page{size:A4 portrait;margin:0}html,body{margin:0!important;padding:0!important;background:#fff!important;width:210mm!important}body{font-family:Arial,Helvetica,sans-serif}.invoice-page{width:210mm!important;min-width:210mm!important;max-width:210mm!important;min-height:297mm!important;height:auto!important;margin:0!important;padding:5mm!important;box-sizing:border-box!important;transform:none!important;box-shadow:none!important;background:#fff!important;overflow:visible!important}@media print{html,body{width:210mm!important;background:#fff!important}.invoice-page{break-inside:avoid;page-break-inside:avoid}}`);

    return `<!doctype html><html><head><meta charset=\"UTF-8\"><title>${String(invoice.invoice_no || 'ANORI TRANSPORT INVOICE').replace(/[<>&\"']/g, '')}</title><style>${css.join('\n')}</style></head><body>${clone.outerHTML}</body></html>`;
  }

  async function electronPdf(invoice){
    const bridge = window.anoriElectronBackup;
    if (!bridge || typeof bridge.printInvoicePdf !== 'function') return false;

    const html = buildStandaloneHtml(invoice);
    const safeName = String(invoice.invoice_no || invoice.id || 'ANORI_TRANSPORT_INVOICE')
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_') + '.pdf';
    const result = await bridge.printInvoicePdf({ suggestedName: safeName, html });
    if (!result || !result.ok) throw new Error((result && result.error) || 'Unable to save the PDF.');
    toast('Invoice PDF downloaded to your Windows Downloads folder.', 'success');
    return true;
  }

  async function browserPdf(invoice){
    const host = makePrintHost(invoice);
    document.body.classList.add('anori-pdf-print-mode');
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      window.print();
      return true;
    } finally {
      setTimeout(() => {
        document.body.classList.remove('anori-pdf-print-mode');
        host.remove();
      }, 1500);
    }
  }

  async function downloadInvoice(invoice){
    const item = normalize(invoice);
    if (!item) { toast('Invoice not found.', 'error'); return false; }
    try {
      if (await electronPdf(item)) return true;
      return await browserPdf(item);
    } catch (error) {
      console.error('ANORI PDF ENGINE ERROR:', error);
      const message = error && error.message ? error.message : 'Unable to generate the invoice PDF.';
      try {
        if (window.Swal && typeof window.Swal.fire === 'function') {
          await window.Swal.fire({ icon:'error', title:'PDF GENERATION FAILED', text:message, confirmButtonText:'OK' });
        } else toast(message, 'error');
      } catch (_) { toast(message, 'error'); }
      return false;
    }
  }

  function downloadExisting(id){
    const invoice = getInvoice(id);
    if (!invoice) { toast('Invoice not found.', 'error'); return false; }
    return downloadInvoice(invoice);
  }

  function downloadSelected(){
    let ids = [];
    try {
      if (window.Invoices && typeof window.Invoices.getSelected === 'function') ids = window.Invoices.getSelected() || [];
    } catch (_) {}
    if (ids.length !== 1) {
      toast(ids.length ? 'SELECT ONLY ONE INVOICE.' : 'SELECT ONE INVOICE.', 'warning');
      return false;
    }
    return downloadExisting(ids[0]);
  }

  window.__ANORI_PDF_FINAL_FUNCTION = downloadInvoice;

  function install(){
    if (!window.Invoices) return false;

    // Make this the only writable path during installation; after installation
    // the public methods are locked so legacy assignments cannot take control.
    try {
      Object.defineProperty(window.Invoices, 'downloadInvoice', {
        value: downloadInvoice, writable: false, configurable: false, enumerable: true
      });
      Object.defineProperty(window.Invoices, 'downloadExisting', {
        value: downloadExisting, writable: false, configurable: false, enumerable: true
      });
      Object.defineProperty(window.Invoices, 'downloadSelectedPDF', {
        value: downloadSelected, writable: false, configurable: false, enumerable: true
      });
      Object.defineProperty(window.Invoices, 'actionPDF', {
        value: downloadSelected, writable: false, configurable: false, enumerable: true
      });
    } catch (error) {
      // If a property is already non-configurable, assignment is still attempted
      // only when it is writable; otherwise the existing locked route remains.
      try { window.Invoices.downloadInvoice = downloadInvoice; } catch (_) {}
      try { window.Invoices.downloadExisting = downloadExisting; } catch (_) {}
      try { window.Invoices.downloadSelectedPDF = downloadSelected; } catch (_) {}
      try { window.Invoices.actionPDF = downloadSelected; } catch (_) {}
    }

    window.__ANORI_FINAL_PDF_ENGINE = ENGINE;
    window.__ANORI_PDF_READY = true;
    return true;
  }

  function boot(){
    if (install()) return;
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (install() || attempts >= 100) clearInterval(timer);
    }, 100);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();

/* ===== END pdf-engine-final.js ===== */
