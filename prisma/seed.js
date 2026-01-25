"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// prisma/seed.ts
var import_node_crypto = require("node:crypto");
var import_client = require("@prisma/client");
var import_library = require("@prisma/client/runtime/library");

// node_modules/bcryptjs/index.js
var import_crypto = __toESM(require("crypto"), 1);
var randomFallback = null;
function randomBytes(len) {
  try {
    return crypto.getRandomValues(new Uint8Array(len));
  } catch {
  }
  try {
    return import_crypto.default.randomBytes(len);
  } catch {
  }
  if (!randomFallback) {
    throw Error(
      "Neither WebCryptoAPI nor a crypto module is available. Use bcrypt.setRandomFallback to set an alternative"
    );
  }
  return randomFallback(len);
}
function setRandomFallback(random) {
  randomFallback = random;
}
function genSaltSync(rounds, seed_length) {
  rounds = rounds || GENSALT_DEFAULT_LOG2_ROUNDS;
  if (typeof rounds !== "number")
    throw Error(
      "Illegal arguments: " + typeof rounds + ", " + typeof seed_length
    );
  if (rounds < 4) rounds = 4;
  else if (rounds > 31) rounds = 31;
  var salt = [];
  salt.push("$2b$");
  if (rounds < 10) salt.push("0");
  salt.push(rounds.toString());
  salt.push("$");
  salt.push(base64_encode(randomBytes(BCRYPT_SALT_LEN), BCRYPT_SALT_LEN));
  return salt.join("");
}
function genSalt(rounds, seed_length, callback) {
  if (typeof seed_length === "function")
    callback = seed_length, seed_length = void 0;
  if (typeof rounds === "function") callback = rounds, rounds = void 0;
  if (typeof rounds === "undefined") rounds = GENSALT_DEFAULT_LOG2_ROUNDS;
  else if (typeof rounds !== "number")
    throw Error("illegal arguments: " + typeof rounds);
  function _async(callback2) {
    nextTick(function() {
      try {
        callback2(null, genSaltSync(rounds));
      } catch (err) {
        callback2(err);
      }
    });
  }
  if (callback) {
    if (typeof callback !== "function")
      throw Error("Illegal callback: " + typeof callback);
    _async(callback);
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
}
function hashSync(password, salt) {
  if (typeof salt === "undefined") salt = GENSALT_DEFAULT_LOG2_ROUNDS;
  if (typeof salt === "number") salt = genSaltSync(salt);
  if (typeof password !== "string" || typeof salt !== "string")
    throw Error("Illegal arguments: " + typeof password + ", " + typeof salt);
  return _hash(password, salt);
}
function hash(password, salt, callback, progressCallback) {
  function _async(callback2) {
    if (typeof password === "string" && typeof salt === "number")
      genSalt(salt, function(err, salt2) {
        _hash(password, salt2, callback2, progressCallback);
      });
    else if (typeof password === "string" && typeof salt === "string")
      _hash(password, salt, callback2, progressCallback);
    else
      nextTick(
        callback2.bind(
          this,
          Error("Illegal arguments: " + typeof password + ", " + typeof salt)
        )
      );
  }
  if (callback) {
    if (typeof callback !== "function")
      throw Error("Illegal callback: " + typeof callback);
    _async(callback);
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
}
function safeStringCompare(known, unknown) {
  var diff = known.length ^ unknown.length;
  for (var i = 0; i < known.length; ++i) {
    diff |= known.charCodeAt(i) ^ unknown.charCodeAt(i);
  }
  return diff === 0;
}
function compareSync(password, hash2) {
  if (typeof password !== "string" || typeof hash2 !== "string")
    throw Error("Illegal arguments: " + typeof password + ", " + typeof hash2);
  if (hash2.length !== 60) return false;
  return safeStringCompare(
    hashSync(password, hash2.substring(0, hash2.length - 31)),
    hash2
  );
}
function compare(password, hashValue, callback, progressCallback) {
  function _async(callback2) {
    if (typeof password !== "string" || typeof hashValue !== "string") {
      nextTick(
        callback2.bind(
          this,
          Error(
            "Illegal arguments: " + typeof password + ", " + typeof hashValue
          )
        )
      );
      return;
    }
    if (hashValue.length !== 60) {
      nextTick(callback2.bind(this, null, false));
      return;
    }
    hash(
      password,
      hashValue.substring(0, 29),
      function(err, comp) {
        if (err) callback2(err);
        else callback2(null, safeStringCompare(comp, hashValue));
      },
      progressCallback
    );
  }
  if (callback) {
    if (typeof callback !== "function")
      throw Error("Illegal callback: " + typeof callback);
    _async(callback);
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
}
function getRounds(hash2) {
  if (typeof hash2 !== "string")
    throw Error("Illegal arguments: " + typeof hash2);
  return parseInt(hash2.split("$")[2], 10);
}
function getSalt(hash2) {
  if (typeof hash2 !== "string")
    throw Error("Illegal arguments: " + typeof hash2);
  if (hash2.length !== 60)
    throw Error("Illegal hash length: " + hash2.length + " != 60");
  return hash2.substring(0, 29);
}
function truncates(password) {
  if (typeof password !== "string")
    throw Error("Illegal arguments: " + typeof password);
  return utf8Length(password) > 72;
}
var nextTick = typeof setImmediate === "function" ? setImmediate : typeof scheduler === "object" && typeof scheduler.postTask === "function" ? scheduler.postTask.bind(scheduler) : setTimeout;
function utf8Length(string) {
  var len = 0, c = 0;
  for (var i = 0; i < string.length; ++i) {
    c = string.charCodeAt(i);
    if (c < 128) len += 1;
    else if (c < 2048) len += 2;
    else if ((c & 64512) === 55296 && (string.charCodeAt(i + 1) & 64512) === 56320) {
      ++i;
      len += 4;
    } else len += 3;
  }
  return len;
}
function utf8Array(string) {
  var offset = 0, c1, c2;
  var buffer = new Array(utf8Length(string));
  for (var i = 0, k = string.length; i < k; ++i) {
    c1 = string.charCodeAt(i);
    if (c1 < 128) {
      buffer[offset++] = c1;
    } else if (c1 < 2048) {
      buffer[offset++] = c1 >> 6 | 192;
      buffer[offset++] = c1 & 63 | 128;
    } else if ((c1 & 64512) === 55296 && ((c2 = string.charCodeAt(i + 1)) & 64512) === 56320) {
      c1 = 65536 + ((c1 & 1023) << 10) + (c2 & 1023);
      ++i;
      buffer[offset++] = c1 >> 18 | 240;
      buffer[offset++] = c1 >> 12 & 63 | 128;
      buffer[offset++] = c1 >> 6 & 63 | 128;
      buffer[offset++] = c1 & 63 | 128;
    } else {
      buffer[offset++] = c1 >> 12 | 224;
      buffer[offset++] = c1 >> 6 & 63 | 128;
      buffer[offset++] = c1 & 63 | 128;
    }
  }
  return buffer;
}
var BASE64_CODE = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
var BASE64_INDEX = [
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  1,
  54,
  55,
  56,
  57,
  58,
  59,
  60,
  61,
  62,
  63,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
  23,
  24,
  25,
  26,
  27,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  28,
  29,
  30,
  31,
  32,
  33,
  34,
  35,
  36,
  37,
  38,
  39,
  40,
  41,
  42,
  43,
  44,
  45,
  46,
  47,
  48,
  49,
  50,
  51,
  52,
  53,
  -1,
  -1,
  -1,
  -1,
  -1
];
function base64_encode(b, len) {
  var off = 0, rs = [], c1, c2;
  if (len <= 0 || len > b.length) throw Error("Illegal len: " + len);
  while (off < len) {
    c1 = b[off++] & 255;
    rs.push(BASE64_CODE[c1 >> 2 & 63]);
    c1 = (c1 & 3) << 4;
    if (off >= len) {
      rs.push(BASE64_CODE[c1 & 63]);
      break;
    }
    c2 = b[off++] & 255;
    c1 |= c2 >> 4 & 15;
    rs.push(BASE64_CODE[c1 & 63]);
    c1 = (c2 & 15) << 2;
    if (off >= len) {
      rs.push(BASE64_CODE[c1 & 63]);
      break;
    }
    c2 = b[off++] & 255;
    c1 |= c2 >> 6 & 3;
    rs.push(BASE64_CODE[c1 & 63]);
    rs.push(BASE64_CODE[c2 & 63]);
  }
  return rs.join("");
}
function base64_decode(s, len) {
  var off = 0, slen = s.length, olen = 0, rs = [], c1, c2, c3, c4, o, code;
  if (len <= 0) throw Error("Illegal len: " + len);
  while (off < slen - 1 && olen < len) {
    code = s.charCodeAt(off++);
    c1 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    code = s.charCodeAt(off++);
    c2 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    if (c1 == -1 || c2 == -1) break;
    o = c1 << 2 >>> 0;
    o |= (c2 & 48) >> 4;
    rs.push(String.fromCharCode(o));
    if (++olen >= len || off >= slen) break;
    code = s.charCodeAt(off++);
    c3 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    if (c3 == -1) break;
    o = (c2 & 15) << 4 >>> 0;
    o |= (c3 & 60) >> 2;
    rs.push(String.fromCharCode(o));
    if (++olen >= len || off >= slen) break;
    code = s.charCodeAt(off++);
    c4 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    o = (c3 & 3) << 6 >>> 0;
    o |= c4;
    rs.push(String.fromCharCode(o));
    ++olen;
  }
  var res = [];
  for (off = 0; off < olen; off++) res.push(rs[off].charCodeAt(0));
  return res;
}
var BCRYPT_SALT_LEN = 16;
var GENSALT_DEFAULT_LOG2_ROUNDS = 10;
var BLOWFISH_NUM_ROUNDS = 16;
var MAX_EXECUTION_TIME = 100;
var P_ORIG = [
  608135816,
  2242054355,
  320440878,
  57701188,
  2752067618,
  698298832,
  137296536,
  3964562569,
  1160258022,
  953160567,
  3193202383,
  887688300,
  3232508343,
  3380367581,
  1065670069,
  3041331479,
  2450970073,
  2306472731
];
var S_ORIG = [
  3509652390,
  2564797868,
  805139163,
  3491422135,
  3101798381,
  1780907670,
  3128725573,
  4046225305,
  614570311,
  3012652279,
  134345442,
  2240740374,
  1667834072,
  1901547113,
  2757295779,
  4103290238,
  227898511,
  1921955416,
  1904987480,
  2182433518,
  2069144605,
  3260701109,
  2620446009,
  720527379,
  3318853667,
  677414384,
  3393288472,
  3101374703,
  2390351024,
  1614419982,
  1822297739,
  2954791486,
  3608508353,
  3174124327,
  2024746970,
  1432378464,
  3864339955,
  2857741204,
  1464375394,
  1676153920,
  1439316330,
  715854006,
  3033291828,
  289532110,
  2706671279,
  2087905683,
  3018724369,
  1668267050,
  732546397,
  1947742710,
  3462151702,
  2609353502,
  2950085171,
  1814351708,
  2050118529,
  680887927,
  999245976,
  1800124847,
  3300911131,
  1713906067,
  1641548236,
  4213287313,
  1216130144,
  1575780402,
  4018429277,
  3917837745,
  3693486850,
  3949271944,
  596196993,
  3549867205,
  258830323,
  2213823033,
  772490370,
  2760122372,
  1774776394,
  2652871518,
  566650946,
  4142492826,
  1728879713,
  2882767088,
  1783734482,
  3629395816,
  2517608232,
  2874225571,
  1861159788,
  326777828,
  3124490320,
  2130389656,
  2716951837,
  967770486,
  1724537150,
  2185432712,
  2364442137,
  1164943284,
  2105845187,
  998989502,
  3765401048,
  2244026483,
  1075463327,
  1455516326,
  1322494562,
  910128902,
  469688178,
  1117454909,
  936433444,
  3490320968,
  3675253459,
  1240580251,
  122909385,
  2157517691,
  634681816,
  4142456567,
  3825094682,
  3061402683,
  2540495037,
  79693498,
  3249098678,
  1084186820,
  1583128258,
  426386531,
  1761308591,
  1047286709,
  322548459,
  995290223,
  1845252383,
  2603652396,
  3431023940,
  2942221577,
  3202600964,
  3727903485,
  1712269319,
  422464435,
  3234572375,
  1170764815,
  3523960633,
  3117677531,
  1434042557,
  442511882,
  3600875718,
  1076654713,
  1738483198,
  4213154764,
  2393238008,
  3677496056,
  1014306527,
  4251020053,
  793779912,
  2902807211,
  842905082,
  4246964064,
  1395751752,
  1040244610,
  2656851899,
  3396308128,
  445077038,
  3742853595,
  3577915638,
  679411651,
  2892444358,
  2354009459,
  1767581616,
  3150600392,
  3791627101,
  3102740896,
  284835224,
  4246832056,
  1258075500,
  768725851,
  2589189241,
  3069724005,
  3532540348,
  1274779536,
  3789419226,
  2764799539,
  1660621633,
  3471099624,
  4011903706,
  913787905,
  3497959166,
  737222580,
  2514213453,
  2928710040,
  3937242737,
  1804850592,
  3499020752,
  2949064160,
  2386320175,
  2390070455,
  2415321851,
  4061277028,
  2290661394,
  2416832540,
  1336762016,
  1754252060,
  3520065937,
  3014181293,
  791618072,
  3188594551,
  3933548030,
  2332172193,
  3852520463,
  3043980520,
  413987798,
  3465142937,
  3030929376,
  4245938359,
  2093235073,
  3534596313,
  375366246,
  2157278981,
  2479649556,
  555357303,
  3870105701,
  2008414854,
  3344188149,
  4221384143,
  3956125452,
  2067696032,
  3594591187,
  2921233993,
  2428461,
  544322398,
  577241275,
  1471733935,
  610547355,
  4027169054,
  1432588573,
  1507829418,
  2025931657,
  3646575487,
  545086370,
  48609733,
  2200306550,
  1653985193,
  298326376,
  1316178497,
  3007786442,
  2064951626,
  458293330,
  2589141269,
  3591329599,
  3164325604,
  727753846,
  2179363840,
  146436021,
  1461446943,
  4069977195,
  705550613,
  3059967265,
  3887724982,
  4281599278,
  3313849956,
  1404054877,
  2845806497,
  146425753,
  1854211946,
  1266315497,
  3048417604,
  3681880366,
  3289982499,
  290971e4,
  1235738493,
  2632868024,
  2414719590,
  3970600049,
  1771706367,
  1449415276,
  3266420449,
  422970021,
  1963543593,
  2690192192,
  3826793022,
  1062508698,
  1531092325,
  1804592342,
  2583117782,
  2714934279,
  4024971509,
  1294809318,
  4028980673,
  1289560198,
  2221992742,
  1669523910,
  35572830,
  157838143,
  1052438473,
  1016535060,
  1802137761,
  1753167236,
  1386275462,
  3080475397,
  2857371447,
  1040679964,
  2145300060,
  2390574316,
  1461121720,
  2956646967,
  4031777805,
  4028374788,
  33600511,
  2920084762,
  1018524850,
  629373528,
  3691585981,
  3515945977,
  2091462646,
  2486323059,
  586499841,
  988145025,
  935516892,
  3367335476,
  2599673255,
  2839830854,
  265290510,
  3972581182,
  2759138881,
  3795373465,
  1005194799,
  847297441,
  406762289,
  1314163512,
  1332590856,
  1866599683,
  4127851711,
  750260880,
  613907577,
  1450815602,
  3165620655,
  3734664991,
  3650291728,
  3012275730,
  3704569646,
  1427272223,
  778793252,
  1343938022,
  2676280711,
  2052605720,
  1946737175,
  3164576444,
  3914038668,
  3967478842,
  3682934266,
  1661551462,
  3294938066,
  4011595847,
  840292616,
  3712170807,
  616741398,
  312560963,
  711312465,
  1351876610,
  322626781,
  1910503582,
  271666773,
  2175563734,
  1594956187,
  70604529,
  3617834859,
  1007753275,
  1495573769,
  4069517037,
  2549218298,
  2663038764,
  504708206,
  2263041392,
  3941167025,
  2249088522,
  1514023603,
  1998579484,
  1312622330,
  694541497,
  2582060303,
  2151582166,
  1382467621,
  776784248,
  2618340202,
  3323268794,
  2497899128,
  2784771155,
  503983604,
  4076293799,
  907881277,
  423175695,
  432175456,
  1378068232,
  4145222326,
  3954048622,
  3938656102,
  3820766613,
  2793130115,
  2977904593,
  26017576,
  3274890735,
  3194772133,
  1700274565,
  1756076034,
  4006520079,
  3677328699,
  720338349,
  1533947780,
  354530856,
  688349552,
  3973924725,
  1637815568,
  332179504,
  3949051286,
  53804574,
  2852348879,
  3044236432,
  1282449977,
  3583942155,
  3416972820,
  4006381244,
  1617046695,
  2628476075,
  3002303598,
  1686838959,
  431878346,
  2686675385,
  1700445008,
  1080580658,
  1009431731,
  832498133,
  3223435511,
  2605976345,
  2271191193,
  2516031870,
  1648197032,
  4164389018,
  2548247927,
  300782431,
  375919233,
  238389289,
  3353747414,
  2531188641,
  2019080857,
  1475708069,
  455242339,
  2609103871,
  448939670,
  3451063019,
  1395535956,
  2413381860,
  1841049896,
  1491858159,
  885456874,
  4264095073,
  4001119347,
  1565136089,
  3898914787,
  1108368660,
  540939232,
  1173283510,
  2745871338,
  3681308437,
  4207628240,
  3343053890,
  4016749493,
  1699691293,
  1103962373,
  3625875870,
  2256883143,
  3830138730,
  1031889488,
  3479347698,
  1535977030,
  4236805024,
  3251091107,
  2132092099,
  1774941330,
  1199868427,
  1452454533,
  157007616,
  2904115357,
  342012276,
  595725824,
  1480756522,
  206960106,
  497939518,
  591360097,
  863170706,
  2375253569,
  3596610801,
  1814182875,
  2094937945,
  3421402208,
  1082520231,
  3463918190,
  2785509508,
  435703966,
  3908032597,
  1641649973,
  2842273706,
  3305899714,
  1510255612,
  2148256476,
  2655287854,
  3276092548,
  4258621189,
  236887753,
  3681803219,
  274041037,
  1734335097,
  3815195456,
  3317970021,
  1899903192,
  1026095262,
  4050517792,
  356393447,
  2410691914,
  3873677099,
  3682840055,
  3913112168,
  2491498743,
  4132185628,
  2489919796,
  1091903735,
  1979897079,
  3170134830,
  3567386728,
  3557303409,
  857797738,
  1136121015,
  1342202287,
  507115054,
  2535736646,
  337727348,
  3213592640,
  1301675037,
  2528481711,
  1895095763,
  1721773893,
  3216771564,
  62756741,
  2142006736,
  835421444,
  2531993523,
  1442658625,
  3659876326,
  2882144922,
  676362277,
  1392781812,
  170690266,
  3921047035,
  1759253602,
  3611846912,
  1745797284,
  664899054,
  1329594018,
  3901205900,
  3045908486,
  2062866102,
  2865634940,
  3543621612,
  3464012697,
  1080764994,
  553557557,
  3656615353,
  3996768171,
  991055499,
  499776247,
  1265440854,
  648242737,
  3940784050,
  980351604,
  3713745714,
  1749149687,
  3396870395,
  4211799374,
  3640570775,
  1161844396,
  3125318951,
  1431517754,
  545492359,
  4268468663,
  3499529547,
  1437099964,
  2702547544,
  3433638243,
  2581715763,
  2787789398,
  1060185593,
  1593081372,
  2418618748,
  4260947970,
  69676912,
  2159744348,
  86519011,
  2512459080,
  3838209314,
  1220612927,
  3339683548,
  133810670,
  1090789135,
  1078426020,
  1569222167,
  845107691,
  3583754449,
  4072456591,
  1091646820,
  628848692,
  1613405280,
  3757631651,
  526609435,
  236106946,
  48312990,
  2942717905,
  3402727701,
  1797494240,
  859738849,
  992217954,
  4005476642,
  2243076622,
  3870952857,
  3732016268,
  765654824,
  3490871365,
  2511836413,
  1685915746,
  3888969200,
  1414112111,
  2273134842,
  3281911079,
  4080962846,
  172450625,
  2569994100,
  980381355,
  4109958455,
  2819808352,
  2716589560,
  2568741196,
  3681446669,
  3329971472,
  1835478071,
  660984891,
  3704678404,
  4045999559,
  3422617507,
  3040415634,
  1762651403,
  1719377915,
  3470491036,
  2693910283,
  3642056355,
  3138596744,
  1364962596,
  2073328063,
  1983633131,
  926494387,
  3423689081,
  2150032023,
  4096667949,
  1749200295,
  3328846651,
  309677260,
  2016342300,
  1779581495,
  3079819751,
  111262694,
  1274766160,
  443224088,
  298511866,
  1025883608,
  3806446537,
  1145181785,
  168956806,
  3641502830,
  3584813610,
  1689216846,
  3666258015,
  3200248200,
  1692713982,
  2646376535,
  4042768518,
  1618508792,
  1610833997,
  3523052358,
  4130873264,
  2001055236,
  3610705100,
  2202168115,
  4028541809,
  2961195399,
  1006657119,
  2006996926,
  3186142756,
  1430667929,
  3210227297,
  1314452623,
  4074634658,
  4101304120,
  2273951170,
  1399257539,
  3367210612,
  3027628629,
  1190975929,
  2062231137,
  2333990788,
  2221543033,
  2438960610,
  1181637006,
  548689776,
  2362791313,
  3372408396,
  3104550113,
  3145860560,
  296247880,
  1970579870,
  3078560182,
  3769228297,
  1714227617,
  3291629107,
  3898220290,
  166772364,
  1251581989,
  493813264,
  448347421,
  195405023,
  2709975567,
  677966185,
  3703036547,
  1463355134,
  2715995803,
  1338867538,
  1343315457,
  2802222074,
  2684532164,
  233230375,
  2599980071,
  2000651841,
  3277868038,
  1638401717,
  4028070440,
  3237316320,
  6314154,
  819756386,
  300326615,
  590932579,
  1405279636,
  3267499572,
  3150704214,
  2428286686,
  3959192993,
  3461946742,
  1862657033,
  1266418056,
  963775037,
  2089974820,
  2263052895,
  1917689273,
  448879540,
  3550394620,
  3981727096,
  150775221,
  3627908307,
  1303187396,
  508620638,
  2975983352,
  2726630617,
  1817252668,
  1876281319,
  1457606340,
  908771278,
  3720792119,
  3617206836,
  2455994898,
  1729034894,
  1080033504,
  976866871,
  3556439503,
  2881648439,
  1522871579,
  1555064734,
  1336096578,
  3548522304,
  2579274686,
  3574697629,
  3205460757,
  3593280638,
  3338716283,
  3079412587,
  564236357,
  2993598910,
  1781952180,
  1464380207,
  3163844217,
  3332601554,
  1699332808,
  1393555694,
  1183702653,
  3581086237,
  1288719814,
  691649499,
  2847557200,
  2895455976,
  3193889540,
  2717570544,
  1781354906,
  1676643554,
  2592534050,
  3230253752,
  1126444790,
  2770207658,
  2633158820,
  2210423226,
  2615765581,
  2414155088,
  3127139286,
  673620729,
  2805611233,
  1269405062,
  4015350505,
  3341807571,
  4149409754,
  1057255273,
  2012875353,
  2162469141,
  2276492801,
  2601117357,
  993977747,
  3918593370,
  2654263191,
  753973209,
  36408145,
  2530585658,
  25011837,
  3520020182,
  2088578344,
  530523599,
  2918365339,
  1524020338,
  1518925132,
  3760827505,
  3759777254,
  1202760957,
  3985898139,
  3906192525,
  674977740,
  4174734889,
  2031300136,
  2019492241,
  3983892565,
  4153806404,
  3822280332,
  352677332,
  2297720250,
  60907813,
  90501309,
  3286998549,
  1016092578,
  2535922412,
  2839152426,
  457141659,
  509813237,
  4120667899,
  652014361,
  1966332200,
  2975202805,
  55981186,
  2327461051,
  676427537,
  3255491064,
  2882294119,
  3433927263,
  1307055953,
  942726286,
  933058658,
  2468411793,
  3933900994,
  4215176142,
  1361170020,
  2001714738,
  2830558078,
  3274259782,
  1222529897,
  1679025792,
  2729314320,
  3714953764,
  1770335741,
  151462246,
  3013232138,
  1682292957,
  1483529935,
  471910574,
  1539241949,
  458788160,
  3436315007,
  1807016891,
  3718408830,
  978976581,
  1043663428,
  3165965781,
  1927990952,
  4200891579,
  2372276910,
  3208408903,
  3533431907,
  1412390302,
  2931980059,
  4132332400,
  1947078029,
  3881505623,
  4168226417,
  2941484381,
  1077988104,
  1320477388,
  886195818,
  18198404,
  3786409e3,
  2509781533,
  112762804,
  3463356488,
  1866414978,
  891333506,
  18488651,
  661792760,
  1628790961,
  3885187036,
  3141171499,
  876946877,
  2693282273,
  1372485963,
  791857591,
  2686433993,
  3759982718,
  3167212022,
  3472953795,
  2716379847,
  445679433,
  3561995674,
  3504004811,
  3574258232,
  54117162,
  3331405415,
  2381918588,
  3769707343,
  4154350007,
  1140177722,
  4074052095,
  668550556,
  3214352940,
  367459370,
  261225585,
  2610173221,
  4209349473,
  3468074219,
  3265815641,
  314222801,
  3066103646,
  3808782860,
  282218597,
  3406013506,
  3773591054,
  379116347,
  1285071038,
  846784868,
  2669647154,
  3771962079,
  3550491691,
  2305946142,
  453669953,
  1268987020,
  3317592352,
  3279303384,
  3744833421,
  2610507566,
  3859509063,
  266596637,
  3847019092,
  517658769,
  3462560207,
  3443424879,
  370717030,
  4247526661,
  2224018117,
  4143653529,
  4112773975,
  2788324899,
  2477274417,
  1456262402,
  2901442914,
  1517677493,
  1846949527,
  2295493580,
  3734397586,
  2176403920,
  1280348187,
  1908823572,
  3871786941,
  846861322,
  1172426758,
  3287448474,
  3383383037,
  1655181056,
  3139813346,
  901632758,
  1897031941,
  2986607138,
  3066810236,
  3447102507,
  1393639104,
  373351379,
  950779232,
  625454576,
  3124240540,
  4148612726,
  2007998917,
  544563296,
  2244738638,
  2330496472,
  2058025392,
  1291430526,
  424198748,
  50039436,
  29584100,
  3605783033,
  2429876329,
  2791104160,
  1057563949,
  3255363231,
  3075367218,
  3463963227,
  1469046755,
  985887462
];
var C_ORIG = [
  1332899944,
  1700884034,
  1701343084,
  1684370003,
  1668446532,
  1869963892
];
function _encipher(lr, off, P, S) {
  var n, l = lr[off], r = lr[off + 1];
  l ^= P[0];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[1];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[2];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[3];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[4];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[5];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[6];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[7];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[8];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[9];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[10];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[11];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[12];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[13];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[14];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[15];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[16];
  lr[off] = r ^ P[BLOWFISH_NUM_ROUNDS + 1];
  lr[off + 1] = l;
  return lr;
}
function _streamtoword(data, offp) {
  for (var i = 0, word = 0; i < 4; ++i)
    word = word << 8 | data[offp] & 255, offp = (offp + 1) % data.length;
  return { key: word, offp };
}
function _key(key, P, S) {
  var offset = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
  for (var i = 0; i < plen; i++)
    sw = _streamtoword(key, offset), offset = sw.offp, P[i] = P[i] ^ sw.key;
  for (i = 0; i < plen; i += 2)
    lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
  for (i = 0; i < slen; i += 2)
    lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
}
function _ekskey(data, key, P, S) {
  var offp = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
  for (var i = 0; i < plen; i++)
    sw = _streamtoword(key, offp), offp = sw.offp, P[i] = P[i] ^ sw.key;
  offp = 0;
  for (i = 0; i < plen; i += 2)
    sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
  for (i = 0; i < slen; i += 2)
    sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
}
function _crypt(b, salt, rounds, callback, progressCallback) {
  var cdata = C_ORIG.slice(), clen = cdata.length, err;
  if (rounds < 4 || rounds > 31) {
    err = Error("Illegal number of rounds (4-31): " + rounds);
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  if (salt.length !== BCRYPT_SALT_LEN) {
    err = Error(
      "Illegal salt length: " + salt.length + " != " + BCRYPT_SALT_LEN
    );
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  rounds = 1 << rounds >>> 0;
  var P, S, i = 0, j;
  if (typeof Int32Array === "function") {
    P = new Int32Array(P_ORIG);
    S = new Int32Array(S_ORIG);
  } else {
    P = P_ORIG.slice();
    S = S_ORIG.slice();
  }
  _ekskey(salt, b, P, S);
  function next() {
    if (progressCallback) progressCallback(i / rounds);
    if (i < rounds) {
      var start = Date.now();
      for (; i < rounds; ) {
        i = i + 1;
        _key(b, P, S);
        _key(salt, P, S);
        if (Date.now() - start > MAX_EXECUTION_TIME) break;
      }
    } else {
      for (i = 0; i < 64; i++)
        for (j = 0; j < clen >> 1; j++) _encipher(cdata, j << 1, P, S);
      var ret = [];
      for (i = 0; i < clen; i++)
        ret.push((cdata[i] >> 24 & 255) >>> 0), ret.push((cdata[i] >> 16 & 255) >>> 0), ret.push((cdata[i] >> 8 & 255) >>> 0), ret.push((cdata[i] & 255) >>> 0);
      if (callback) {
        callback(null, ret);
        return;
      } else return ret;
    }
    if (callback) nextTick(next);
  }
  if (typeof callback !== "undefined") {
    next();
  } else {
    var res;
    while (true) if (typeof (res = next()) !== "undefined") return res || [];
  }
}
function _hash(password, salt, callback, progressCallback) {
  var err;
  if (typeof password !== "string" || typeof salt !== "string") {
    err = Error("Invalid string / salt: Not a string");
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  var minor, offset;
  if (salt.charAt(0) !== "$" || salt.charAt(1) !== "2") {
    err = Error("Invalid salt version: " + salt.substring(0, 2));
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  if (salt.charAt(2) === "$") minor = String.fromCharCode(0), offset = 3;
  else {
    minor = salt.charAt(2);
    if (minor !== "a" && minor !== "b" && minor !== "y" || salt.charAt(3) !== "$") {
      err = Error("Invalid salt revision: " + salt.substring(2, 4));
      if (callback) {
        nextTick(callback.bind(this, err));
        return;
      } else throw err;
    }
    offset = 4;
  }
  if (salt.charAt(offset + 2) > "$") {
    err = Error("Missing salt rounds");
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  var r1 = parseInt(salt.substring(offset, offset + 1), 10) * 10, r2 = parseInt(salt.substring(offset + 1, offset + 2), 10), rounds = r1 + r2, real_salt = salt.substring(offset + 3, offset + 25);
  password += minor >= "a" ? "\0" : "";
  var passwordb = utf8Array(password), saltb = base64_decode(real_salt, BCRYPT_SALT_LEN);
  function finish(bytes) {
    var res = [];
    res.push("$2");
    if (minor >= "a") res.push(minor);
    res.push("$");
    if (rounds < 10) res.push("0");
    res.push(rounds.toString());
    res.push("$");
    res.push(base64_encode(saltb, saltb.length));
    res.push(base64_encode(bytes, C_ORIG.length * 4 - 1));
    return res.join("");
  }
  if (typeof callback == "undefined")
    return finish(_crypt(passwordb, saltb, rounds));
  else {
    _crypt(
      passwordb,
      saltb,
      rounds,
      function(err2, bytes) {
        if (err2) callback(err2, null);
        else callback(null, finish(bytes));
      },
      progressCallback
    );
  }
}
function encodeBase64(bytes, length) {
  return base64_encode(bytes, length);
}
function decodeBase64(string, length) {
  return base64_decode(string, length);
}
var bcryptjs_default = {
  setRandomFallback,
  genSaltSync,
  genSalt,
  hashSync,
  hash,
  compareSync,
  compare,
  getRounds,
  getSalt,
  truncates,
  encodeBase64,
  decodeBase64
};

// lib/utils.ts
var slugifyValue = (value) => value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/[\s-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

// prisma/seed.ts
var prisma = new import_client.PrismaClient();
async function ignoreDuplicate(promise) {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof import_library.PrismaClientKnownRequestError && error.code === "P2002") {
      return null;
    }
    throw error;
  }
}
async function retry(fn, attempts = 3, delayMs = 500) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}
async function pauseEvery(count, every, ms = 250) {
  if (count > 0 && count % every === 0) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
var transportMeanCategoriesSeedData = [
  {
    name: "AGV-AMR",
    description: "Autonomous mobile robots and guided vehicles for intralogistics.",
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee"
  },
  {
    name: "Forklift",
    description: "Counterbalance and reach trucks for versatile handling.",
    imageUrl: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef"
  },
  {
    name: "Tugger Train",
    description: "Tugger tractors with tow carts for milk runs.",
    imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e"
  }
];
var transportMeansSeedData = [
  // Detroit Assembly (7)
  { name: "AGV Shuttle D1", categoryName: "AGV-AMR", supplierName: "Midwest Machining", plantName: "Detroit Assembly", loadCapacityKg: 800, units: 4, cruiseSpeedKmh: 6, maxSpeedKmh: 10, sop: /* @__PURE__ */ new Date("2026-01-10"), eop: /* @__PURE__ */ new Date("2031-01-01"), packagingMeanNames: ["Utility Cart 01", "Picking Cart 01"] },
  { name: "AGV Shuttle D2", categoryName: "AGV-AMR", supplierName: "North Steel", plantName: "Detroit Assembly", loadCapacityKg: 750, units: 3, cruiseSpeedKmh: 7, maxSpeedKmh: 11, sop: /* @__PURE__ */ new Date("2026-03-01"), eop: /* @__PURE__ */ new Date("2031-03-01"), packagingMeanNames: ["Kitting Cart 02"] },
  { name: "Forklift D1", categoryName: "Forklift", supplierName: "Midwest Machining", plantName: "Detroit Assembly", loadCapacityKg: 2e3, units: 5, cruiseSpeedKmh: 12, maxSpeedKmh: 18, sop: /* @__PURE__ */ new Date("2026-05-01"), eop: /* @__PURE__ */ new Date("2032-05-01"), packagingMeanNames: ["High Density Tower 01"] },
  { name: "Forklift D2", categoryName: "Forklift", supplierName: "North Steel", plantName: "Detroit Assembly", loadCapacityKg: 2200, units: 4, cruiseSpeedKmh: 13, maxSpeedKmh: 20, sop: /* @__PURE__ */ new Date("2026-06-01"), eop: /* @__PURE__ */ new Date("2032-06-01"), packagingMeanNames: ["Plastic Box 03"] },
  { name: "Tugger Loop D1", categoryName: "Tugger Train", supplierName: "Midwest Machining", plantName: "Detroit Assembly", loadCapacityKg: 1500, units: 6, cruiseSpeedKmh: 9, maxSpeedKmh: 14, sop: /* @__PURE__ */ new Date("2026-07-01"), eop: /* @__PURE__ */ new Date("2032-07-01"), packagingMeanNames: ["Picking Cart 05", "Kitting Cart 04"] },
  { name: "Tugger Loop D2", categoryName: "Tugger Train", supplierName: "North Steel", plantName: "Detroit Assembly", loadCapacityKg: 1400, units: 5, cruiseSpeedKmh: 8, maxSpeedKmh: 13, sop: /* @__PURE__ */ new Date("2026-08-01"), eop: /* @__PURE__ */ new Date("2032-08-01"), packagingMeanNames: ["Utility Cart 07"] },
  { name: "AMR Conveyor D3", categoryName: "AGV-AMR", supplierName: "Midwest Machining", plantName: "Detroit Assembly", loadCapacityKg: 900, units: 3, cruiseSpeedKmh: 7, maxSpeedKmh: 12, sop: /* @__PURE__ */ new Date("2026-09-01"), eop: /* @__PURE__ */ new Date("2032-09-01"), packagingMeanNames: ["Shopstock Hook 02"] },
  // Barcelona Assembly (7)
  { name: "AGV BCN 01", categoryName: "AGV-AMR", supplierName: "Catalunya Metals", plantName: "Barcelona Assembly", loadCapacityKg: 700, units: 4, cruiseSpeedKmh: 6, maxSpeedKmh: 10, sop: /* @__PURE__ */ new Date("2026-01-15"), eop: /* @__PURE__ */ new Date("2031-01-15"), packagingMeanNames: ["Picking Cart 02", "Utility Cart 03"] },
  { name: "AGV BCN 02", categoryName: "AGV-AMR", supplierName: "Catalunya Metals", plantName: "Barcelona Assembly", loadCapacityKg: 680, units: 3, cruiseSpeedKmh: 7, maxSpeedKmh: 11, sop: /* @__PURE__ */ new Date("2026-02-15"), eop: /* @__PURE__ */ new Date("2031-02-15"), packagingMeanNames: ["Kitting Cart 06"] },
  { name: "Forklift BCN 01", categoryName: "Forklift", supplierName: "Catalunya Metals", plantName: "Barcelona Assembly", loadCapacityKg: 2300, units: 5, cruiseSpeedKmh: 12, maxSpeedKmh: 19, sop: /* @__PURE__ */ new Date("2026-04-01"), eop: /* @__PURE__ */ new Date("2032-04-01"), packagingMeanNames: ["High Density Tower 05"] },
  { name: "Forklift BCN 02", categoryName: "Forklift", supplierName: "Catalunya Metals", plantName: "Barcelona Assembly", loadCapacityKg: 2100, units: 4, cruiseSpeedKmh: 13, maxSpeedKmh: 20, sop: /* @__PURE__ */ new Date("2026-05-01"), eop: /* @__PURE__ */ new Date("2032-05-01"), packagingMeanNames: ["Plastic Box 06"] },
  { name: "Tugger BCN 01", categoryName: "Tugger Train", supplierName: "Catalunya Metals", plantName: "Barcelona Assembly", loadCapacityKg: 1600, units: 6, cruiseSpeedKmh: 9, maxSpeedKmh: 14, sop: /* @__PURE__ */ new Date("2026-06-01"), eop: /* @__PURE__ */ new Date("2032-06-01"), packagingMeanNames: ["Picking Cart 09"] },
  { name: "Tugger BCN 02", categoryName: "Tugger Train", supplierName: "Catalunya Metals", plantName: "Barcelona Assembly", loadCapacityKg: 1550, units: 5, cruiseSpeedKmh: 8, maxSpeedKmh: 13, sop: /* @__PURE__ */ new Date("2026-07-01"), eop: /* @__PURE__ */ new Date("2032-07-01"), packagingMeanNames: ["Utility Cart 05"] },
  { name: "AMR Dock BCN", categoryName: "AGV-AMR", supplierName: "Catalunya Metals", plantName: "Barcelona Assembly", loadCapacityKg: 800, units: 4, cruiseSpeedKmh: 7, maxSpeedKmh: 12, sop: /* @__PURE__ */ new Date("2026-08-01"), eop: /* @__PURE__ */ new Date("2032-08-01"), packagingMeanNames: ["Kitting Cart 10"] },
  // Stockholm Lines (7)
  { name: "AMR Nordic 01", categoryName: "AGV-AMR", supplierName: "Nordic Foams", plantName: "Stockholm Lines", loadCapacityKg: 820, units: 3, cruiseSpeedKmh: 6, maxSpeedKmh: 10, sop: /* @__PURE__ */ new Date("2026-02-01"), eop: /* @__PURE__ */ new Date("2031-02-01"), packagingMeanNames: ["Picking Cart 11", "Utility Cart 09"] },
  { name: "AMR Nordic 02", categoryName: "AGV-AMR", supplierName: "Baltic Fasteners", plantName: "Stockholm Lines", loadCapacityKg: 780, units: 4, cruiseSpeedKmh: 7, maxSpeedKmh: 11, sop: /* @__PURE__ */ new Date("2026-03-01"), eop: /* @__PURE__ */ new Date("2031-03-01"), packagingMeanNames: ["Kitting Cart 12"] },
  { name: "Forklift Nordic 01", categoryName: "Forklift", supplierName: "Baltic Fasteners", plantName: "Stockholm Lines", loadCapacityKg: 2100, units: 5, cruiseSpeedKmh: 12, maxSpeedKmh: 19, sop: /* @__PURE__ */ new Date("2026-04-15"), eop: /* @__PURE__ */ new Date("2032-04-15"), packagingMeanNames: ["High Density Tower 08"] },
  { name: "Forklift Nordic 02", categoryName: "Forklift", supplierName: "Nordic Foams", plantName: "Stockholm Lines", loadCapacityKg: 2050, units: 4, cruiseSpeedKmh: 13, maxSpeedKmh: 20, sop: /* @__PURE__ */ new Date("2026-05-15"), eop: /* @__PURE__ */ new Date("2032-05-15"), packagingMeanNames: ["Plastic Box 09"] },
  { name: "Tugger Nordic 01", categoryName: "Tugger Train", supplierName: "Baltic Fasteners", plantName: "Stockholm Lines", loadCapacityKg: 1500, units: 6, cruiseSpeedKmh: 9, maxSpeedKmh: 14, sop: /* @__PURE__ */ new Date("2026-06-15"), eop: /* @__PURE__ */ new Date("2032-06-15"), packagingMeanNames: ["Picking Cart 15"] },
  { name: "Tugger Nordic 02", categoryName: "Tugger Train", supplierName: "Nordic Foams", plantName: "Stockholm Lines", loadCapacityKg: 1450, units: 5, cruiseSpeedKmh: 8, maxSpeedKmh: 13, sop: /* @__PURE__ */ new Date("2026-07-15"), eop: /* @__PURE__ */ new Date("2032-07-15"), packagingMeanNames: ["Utility Cart 10"] },
  { name: "AMR Shuttle Nordic", categoryName: "AGV-AMR", supplierName: "Baltic Fasteners", plantName: "Stockholm Lines", loadCapacityKg: 900, units: 3, cruiseSpeedKmh: 7, maxSpeedKmh: 12, sop: /* @__PURE__ */ new Date("2026-08-15"), eop: /* @__PURE__ */ new Date("2032-08-15"), packagingMeanNames: ["Kitting Cart 15"] },
  // Extra heterogeneous fleet (20)
  { name: "Forklift BCN Demo", categoryName: "Forklift", supplierName: "Catalunya Metals", plantName: "Barcelona Assembly", loadCapacityKg: 2400, units: 3, cruiseSpeedKmh: 12, maxSpeedKmh: 20, sop: /* @__PURE__ */ new Date("2027-01-05"), eop: /* @__PURE__ */ new Date("2033-01-05"), packagingMeanNames: ["HD Rack 10"], flowSlug: "assembly-to-warehouse", secondaryFlowSlug: "assembly-to-customer" },
  { name: "AGV Night Runner", categoryName: "AGV-AMR", supplierName: "North Steel", plantName: "Detroit Assembly", loadCapacityKg: 650, units: 6, cruiseSpeedKmh: 6, maxSpeedKmh: 10, sop: /* @__PURE__ */ new Date("2027-02-10"), eop: /* @__PURE__ */ new Date("2033-02-10"), packagingMeanNames: ["Picking Cart 18"], flowSlug: "injection-to-assembly", secondaryFlowSlug: "assembly-to-customer" },
  { name: "Tugger Sunrise", categoryName: "Tugger Train", supplierName: "Midwest Machining", plantName: "Montreal Plastics", loadCapacityKg: 1300, units: 4, cruiseSpeedKmh: 8, maxSpeedKmh: 12, sop: /* @__PURE__ */ new Date("2027-03-15"), eop: /* @__PURE__ */ new Date("2033-03-15"), packagingMeanNames: ["Utility Cart 12"], flowSlug: "paint-to-assembly" },
  { name: "Forklift Rio", categoryName: "Forklift", supplierName: "Paulista Coatings", plantName: "Sao Paulo Molding", loadCapacityKg: 2100, units: 5, cruiseSpeedKmh: 11, maxSpeedKmh: 18, sop: /* @__PURE__ */ new Date("2027-04-20"), eop: /* @__PURE__ */ new Date("2033-04-20"), packagingMeanNames: ["Tallboy 05"], flowSlug: "assembly-to-warehouse" },
  { name: "AMR Queretaro Express", categoryName: "AGV-AMR", supplierName: "Aztec Fasteners", plantName: "Queretaro Trim", loadCapacityKg: 720, units: 5, cruiseSpeedKmh: 7, maxSpeedKmh: 11, sop: /* @__PURE__ */ new Date("2027-05-25"), eop: /* @__PURE__ */ new Date("2033-05-25"), packagingMeanNames: ["Picking Cart 20"], flowSlug: "injection-to-assembly" },
  { name: "Tugger Atlas", categoryName: "Tugger Train", supplierName: "Atlas Metals", plantName: "Casablanca Interiors", loadCapacityKg: 1480, units: 6, cruiseSpeedKmh: 8, maxSpeedKmh: 13, sop: /* @__PURE__ */ new Date("2027-06-30"), eop: /* @__PURE__ */ new Date("2033-06-30"), packagingMeanNames: ["Utility Cart 14"], flowSlug: "paint-to-assembly" },
  { name: "Forklift NordX", categoryName: "Forklift", supplierName: "Baltic Fasteners", plantName: "Stockholm Lines", loadCapacityKg: 2250, units: 4, cruiseSpeedKmh: 12, maxSpeedKmh: 19, sop: /* @__PURE__ */ new Date("2027-07-05"), eop: /* @__PURE__ */ new Date("2033-07-05"), packagingMeanNames: ["HD Rack 20"], flowSlug: "assembly-to-warehouse" },
  { name: "AGV Harbour", categoryName: "AGV-AMR", supplierName: "Harbour Composites", plantName: "Sydney Kitting", loadCapacityKg: 680, units: 4, cruiseSpeedKmh: 6, maxSpeedKmh: 10, sop: /* @__PURE__ */ new Date("2027-08-10"), eop: /* @__PURE__ */ new Date("2033-08-10"), packagingMeanNames: ["Picking Cart 25"], flowSlug: "assembly-to-customer" },
  { name: "Tugger Desert", categoryName: "Tugger Train", supplierName: "Gauteng Rubber", plantName: "Johannesburg Components", loadCapacityKg: 1550, units: 5, cruiseSpeedKmh: 8, maxSpeedKmh: 12, sop: /* @__PURE__ */ new Date("2027-09-15"), eop: /* @__PURE__ */ new Date("2033-09-15"), packagingMeanNames: ["Kitting Cart 22"], flowSlug: "injection-to-assembly" },
  { name: "Forklift Alpine", categoryName: "Forklift", supplierName: "Rhone Textiles", plantName: "Lyon Composites", loadCapacityKg: 2050, units: 4, cruiseSpeedKmh: 11, maxSpeedKmh: 17, sop: /* @__PURE__ */ new Date("2027-10-20"), eop: /* @__PURE__ */ new Date("2033-10-20"), packagingMeanNames: ["Plastic Box 15"], flowSlug: "paint-to-assembly" },
  { name: "AMR Pudong", categoryName: "AGV-AMR", supplierName: "Pudong Fasteners", plantName: "Shanghai Stamping", loadCapacityKg: 850, units: 5, cruiseSpeedKmh: 7, maxSpeedKmh: 12, sop: /* @__PURE__ */ new Date("2027-11-25"), eop: /* @__PURE__ */ new Date("2033-11-25"), packagingMeanNames: ["Tallboy 12"], flowSlug: "assembly-to-customer" },
  { name: "Tugger Sakura", categoryName: "Tugger Train", supplierName: "Chubu Springs", plantName: "Nagoya Plastics", loadCapacityKg: 1420, units: 4, cruiseSpeedKmh: 8, maxSpeedKmh: 13, sop: /* @__PURE__ */ new Date("2027-12-30"), eop: /* @__PURE__ */ new Date("2033-12-30"), packagingMeanNames: ["Utility Cart 16"], flowSlug: "injection-to-assembly" },
  { name: "Forklift Thames", categoryName: "Forklift", supplierName: "Pennine Glass", plantName: "Manchester Modules", loadCapacityKg: 2150, units: 5, cruiseSpeedKmh: 12, maxSpeedKmh: 18, sop: /* @__PURE__ */ new Date("2028-01-04"), eop: /* @__PURE__ */ new Date("2034-01-04"), packagingMeanNames: ["HD Rack 25"], flowSlug: "assembly-to-warehouse" },
  { name: "AGV Cascades", categoryName: "AGV-AMR", supplierName: "Maple Resin", plantName: "Montreal Plastics", loadCapacityKg: 760, units: 6, cruiseSpeedKmh: 6, maxSpeedKmh: 10, sop: /* @__PURE__ */ new Date("2028-02-09"), eop: /* @__PURE__ */ new Date("2034-02-09"), packagingMeanNames: ["Picking Cart 28"], flowSlug: "injection-to-assembly" },
  { name: "Tugger Riviera", categoryName: "Tugger Train", supplierName: "Ligurian Plastics", plantName: "Lyon Composites", loadCapacityKg: 1520, units: 5, cruiseSpeedKmh: 8, maxSpeedKmh: 12, sop: /* @__PURE__ */ new Date("2028-03-15"), eop: /* @__PURE__ */ new Date("2034-03-15"), packagingMeanNames: ["Kitting Cart 30"], flowSlug: "paint-to-assembly" },
  { name: "Forklift Atlas Heavy", categoryName: "Forklift", supplierName: "Atlas Metals", plantName: "Casablanca Interiors", loadCapacityKg: 2450, units: 3, cruiseSpeedKmh: 11, maxSpeedKmh: 19, sop: /* @__PURE__ */ new Date("2028-04-20"), eop: /* @__PURE__ */ new Date("2034-04-20"), packagingMeanNames: ["Plastic Box 18"], flowSlug: "assembly-to-customer" },
  { name: "AMR Coral", categoryName: "AGV-AMR", supplierName: "Harbour Composites", plantName: "Sydney Kitting", loadCapacityKg: 700, units: 5, cruiseSpeedKmh: 6, maxSpeedKmh: 10, sop: /* @__PURE__ */ new Date("2028-05-25"), eop: /* @__PURE__ */ new Date("2034-05-25"), packagingMeanNames: ["Utility Cart 18"], flowSlug: "assembly-to-warehouse" },
  { name: "Tugger Andes", categoryName: "Tugger Train", supplierName: "Andes Fibers", plantName: "Sao Paulo Molding", loadCapacityKg: 1490, units: 6, cruiseSpeedKmh: 8, maxSpeedKmh: 12, sop: /* @__PURE__ */ new Date("2028-06-30"), eop: /* @__PURE__ */ new Date("2034-06-30"), packagingMeanNames: ["Picking Cart 30"], flowSlug: "paint-to-assembly" },
  { name: "Forklift Delta", categoryName: "Forklift", supplierName: "Neckar Plast", plantName: "Stuttgart Paint", loadCapacityKg: 2180, units: 4, cruiseSpeedKmh: 12, maxSpeedKmh: 18, sop: /* @__PURE__ */ new Date("2028-07-05"), eop: /* @__PURE__ */ new Date("2034-07-05"), packagingMeanNames: ["HD Rack 30"], flowSlug: "assembly-to-customer" },
  { name: "AMR Atlas Mini", categoryName: "AGV-AMR", supplierName: "North Steel", plantName: "Detroit Assembly", loadCapacityKg: 600, units: 4, cruiseSpeedKmh: 6, maxSpeedKmh: 9, sop: /* @__PURE__ */ new Date("2028-08-10"), eop: /* @__PURE__ */ new Date("2034-08-10"), packagingMeanNames: ["Utility Cart 20"], flowSlug: "injection-to-assembly" }
];
var packagingMeanCategoriesSeedData = [
  {
    name: "Utility Cart",
    description: "Multipurpose cart designed for quick moves between inbound docks and kitting cells.",
    imageUrl: "https://images.unsplash.com/photo-1502877338535-766e1452684a"
  },
  {
    name: "Kitting Cart",
    description: "Ergonomic cart optimized for staging components near assembly lines.",
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee"
  },
  {
    name: "Picking Cart",
    description: "Narrow footprint cart used for high-frequency picking runs.",
    imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e"
  },
  {
    name: "Shopstock Hook",
    description: "Heavy-duty hook system that keeps frequently used parts within reach.",
    imageUrl: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef"
  },
  {
    name: "Transtocker Hook",
    description: "Overhead hook compatible with automatic transtockers for fast swaps.",
    imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688"
  },
  {
    name: "Tallboy",
    description: "Vertical storage tower maximizing cubic efficiency in tight aisles.",
    imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085"
  },
  {
    name: "HD Rack",
    description: "High-density racking unit supporting palletized and loose packaging.",
    imageUrl: "https://images.unsplash.com/photo-1560464024-54c5c887c1bf"
  },
  {
    name: "Plastic Box",
    description: "Durable plastic totes for closed-loop shuttles between suppliers and plant.",
    imageUrl: "https://images.unsplash.com/photo-1454165205744-3b78555e5572"
  },
  {
    name: "High Density Tower",
    description: "Automated tower providing dense storage for small packaging assets.",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa"
  }
];
var storageMeanCategoriesSeedData = [
  {
    name: "Automated Hanging Shopstock",
    description: "Robot-managed hanging aisles buffering painted subassemblies with real-time inventory tracking.",
    imageUrl: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a"
  },
  {
    name: "Manual Hanging Shopstock",
    description: "Operator-friendly hanging rails that keep bulky trim sets within reach of assembly teams.",
    imageUrl: "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8"
  },
  {
    name: "Automated Transtocker",
    description: "High-throughput transtockers feeding cells with sequenced components under automated control.",
    imageUrl: "https://images.unsplash.com/photo-1489515215877-9227ee91edef"
  },
  {
    name: "Manual Transtocker",
    description: "Manually dispatched transtockers supporting flexible replenishment during short runs.",
    imageUrl: "https://images.unsplash.com/photo-1452698325353-b89e0069974b"
  },
  {
    name: "High Bay Rack",
    description: "High-bay rack structure maximizing cubic density for pallets and oversized loads.",
    imageUrl: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606"
  },
  {
    name: "ASRS",
    description: "Automated Storage and Retrieval Systems, grid orchestrating deep-lane buffering for fast movers.",
    imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429"
  },
  {
    name: "CRM",
    description: "Conveyor on Rail Motorized. Powered conveyor-on-rail network routing totes across mezzanines and paint shops.",
    imageUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e"
  }
];
var usersSeedData = [
  {
    email: "valery@opmobility.com",
    name: "Valery",
    password: "ChangeMe123",
    birthDate: /* @__PURE__ */ new Date("1990-05-10")
  },
  {
    email: "ops@opmobility.com",
    name: "Ops Team",
    password: "ChangeMe123",
    birthDate: /* @__PURE__ */ new Date("1988-09-15")
  }
];
var manualTranstockerDefaults = {
  imageUrl: "https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1200&q=80",
  lanes: [
    { length: 1200, width: 800, height: 600, quantity: 2 },
    { length: 1e3, width: 600, height: 500, quantity: 1 }
  ]
};
var baseStorageMeansSeedData = [
  {
    name: "Cold room A1",
    description: "Primary refrigerated storage zone",
    status: import_client.$Enums.StorageStatus.ACTIVE,
    price: 12e3,
    plantName: "Detroit Assembly",
    supplierName: "North Steel",
    flowSlug: "injection-to-paint",
    sop: /* @__PURE__ */ new Date("2026-01-01"),
    eop: /* @__PURE__ */ new Date("2036-01-01"),
    storageMeanCategoryName: "High Bay Rack"
  },
  {
    name: "Overflow zone C2",
    description: "Temporary holding area",
    status: import_client.$Enums.StorageStatus.DRAFT,
    price: 4e3,
    plantName: "Barcelona Assembly",
    supplierName: "Catalunya Metals",
    flowSlug: "assembly-to-warehouse",
    sop: /* @__PURE__ */ new Date("2026-09-01"),
    eop: /* @__PURE__ */ new Date("2036-09-01"),
    storageMeanCategoryName: "Automated Transtocker"
  }
];
var manualTranstockerSeeds = [
  {
    name: "Dry warehouse B4",
    description: "Ambient storage for packaging",
    status: import_client.$Enums.StorageStatus.ACTIVE,
    price: 8e3,
    plantName: "Montreal Plastics",
    supplierName: "Maple Resin",
    flowSlug: "paint-to-assembly",
    sop: /* @__PURE__ */ new Date("2026-06-01"),
    eop: /* @__PURE__ */ new Date("2036-06-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1100,
    usefulSurfaceM2: 45,
    grossSurfaceM2: 60
  },
  {
    name: "Manual Transtocker A1",
    description: "Line-side buffer for trim sets with manual dispatching.",
    status: import_client.$Enums.StorageStatus.ACTIVE,
    price: 5200,
    plantName: "Detroit Assembly",
    supplierName: "Midwest Machining",
    flowSlug: "injection-to-paint",
    sop: /* @__PURE__ */ new Date("2026-02-01"),
    eop: /* @__PURE__ */ new Date("2034-02-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1150,
    usefulSurfaceM2: 32,
    grossSurfaceM2: 45
  },
  {
    name: "Manual Transtocker A2",
    description: "Flexible replenishment rack for kitting loops.",
    status: import_client.$Enums.StorageStatus.ACTIVE,
    price: 5100,
    plantName: "Montreal Plastics",
    supplierName: "Maple Resin",
    flowSlug: "paint-to-assembly",
    sop: /* @__PURE__ */ new Date("2026-03-01"),
    eop: /* @__PURE__ */ new Date("2034-03-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1120,
    usefulSurfaceM2: 30,
    grossSurfaceM2: 40
  },
  {
    name: "Manual Transtocker A3",
    description: "Sequenced racks for interior trims.",
    status: import_client.$Enums.StorageStatus.ACTIVE,
    price: 4900,
    plantName: "Queretaro Trim",
    supplierName: "Aztec Fasteners",
    flowSlug: "assembly-to-warehouse",
    sop: /* @__PURE__ */ new Date("2026-04-01"),
    eop: /* @__PURE__ */ new Date("2034-04-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1100,
    usefulSurfaceM2: 28,
    grossSurfaceM2: 38
  },
  {
    name: "Manual Transtocker A4",
    description: "Dedicated to paint shop WIP pallets.",
    status: import_client.$Enums.StorageStatus.ACTIVE,
    price: 5600,
    plantName: "Sao Paulo Molding",
    supplierName: "Paulista Coatings",
    flowSlug: "paint-to-assembly",
    sop: /* @__PURE__ */ new Date("2026-05-01"),
    eop: /* @__PURE__ */ new Date("2034-05-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1180,
    usefulSurfaceM2: 36,
    grossSurfaceM2: 50
  },
  {
    name: "Manual Transtocker A5",
    description: "Short-run components staging near assembly.",
    status: import_client.$Enums.StorageStatus.ACTIVE,
    price: 5300,
    plantName: "Lyon Composites",
    supplierName: "Rhone Textiles",
    flowSlug: "assembly-to-warehouse",
    sop: /* @__PURE__ */ new Date("2026-06-01"),
    eop: /* @__PURE__ */ new Date("2034-06-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1140,
    usefulSurfaceM2: 34,
    grossSurfaceM2: 48
  },
  {
    name: "Manual Transtocker A6",
    description: "Operator-managed rack for paint shop returns.",
    status: import_client.$Enums.StorageStatus.ACTIVE,
    price: 5400,
    plantName: "Stuttgart Paint",
    supplierName: "Neckar Plast",
    flowSlug: "paint-to-assembly",
    sop: /* @__PURE__ */ new Date("2026-07-01"),
    eop: /* @__PURE__ */ new Date("2034-07-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1160,
    usefulSurfaceM2: 35,
    grossSurfaceM2: 49
  },
  {
    name: "Manual Transtocker A7",
    description: "WIP rack for glazing kits.",
    status: import_client.$Enums.StorageStatus.ACTIVE,
    price: 5050,
    plantName: "Barcelona Assembly",
    supplierName: "Catalunya Metals",
    flowSlug: "injection-to-paint",
    sop: /* @__PURE__ */ new Date("2026-08-01"),
    eop: /* @__PURE__ */ new Date("2034-08-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1090,
    usefulSurfaceM2: 30,
    grossSurfaceM2: 42
  },
  {
    name: "Manual Transtocker A8",
    description: "Manual shuttle for interior kitting totes.",
    status: import_client.$Enums.StorageStatus.ACTIVE,
    price: 4800,
    plantName: "Manchester Modules",
    supplierName: "Pennine Glass",
    flowSlug: "assembly-to-warehouse",
    sop: /* @__PURE__ */ new Date("2026-09-01"),
    eop: /* @__PURE__ */ new Date("2034-09-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1110,
    usefulSurfaceM2: 31,
    grossSurfaceM2: 43
  },
  {
    name: "Manual Transtocker A9",
    description: "Buffers foam kits near assembly cells.",
    status: import_client.$Enums.StorageStatus.ACTIVE,
    price: 5150,
    plantName: "Stockholm Lines",
    supplierName: "Nordic Foams",
    flowSlug: "paint-to-assembly",
    sop: /* @__PURE__ */ new Date("2026-10-01"),
    eop: /* @__PURE__ */ new Date("2034-10-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1130,
    usefulSurfaceM2: 33,
    grossSurfaceM2: 46
  },
  {
    name: "Manual Transtocker A10",
    description: "Small lots for fasteners and clips.",
    status: import_client.$Enums.StorageStatus.ACTIVE,
    price: 4700,
    plantName: "Johannesburg Components",
    supplierName: "Gauteng Rubber",
    flowSlug: "injection-to-paint",
    sop: /* @__PURE__ */ new Date("2026-11-01"),
    eop: /* @__PURE__ */ new Date("2034-11-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1170,
    usefulSurfaceM2: 35,
    grossSurfaceM2: 50
  },
  {
    name: "Manual Transtocker A11",
    description: "Pre-assembly staging for leather trims.",
    status: import_client.$Enums.StorageStatus.ACTIVE,
    price: 5500,
    plantName: "Casablanca Interiors",
    supplierName: "Atlas Metals",
    flowSlug: "paint-to-assembly",
    sop: /* @__PURE__ */ new Date("2026-12-01"),
    eop: /* @__PURE__ */ new Date("2034-12-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1120,
    usefulSurfaceM2: 30,
    grossSurfaceM2: 42
  },
  {
    name: "Manual Transtocker A12",
    description: "Manual shuttle for electronic modules.",
    status: import_client.$Enums.StorageStatus.ACTIVE,
    price: 4950,
    plantName: "Bangalore Systems",
    supplierName: "Coromandel Chemicals",
    flowSlug: "injection-to-paint",
    sop: /* @__PURE__ */ new Date("2027-01-01"),
    eop: /* @__PURE__ */ new Date("2035-01-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1150,
    usefulSurfaceM2: 34,
    grossSurfaceM2: 47
  },
  {
    name: "Manual Transtocker A13",
    description: "Supports plastic trim kits in paint buffer.",
    status: import_client.$Enums.StorageStatus.ACTIVE,
    price: 5350,
    plantName: "Shanghai Stamping",
    supplierName: "Pudong Fasteners",
    flowSlug: "paint-to-assembly",
    sop: /* @__PURE__ */ new Date("2027-02-01"),
    eop: /* @__PURE__ */ new Date("2035-02-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1160,
    usefulSurfaceM2: 35,
    grossSurfaceM2: 48
  },
  {
    name: "Manual Transtocker A14",
    description: "Trim racks for export variants.",
    status: import_client.$Enums.StorageStatus.ACTIVE,
    price: 5050,
    plantName: "Nagoya Plastics",
    supplierName: "Chubu Springs",
    flowSlug: "assembly-to-warehouse",
    sop: /* @__PURE__ */ new Date("2027-03-01"),
    eop: /* @__PURE__ */ new Date("2035-03-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1110,
    usefulSurfaceM2: 32,
    grossSurfaceM2: 44
  },
  {
    name: "Manual Transtocker A15",
    description: "Manual shuttle for coastal deliveries.",
    status: import_client.$Enums.StorageStatus.ACTIVE,
    price: 5e3,
    plantName: "Sydney Kitting",
    supplierName: "Harbour Composites",
    flowSlug: "injection-to-paint",
    sop: /* @__PURE__ */ new Date("2027-04-01"),
    eop: /* @__PURE__ */ new Date("2035-04-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1120,
    usefulSurfaceM2: 33,
    grossSurfaceM2: 45
  },
  {
    name: "Manual Transtocker A16",
    description: "Auxiliary rack for pilot builds.",
    status: import_client.$Enums.StorageStatus.DRAFT,
    price: 4500,
    plantName: "Detroit Assembly",
    supplierName: "North Steel",
    flowSlug: "assembly-to-warehouse",
    sop: /* @__PURE__ */ new Date("2027-05-01"),
    eop: /* @__PURE__ */ new Date("2035-05-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1130,
    usefulSurfaceM2: 34,
    grossSurfaceM2: 46
  },
  {
    name: "Manual Transtocker A17",
    description: "Overflow rack for plastics bins.",
    status: import_client.$Enums.StorageStatus.ACTIVE,
    price: 4600,
    plantName: "Montreal Plastics",
    supplierName: "Maple Resin",
    flowSlug: "injection-to-paint",
    sop: /* @__PURE__ */ new Date("2027-06-01"),
    eop: /* @__PURE__ */ new Date("2035-06-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1140,
    usefulSurfaceM2: 35,
    grossSurfaceM2: 47
  },
  {
    name: "Manual Transtocker A18",
    description: "Manual buffer for paint rejects.",
    status: import_client.$Enums.StorageStatus.ACTIVE,
    price: 4700,
    plantName: "Sao Paulo Molding",
    supplierName: "Andes Fibers",
    flowSlug: "paint-to-assembly",
    sop: /* @__PURE__ */ new Date("2027-07-01"),
    eop: /* @__PURE__ */ new Date("2035-07-01"),
    storageMeanCategoryName: "Manual Transtocker"
  },
  {
    name: "Manual Transtocker A19",
    description: "Kitting rack for headliners.",
    status: import_client.$Enums.StorageStatus.ACTIVE,
    price: 5150,
    plantName: "Lyon Composites",
    supplierName: "Ligurian Plastics",
    flowSlug: "assembly-to-warehouse",
    sop: /* @__PURE__ */ new Date("2027-08-01"),
    eop: /* @__PURE__ */ new Date("2035-08-01"),
    storageMeanCategoryName: "Manual Transtocker"
  },
  {
    name: "Manual Transtocker A20",
    description: "Manual staging for color swaps.",
    status: import_client.$Enums.StorageStatus.ACTIVE,
    price: 5250,
    plantName: "Stuttgart Paint",
    supplierName: "Danube Castings",
    flowSlug: "injection-to-paint",
    sop: /* @__PURE__ */ new Date("2027-09-01"),
    eop: /* @__PURE__ */ new Date("2035-09-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1150,
    usefulSurfaceM2: 36,
    grossSurfaceM2: 48
  }
].map((seed) => ({ ...manualTranstockerDefaults, ...seed }));
var storageMeansSeedData = [...baseStorageMeansSeedData, ...manualTranstockerSeeds];
var flowSeedData = [
  { slug: "injection-to-paint", from: "INJECTION", to: "PAINT" },
  { slug: "paint-to-assembly", from: "PAINT", to: "ASSEMBLY" },
  { slug: "assembly-to-warehouse", from: "ASSEMBLY", to: "WAREHOUSE" },
  { slug: "injection-to-assembly", from: "INJECTION", to: "ASSEMBLY" },
  { slug: "assembly-to-customer", from: "ASSEMBLY", to: "CUSTOMER" }
];
var plantSeedData = [
  { name: "Detroit Assembly", address: { street: "1200 Industrial Dr", city: "Detroit", zipcode: "48201", countryCode: "US" } },
  { name: "Montreal Plastics", address: { street: "45 Rue Industrielle", city: "Montreal", zipcode: "H1A 0A1", countryCode: "CA" } },
  { name: "Queretaro Trim", address: { street: "220 Parque Tech", city: "Queretaro", zipcode: "76100", countryCode: "MX" } },
  { name: "Sao Paulo Molding", address: { street: "88 Rua do P\xF3lo", city: "Sao Paulo", zipcode: "01000-000", countryCode: "BR" } },
  { name: "Lyon Composites", address: { street: "15 Rue des Usines", city: "Lyon", zipcode: "69002", countryCode: "FR" } },
  { name: "Stuttgart Paint", address: { street: "12 Werkstrasse", city: "Stuttgart", zipcode: "70173", countryCode: "DE" } },
  { name: "Barcelona Assembly", address: { street: "34 Carrer Industrial", city: "Barcelona", zipcode: "08001", countryCode: "ES" } },
  { name: "Manchester Modules", address: { street: "5 Supply Park Way", city: "Manchester", zipcode: "M1 1AE", countryCode: "GB" } },
  { name: "Stockholm Lines", address: { street: "9 Logistikgatan", city: "Stockholm", zipcode: "111 20", countryCode: "SE" } },
  { name: "Johannesburg Components", address: { street: "18 Axis Road", city: "Johannesburg", zipcode: "2000", countryCode: "ZA" } },
  { name: "Casablanca Interiors", address: { street: "7 Zone Industrielle", city: "Casablanca", zipcode: "20050", countryCode: "MA" } },
  { name: "Bangalore Systems", address: { street: "210 Tech Park Rd", city: "Bangalore", zipcode: "560001", countryCode: "IN" } },
  { name: "Shanghai Stamping", address: { street: "66 Pudong Ave", city: "Shanghai", zipcode: "200120", countryCode: "CN" } },
  { name: "Nagoya Plastics", address: { street: "3 Chome Nishiki", city: "Nagoya", zipcode: "460-0003", countryCode: "JP" } },
  { name: "Sydney Kitting", address: { street: "14 Logistics Blvd", city: "Sydney", zipcode: "2000", countryCode: "AU" } }
];
var supplierSeedData = [
  { name: "North Steel", address: { street: "310 Foundry Rd", city: "Detroit", zipcode: "48202", countryCode: "US" } },
  { name: "Maple Resin", address: { street: "72 Chemin Nord", city: "Montreal", zipcode: "H1B 1B1", countryCode: "CA" } },
  { name: "Aztec Fasteners", address: { street: "501 Ruta 57", city: "Queretaro", zipcode: "76116", countryCode: "MX" } },
  { name: "Paulista Coatings", address: { street: "12 Avenida Azul", city: "Sao Paulo", zipcode: "01010-010", countryCode: "BR" } },
  { name: "Rhone Textiles", address: { street: "21 Quai Sud", city: "Lyon", zipcode: "69003", countryCode: "FR" } },
  { name: "Neckar Plast", address: { street: "4 Farbstrasse", city: "Stuttgart", zipcode: "70176", countryCode: "DE" } },
  { name: "Catalunya Metals", address: { street: "56 Carrer del Port", city: "Barcelona", zipcode: "08019", countryCode: "ES" } },
  { name: "Pennine Glass", address: { street: "8 Canal Street", city: "Manchester", zipcode: "M2 3GX", countryCode: "GB" } },
  { name: "Nordic Foams", address: { street: "11 Fabriksv\xE4gen", city: "Stockholm", zipcode: "112 21", countryCode: "SE" } },
  { name: "Gauteng Rubber", address: { street: "19 Supply Rd", city: "Johannesburg", zipcode: "2001", countryCode: "ZA" } },
  { name: "Atlas Metals", address: { street: "5 Port Logistique", city: "Casablanca", zipcode: "20060", countryCode: "MA" } },
  { name: "Coromandel Chemicals", address: { street: "14 Bannerghatta Rd", city: "Bangalore", zipcode: "560029", countryCode: "IN" } },
  { name: "Pudong Fasteners", address: { street: "88 Zhangyang Rd", city: "Shanghai", zipcode: "200135", countryCode: "CN" } },
  { name: "Chubu Springs", address: { street: "2-10 Sakae", city: "Nagoya", zipcode: "460-0008", countryCode: "JP" } },
  { name: "Harbour Composites", address: { street: "41 Botany Rd", city: "Sydney", zipcode: "2015", countryCode: "AU" } },
  { name: "Midwest Machining", address: { street: "220 Industrial Ave", city: "Detroit", zipcode: "48205", countryCode: "US" } },
  { name: "Ligurian Plastics", address: { street: "17 Via Mare", city: "Lyon", zipcode: "69007", countryCode: "FR" } },
  { name: "Andes Fibers", address: { street: "77 Rua Verde", city: "Sao Paulo", zipcode: "01015-030", countryCode: "BR" } },
  { name: "Baltic Fasteners", address: { street: "23 Skeppsgatan", city: "Stockholm", zipcode: "116 30", countryCode: "SE" } },
  { name: "Danube Castings", address: { street: "9 Hafenstrasse", city: "Stuttgart", zipcode: "70180", countryCode: "DE" } }
];
var projectSeedData = [
  { name: "Aurora Sedan Program", code: "AUR01", sop: /* @__PURE__ */ new Date("2026-03-01"), eop: /* @__PURE__ */ new Date("2032-12-31") },
  { name: "Beacon SUV Refresh", code: "BEC11", sop: /* @__PURE__ */ new Date("2026-07-01"), eop: /* @__PURE__ */ new Date("2031-06-30") },
  { name: "Comet EV Launch", code: "COM21", sop: /* @__PURE__ */ new Date("2027-01-15"), eop: /* @__PURE__ */ new Date("2033-12-31") },
  { name: "Draco Crossover", code: "DRA31", sop: /* @__PURE__ */ new Date("2026-10-01"), eop: /* @__PURE__ */ new Date("2032-03-31") },
  { name: "Equinox Van", code: "EQX41", sop: /* @__PURE__ */ new Date("2027-04-01"), eop: /* @__PURE__ */ new Date("2034-04-30") },
  { name: "Falcon Pickup", code: "FAL51", sop: /* @__PURE__ */ new Date("2026-09-01"), eop: /* @__PURE__ */ new Date("2031-12-31") },
  { name: "Glacier Bus", code: "GLA61", sop: /* @__PURE__ */ new Date("2027-02-01"), eop: /* @__PURE__ */ new Date("2033-06-30") },
  { name: "Helios Coupe", code: "HEL71", sop: /* @__PURE__ */ new Date("2026-05-15"), eop: /* @__PURE__ */ new Date("2032-05-31") },
  { name: "Ion Compact", code: "ION81", sop: /* @__PURE__ */ new Date("2026-11-01"), eop: /* @__PURE__ */ new Date("2032-09-30") },
  { name: "Jade Luxury", code: "JAD91", sop: /* @__PURE__ */ new Date("2027-06-01"), eop: /* @__PURE__ */ new Date("2033-08-31") },
  { name: "Kestrel Fleet", code: "KES02", sop: /* @__PURE__ */ new Date("2026-08-01"), eop: /* @__PURE__ */ new Date("2031-10-31") },
  { name: "Lumen Utility", code: "LUM12", sop: /* @__PURE__ */ new Date("2027-03-01"), eop: /* @__PURE__ */ new Date("2032-12-31") },
  { name: "Mirage Roadster", code: "MIR22", sop: /* @__PURE__ */ new Date("2026-12-01"), eop: /* @__PURE__ */ new Date("2032-11-30") },
  { name: "Nova EV", code: "NOV32", sop: /* @__PURE__ */ new Date("2027-05-01"), eop: /* @__PURE__ */ new Date("2034-01-31") },
  { name: "Orion Shuttle", code: "ORI42", sop: /* @__PURE__ */ new Date("2026-04-01"), eop: /* @__PURE__ */ new Date("2031-12-31") },
  { name: "Pioneer Wagon", code: "PIO52", sop: /* @__PURE__ */ new Date("2026-09-15"), eop: /* @__PURE__ */ new Date("2032-07-31") },
  { name: "Quasar Van", code: "QUA62", sop: /* @__PURE__ */ new Date("2027-01-01"), eop: /* @__PURE__ */ new Date("2033-09-30") },
  { name: "Radiant CUV", code: "RAD72", sop: /* @__PURE__ */ new Date("2026-06-01"), eop: /* @__PURE__ */ new Date("2032-02-28") },
  { name: "Stratus Sedan", code: "STR82", sop: /* @__PURE__ */ new Date("2026-10-15"), eop: /* @__PURE__ */ new Date("2032-12-31") },
  { name: "Titan Pickup", code: "TIT92", sop: /* @__PURE__ */ new Date("2027-02-15"), eop: /* @__PURE__ */ new Date("2033-10-31") }
];
var countriesSeedData = [
  { name: "Afghanistan", code: "AF" },
  { name: "Albania", code: "AL" },
  { name: "Algeria", code: "DZ" },
  { name: "American Samoa", code: "AS" },
  { name: "Andorra", code: "AD" },
  { name: "Angola", code: "AO" },
  { name: "Anguilla", code: "AI" },
  { name: "Antarctica", code: "AQ" },
  { name: "Antigua and Barbuda", code: "AG" },
  { name: "Argentina", code: "AR" },
  { name: "Armenia", code: "AM" },
  { name: "Aruba", code: "AW" },
  { name: "Australia", code: "AU" },
  { name: "Austria", code: "AT" },
  { name: "Azerbaijan", code: "AZ" },
  { name: "Bahamas", code: "BS" },
  { name: "Bahrain", code: "BH" },
  { name: "Bangladesh", code: "BD" },
  { name: "Barbados", code: "BB" },
  { name: "Belarus", code: "BY" },
  { name: "Belgium", code: "BE" },
  { name: "Belize", code: "BZ" },
  { name: "Benin", code: "BJ" },
  { name: "Bermuda", code: "BM" },
  { name: "Bhutan", code: "BT" },
  { name: "Bolivia", code: "BO" },
  { name: "Bosnia and Herzegovina", code: "BA" },
  { name: "Botswana", code: "BW" },
  { name: "Bouvet Island", code: "BV" },
  { name: "Brazil", code: "BR" },
  { name: "British Indian Ocean Territory", code: "IO" },
  { name: "Brunei Darussalam", code: "BN" },
  { name: "Bulgaria", code: "BG" },
  { name: "Burkina Faso", code: "BF" },
  { name: "Burundi", code: "BI" },
  { name: "Cambodia", code: "KH" },
  { name: "Cameroon", code: "CM" },
  { name: "Canada", code: "CA" },
  { name: "Cape Verde", code: "CV" },
  { name: "Cayman Islands", code: "KY" },
  { name: "Central African Republic", code: "CF" },
  { name: "Chad", code: "TD" },
  { name: "Chile", code: "CL" },
  { name: "China", code: "CN" },
  { name: "Christmas Island", code: "CX" },
  { name: "Cocos (Keeling) Islands", code: "CC" },
  { name: "Colombia", code: "CO" },
  { name: "Comoros", code: "KM" },
  { name: "Congo", code: "CG" },
  { name: "Congo, the Democratic Republic of the", code: "CD" },
  { name: "Cook Islands", code: "CK" },
  { name: "Costa Rica", code: "CR" },
  { name: "Cote d'Ivoire", code: "CI" },
  { name: "Croatia", code: "HR" },
  { name: "Cuba", code: "CU" },
  { name: "Cyprus", code: "CY" },
  { name: "Czech Republic", code: "CZ" },
  { name: "Denmark", code: "DK" },
  { name: "Djibouti", code: "DJ" },
  { name: "Dominica", code: "DM" },
  { name: "Dominican Republic", code: "DO" },
  { name: "Ecuador", code: "EC" },
  { name: "Egypt", code: "EG" },
  { name: "El Salvador", code: "SV" },
  { name: "Equatorial Guinea", code: "GQ" },
  { name: "Eritrea", code: "ER" },
  { name: "Estonia", code: "EE" },
  { name: "Ethiopia", code: "ET" },
  { name: "Falkland Islands (Malvinas)", code: "FK" },
  { name: "Faroe Islands", code: "FO" },
  { name: "Fiji", code: "FJ" },
  { name: "Finland", code: "FI" },
  { name: "France", code: "FR" },
  { name: "French Guiana", code: "GF" },
  { name: "French Polynesia", code: "PF" },
  { name: "French Southern Territories", code: "TF" },
  { name: "Gabon", code: "GA" },
  { name: "Gambia", code: "GM" },
  { name: "Georgia", code: "GE" },
  { name: "Germany", code: "DE" },
  { name: "Ghana", code: "GH" },
  { name: "Gibraltar", code: "GI" },
  { name: "Greece", code: "GR" },
  { name: "Greenland", code: "GL" },
  { name: "Grenada", code: "GD" },
  { name: "Guadeloupe", code: "GP" },
  { name: "Guam", code: "GU" },
  { name: "Guatemala", code: "GT" },
  { name: "Guernsey", code: "GG" },
  { name: "Guinea", code: "GN" },
  { name: "Guinea-Bissau", code: "GW" },
  { name: "Guyana", code: "GY" },
  { name: "Haiti", code: "HT" },
  { name: "Heard Island and McDonald Islands", code: "HM" },
  { name: "Holy See (Vatican City State)", code: "VA" },
  { name: "Honduras", code: "HN" },
  { name: "Hong Kong", code: "HK" },
  { name: "Hungary", code: "HU" },
  { name: "Iceland", code: "IS" },
  { name: "India", code: "IN" },
  { name: "Indonesia", code: "ID" },
  { name: "Iran, Islamic Republic of", code: "IR" },
  { name: "Iraq", code: "IQ" },
  { name: "Ireland", code: "IE" },
  { name: "Isle of Man", code: "IM" },
  { name: "Israel", code: "IL" },
  { name: "Italy", code: "IT" },
  { name: "Jamaica", code: "JM" },
  { name: "Japan", code: "JP" },
  { name: "Jersey", code: "JE" },
  { name: "Jordan", code: "JO" },
  { name: "Kazakhstan", code: "KZ" },
  { name: "Kenya", code: "KE" },
  { name: "Kiribati", code: "KI" },
  { name: "Korea, Democratic People's Republic of", code: "KP" },
  { name: "Korea, Republic of", code: "KR" },
  { name: "Kuwait", code: "KW" },
  { name: "Kyrgyzstan", code: "KG" },
  { name: "Lao People's Democratic Republic", code: "LA" },
  { name: "Latvia", code: "LV" },
  { name: "Lebanon", code: "LB" },
  { name: "Lesotho", code: "LS" },
  { name: "Liberia", code: "LR" },
  { name: "Libyan Arab Jamahiriya", code: "LY" },
  { name: "Liechtenstein", code: "LI" },
  { name: "Lithuania", code: "LT" },
  { name: "Luxembourg", code: "LU" },
  { name: "Macao", code: "MO" },
  { name: "North Macedonia", code: "MK" },
  { name: "Madagascar", code: "MG" },
  { name: "Malawi", code: "MW" },
  { name: "Malaysia", code: "MY" },
  { name: "Maldives", code: "MV" },
  { name: "Mali", code: "ML" },
  { name: "Malta", code: "MT" },
  { name: "Marshall Islands", code: "MH" },
  { name: "Martinique", code: "MQ" },
  { name: "Mauritania", code: "MR" },
  { name: "Mauritius", code: "MU" },
  { name: "Mayotte", code: "YT" },
  { name: "Mexico", code: "MX" },
  { name: "Micronesia, Federated States of", code: "FM" },
  { name: "Moldova, Republic of", code: "MD" },
  { name: "Monaco", code: "MC" },
  { name: "Mongolia", code: "MN" },
  { name: "Montenegro", code: "ME" },
  { name: "Montserrat", code: "MS" },
  { name: "Morocco", code: "MA" },
  { name: "Mozambique", code: "MZ" },
  { name: "Myanmar", code: "MM" },
  { name: "Namibia", code: "NA" },
  { name: "Nauru", code: "NR" },
  { name: "Nepal", code: "NP" },
  { name: "Netherlands", code: "NL" },
  { name: "New Caledonia", code: "NC" },
  { name: "New Zealand", code: "NZ" },
  { name: "Nicaragua", code: "NI" },
  { name: "Niger", code: "NE" },
  { name: "Nigeria", code: "NG" },
  { name: "Niue", code: "NU" },
  { name: "Norfolk Island", code: "NF" },
  { name: "Northern Mariana Islands", code: "MP" },
  { name: "Norway", code: "NO" },
  { name: "Oman", code: "OM" },
  { name: "Pakistan", code: "PK" },
  { name: "Palau", code: "PW" },
  { name: "Palestinian Territory, Occupied", code: "PS" },
  { name: "Panama", code: "PA" },
  { name: "Papua New Guinea", code: "PG" },
  { name: "Paraguay", code: "PY" },
  { name: "Peru", code: "PE" },
  { name: "Philippines", code: "PH" },
  { name: "Pitcairn", code: "PN" },
  { name: "Poland", code: "PL" },
  { name: "Portugal", code: "PT" },
  { name: "Puerto Rico", code: "PR" },
  { name: "Qatar", code: "QA" },
  { name: "Reunion", code: "RE" },
  { name: "Romania", code: "RO" },
  { name: "Russian Federation", code: "RU" },
  { name: "Rwanda", code: "RW" },
  { name: "Saint Helena", code: "SH" },
  { name: "Saint Kitts and Nevis", code: "KN" },
  { name: "Saint Lucia", code: "LC" },
  { name: "Saint Pierre and Miquelon", code: "PM" },
  { name: "Saint Vincent and the Grenadines", code: "VC" },
  { name: "Samoa", code: "WS" },
  { name: "San Marino", code: "SM" },
  { name: "Sao Tome and Principe", code: "ST" },
  { name: "Saudi Arabia", code: "SA" },
  { name: "Senegal", code: "SN" },
  { name: "Serbia", code: "RS" },
  { name: "Seychelles", code: "SC" },
  { name: "Sierra Leone", code: "SL" },
  { name: "Singapore", code: "SG" },
  { name: "Slovakia", code: "SK" },
  { name: "Slovenia", code: "SI" },
  { name: "Solomon Islands", code: "SB" },
  { name: "Somalia", code: "SO" },
  { name: "South Africa", code: "ZA" },
  { name: "South Georgia and the South Sandwich Islands", code: "GS" },
  { name: "South Sudan", code: "SS" },
  { name: "Spain", code: "ES" },
  { name: "Sri Lanka", code: "LK" },
  { name: "Sudan", code: "SD" },
  { name: "Suriname", code: "SR" },
  { name: "Svalbard and Jan Mayen", code: "SJ" },
  { name: "Swaziland", code: "SZ" },
  { name: "Sweden", code: "SE" },
  { name: "Switzerland", code: "CH" },
  { name: "Syrian Arab Republic", code: "SY" },
  { name: "Taiwan, Province of China", code: "TW" },
  { name: "Tajikistan", code: "TJ" },
  { name: "Tanzania, United Republic of", code: "TZ" },
  { name: "Thailand", code: "TH" },
  { name: "Timor-Leste", code: "TL" },
  { name: "Togo", code: "TG" },
  { name: "Tokelau", code: "TK" },
  { name: "Tonga", code: "TO" },
  { name: "Trinidad and Tobago", code: "TT" },
  { name: "Tunisia", code: "TN" },
  { name: "Turkey", code: "TR" },
  { name: "Turkmenistan", code: "TM" },
  { name: "Turks and Caicos Islands", code: "TC" },
  { name: "Tuvalu", code: "TV" },
  { name: "Uganda", code: "UG" },
  { name: "Ukraine", code: "UA" },
  { name: "United Arab Emirates", code: "AE" },
  { name: "United Kingdom", code: "GB" },
  { name: "United States", code: "US" },
  { name: "United States Minor Outlying Islands", code: "UM" },
  { name: "Uruguay", code: "UY" },
  { name: "Uzbekistan", code: "UZ" },
  { name: "Vanuatu", code: "VU" },
  { name: "Venezuela", code: "VE" },
  { name: "Viet Nam", code: "VN" },
  { name: "Virgin Islands, British", code: "VG" },
  { name: "Virgin Islands, U.S.", code: "VI" },
  { name: "Wallis and Futuna", code: "WF" },
  { name: "Western Sahara", code: "EH" },
  { name: "Yemen", code: "YE" },
  { name: "Zambia", code: "ZM" },
  { name: "Zimbabwe", code: "ZW" },
  { name: "Curacao", code: "CW" },
  { name: "Bonaire, Saint Eustatius and Saba", code: "BQ" },
  { name: "Sint Maarten (Dutch part)", code: "SX" },
  { name: "Kosovo", code: "XK" }
];
var buildSlug = (name, fallbackPrefix) => {
  const slug = slugifyValue(name);
  return slug.length ? slug : `${fallbackPrefix}-${(0, import_node_crypto.randomUUID)().slice(0, 8)}`;
};
async function getCountryMap(codes) {
  const countries = await prisma.country.findMany({
    where: { code: { in: Array.from(codes) } },
    select: { id: true, code: true }
  });
  const map = new Map(countries.map((country) => [country.code, country.id]));
  const missing = Array.from(codes).filter((code) => !map.has(code));
  if (missing.length) {
    throw new Error(`Missing countries for codes: ${missing.join(", ")}`);
  }
  return map;
}
async function seedPackagingMeanCategories() {
  for (const category of packagingMeanCategoriesSeedData) {
    const slug = buildSlug(category.name, "packaging");
    const existing = await prisma.packagingMeanCategory.findUnique({
      where: { slug },
      include: { image: { include: { image: true } } }
    });
    if (existing) {
      await prisma.packagingMeanCategory.update({
        where: { id: existing.id },
        data: { description: category.description, name: category.name }
      });
      if (!existing.image && category.imageUrl) {
        const image = await prisma.image.create({
          data: {
            imageUrl: category.imageUrl
          }
        });
        await prisma.packagingMeanCategoryImage.create({
          data: {
            packagingMeanCategoryId: existing.id,
            imageId: image.id
          }
        });
      }
      continue;
    }
    const created = await prisma.packagingMeanCategory.create({
      data: {
        name: category.name,
        description: category.description,
        slug
      }
    });
    if (category.imageUrl) {
      const image = await prisma.image.create({
        data: {
          imageUrl: category.imageUrl
        }
      });
      await prisma.packagingMeanCategoryImage.create({
        data: {
          packagingMeanCategoryId: created.id,
          imageId: image.id
        }
      });
    }
  }
  console.info(`Seeded/updated ${packagingMeanCategoriesSeedData.length} packaging mean categories.`);
}
var partFamilySeedNames = ["Bumper", "Tailgate", "Console", "Dashboard", "Door Panel", "Roof Rack", "Seat Frame", "Fascia", "Hood", "Trunk Lid"];
async function seedPartFamilies() {
  for (const name of partFamilySeedNames) {
    const slug = buildSlug(name, "family");
    await prisma.partFamily.upsert({
      where: { slug },
      create: {
        name,
        slug
      },
      update: {
        name
      }
    });
  }
  console.info(`Seeded/ensured ${partFamilySeedNames.length} part families.`);
}
var accessorySeedData = [
  { name: "Protective Cover", description: "Reusable weather cover", plantName: "Detroit Assembly", supplierName: "North Steel", unitPrice: 25 },
  { name: "Strap Kit", description: "Ratchet straps set", plantName: "Montreal Plastics", supplierName: "Maple Resin", unitPrice: 18 },
  { name: "Foam Insert", description: "Custom foam for fragile parts", plantName: "Queretaro Trim", supplierName: "Aztec Fasteners", unitPrice: 12 },
  { name: "Label Holder", description: "Magnetic label frame", plantName: "Barcelona Assembly", supplierName: "Catalunya Metals", unitPrice: 8 },
  { name: "Divider Set", description: "Adjustable dividers", plantName: "Lyon Composites", supplierName: "Rhone Textiles", unitPrice: 15 },
  { name: "Wheel Chock", description: "Rubber chock for carts", plantName: "Stuttgart Paint", supplierName: "Neckar Plast", unitPrice: 10 },
  { name: "Anti-Slip Mat", description: "Grip mat for trays", plantName: "Sao Paulo Molding", supplierName: "Paulista Coatings", unitPrice: 7 },
  { name: "Lid Clamp", description: "Clamp for plastic boxes", plantName: "Nagoya Plastics", supplierName: "Chubu Springs", unitPrice: 9 },
  { name: "Sensor Tag", description: "RFID tag holder", plantName: "Sydney Kitting", supplierName: "Harbour Composites", unitPrice: 14 },
  { name: "Corner Protector", description: "Edge protector set", plantName: "Shanghai Stamping", supplierName: "Pudong Fasteners", unitPrice: 11 }
];
var packagingImagePool = [
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e",
  "https://images.unsplash.com/photo-1489515217757-5fd1be406fef",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
  "https://images.unsplash.com/photo-1560464024-54c5c887c1bf",
  "https://images.unsplash.com/photo-1454165205744-3b78555e5572",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa",
  "https://images.unsplash.com/photo-1502877338535-766e1452684a",
  "https://images.unsplash.com/photo-1487730116645-74489c95b41b"
];
async function seedAccessories() {
  const plants = await prisma.plant.findMany({ select: { id: true, name: true } });
  const suppliers = await prisma.supplier.findMany({ select: { id: true, name: true } });
  const plantMap = new Map(plants.map((p) => [p.name, p.id]));
  const supplierMap = new Map(suppliers.map((s) => [s.name, s.id]));
  for (const acc of accessorySeedData) {
    const plantId = plantMap.get(acc.plantName);
    const supplierId = supplierMap.get(acc.supplierName || "");
    if (!plantId) continue;
    const slug = buildSlug(acc.name, "accessory");
    await retry(
      () => prisma.accessory.upsert({
        where: { plantId_slug: { plantId, slug } },
        create: {
          name: acc.name,
          slug,
          description: acc.description,
          unitPrice: acc.unitPrice ?? 0,
          plantId,
          supplierId: supplierId ?? null
        },
        update: {
          description: acc.description,
          unitPrice: acc.unitPrice ?? 0,
          supplierId: supplierId ?? null,
          plantId
        }
      })
    );
  }
  console.info(`Seeded/ensured ${accessorySeedData.length} accessories.`);
}
async function seedPackagingMeans() {
  const categories = await prisma.packagingMeanCategory.findMany();
  const plants = await prisma.plant.findMany();
  const flows = await prisma.flow.findMany();
  const suppliers = await prisma.supplier.findMany();
  const accessories = await prisma.accessory.findMany();
  const partFamilies = await prisma.partFamily.findMany();
  const projects = await prisma.project.findMany();
  if (!categories.length || !plants.length || !flows.length || !suppliers.length || !accessories.length || !partFamilies.length || !projects.length) {
    throw new Error("Missing required seed dependencies for packaging means.");
  }
  let packagingCreated = 0;
  for (const [categoryIndex, category] of categories.entries()) {
    for (let i = 0; i < 40; i++) {
      const name = `${category.name} ${String(i + 1).padStart(2, "0")}`;
      const plantIndex = (i + categoryIndex * 3) % plants.length;
      const plant = plants[plantIndex];
      const flow = flows[(i + categoryIndex + plantIndex) % flows.length];
      const supplier = suppliers[(i + categoryIndex) % suppliers.length];
      const price = 500 + i % 10 * 25;
      const width = 800 + i % 5 * 10;
      const length = 1200 + i % 7 * 15;
      const height = 1e3 + i % 4 * 20;
      const numberOfPackagings = 1 + i % 9;
      const sop = new Date(2026, i % 12, 1 + i % 27);
      const eop = new Date(sop);
      eop.setFullYear(eop.getFullYear() + 5);
      const packaging = await retry(
        () => prisma.packagingMean.upsert({
          where: {
            plantId_name_packagingMeanCategoryId: {
              plantId: plant.id,
              name,
              packagingMeanCategoryId: category.id
            }
          },
          update: {
            description: `Seeded ${category.name.toLowerCase()} packaging #${i + 1}`,
            price,
            width,
            length,
            height,
            numberOfPackagings,
            status: import_client.$Enums.PackagingStatus.ACTIVE,
            sop,
            eop,
            supplierId: supplier.id,
            flowId: flow.id
          },
          create: {
            name,
            description: `Seeded ${category.name.toLowerCase()} packaging #${i + 1}`,
            price,
            width,
            length,
            height,
            numberOfPackagings,
            status: import_client.$Enums.PackagingStatus.ACTIVE,
            sop,
            eop,
            supplierId: supplier.id,
            plantId: plant.id,
            flowId: flow.id,
            packagingMeanCategoryId: category.id
          }
        })
      );
      const images = Array.from({ length: 5 }, (_v, idx) => ({
        url: `${packagingImagePool[(i + idx) % packagingImagePool.length]}?auto=format&fit=crop&w=1200&q=80&sig=${category.slug}-${i}-${idx}`,
        sortOrder: idx
      }));
      for (const img of images) {
        await retry(async () => {
          const image = await prisma.image.create({ data: { imageUrl: img.url } });
          await ignoreDuplicate(
            prisma.packagingMeanImage.create({
              data: { packagingMeanId: packaging.id, imageId: image.id, sortOrder: img.sortOrder }
            })
          );
        });
      }
      const accessoryLinks = Array.from({ length: 2 }, (_v, a) => {
        const accessory = accessories[(i + a) % accessories.length];
        return { packagingMeanId: packaging.id, accessoryId: accessory.id, qtyPerPackaging: 1 + a % 3 };
      });
      await retry(() => prisma.packagingMeanAccessory.createMany({ data: accessoryLinks, skipDuplicates: true }));
      for (let p = 0; p < 2; p++) {
        const family = partFamilies[(i + p) % partFamilies.length];
        const project = projects[(i + p) % projects.length];
        const partName = `${category.name} Part ${p + 1} #${i + 1}`;
        const partSlug = buildSlug(`${partName}-${project.code}`, "part");
        const part = await retry(
          () => prisma.part.upsert({
            where: { projectId_slug: { projectId: project.id, slug: partSlug } },
            update: { name: partName, partFamilyId: family.id },
            create: {
              name: partName,
              slug: partSlug,
              partFamilyId: family.id,
              projectId: project.id
            }
          })
        );
        await retry(
          () => prisma.packagingMeanPart.upsert({
            where: { packagingMeanId_partId: { packagingMeanId: packaging.id, partId: part.id } },
            update: {
              partsPerPackaging: 1 + p % 4,
              levelsPerPackaging: 1 + p % 2,
              verticalPitch: 50 + p * 10,
              horizontalPitch: 40 + p * 8,
              notes: "Seeded part link"
            },
            create: {
              packagingMeanId: packaging.id,
              partId: part.id,
              partsPerPackaging: 1 + p % 4,
              levelsPerPackaging: 1 + p % 2,
              verticalPitch: 50 + p * 10,
              horizontalPitch: 40 + p * 8,
              notes: "Seeded part link"
            }
          })
        );
        const acc = accessories[(i + p + 1) % accessories.length];
        await retry(
          () => prisma.partAccessory.upsert({
            where: { partId_accessoryId: { partId: part.id, accessoryId: acc.id } },
            update: { qtyPerPart: 1 + p % 2 },
            create: { partId: part.id, accessoryId: acc.id, qtyPerPart: 1 + p % 2 }
          })
        );
      }
      packagingCreated += 1;
      await pauseEvery(packagingCreated, 50, 300);
    }
  }
  const extraPackagingSeeds = [
    { name: "Utility Cart Special A", categoryName: "Utility Cart", plantName: "Detroit Assembly", supplierName: "North Steel", flowSlug: "injection-to-assembly", price: 720, width: 850, length: 1250, height: 1020, numberOfPackagings: 3 },
    { name: "Utility Cart Special B", categoryName: "Utility Cart", plantName: "Barcelona Assembly", supplierName: "Catalunya Metals", flowSlug: "assembly-to-customer", price: 740, width: 860, length: 1260, height: 1030, numberOfPackagings: 4 },
    { name: "Kitting Cart Special A", categoryName: "Kitting Cart", plantName: "Montreal Plastics", supplierName: "Maple Resin", flowSlug: "injection-to-assembly", price: 780, width: 870, length: 1240, height: 980, numberOfPackagings: 5 },
    { name: "Kitting Cart Special B", categoryName: "Kitting Cart", plantName: "Stockholm Lines", supplierName: "Baltic Fasteners", flowSlug: "assembly-to-customer", price: 795, width: 880, length: 1255, height: 990, numberOfPackagings: 6 },
    { name: "Picking Cart Special A", categoryName: "Picking Cart", plantName: "Casablanca Interiors", supplierName: "Atlas Metals", flowSlug: "paint-to-assembly", price: 820, width: 840, length: 1230, height: 970, numberOfPackagings: 3 },
    { name: "Picking Cart Special B", categoryName: "Picking Cart", plantName: "Sydney Kitting", supplierName: "Harbour Composites", flowSlug: "assembly-to-customer", price: 845, width: 850, length: 1245, height: 975, numberOfPackagings: 4 },
    { name: "HD Rack Special A", categoryName: "HD Rack", plantName: "Lyon Composites", supplierName: "Rhone Textiles", flowSlug: "assembly-to-warehouse", price: 1250, width: 900, length: 1400, height: 1200, numberOfPackagings: 2 },
    { name: "HD Rack Special B", categoryName: "HD Rack", plantName: "Stuttgart Paint", supplierName: "Neckar Plast", flowSlug: "assembly-to-customer", price: 1300, width: 920, length: 1420, height: 1220, numberOfPackagings: 2 },
    { name: "Plastic Box Special", categoryName: "Plastic Box", plantName: "Nagoya Plastics", supplierName: "Chubu Springs", flowSlug: "injection-to-assembly", price: 310, width: 650, length: 900, height: 650, numberOfPackagings: 30 },
    { name: "Tallboy Special", categoryName: "Tallboy", plantName: "Shanghai Stamping", supplierName: "Pudong Fasteners", flowSlug: "assembly-to-customer", price: 980, width: 780, length: 1100, height: 1800, numberOfPackagings: 3 },
    { name: "Transtocker Hook Special", categoryName: "Transtocker Hook", plantName: "Queretaro Trim", supplierName: "Aztec Fasteners", flowSlug: "injection-to-assembly", price: 860, width: 760, length: 1080, height: 900, numberOfPackagings: 4 },
    { name: "Shopstock Hook Special", categoryName: "Shopstock Hook", plantName: "Manchester Modules", supplierName: "Pennine Glass", flowSlug: "assembly-to-warehouse", price: 840, width: 750, length: 1070, height: 880, numberOfPackagings: 5 },
    { name: "High Density Tower Special", categoryName: "High Density Tower", plantName: "Barcelona Assembly", supplierName: "Catalunya Metals", flowSlug: "assembly-to-customer", price: 2100, width: 950, length: 1350, height: 1900, numberOfPackagings: 1 },
    { name: "Utility Cart Coastal", categoryName: "Utility Cart", plantName: "Sydney Kitting", supplierName: "Harbour Composites", flowSlug: "paint-to-assembly", price: 765, width: 860, length: 1250, height: 1040, numberOfPackagings: 3 },
    { name: "Kitting Cart Atlas", categoryName: "Kitting Cart", plantName: "Casablanca Interiors", supplierName: "Atlas Metals", flowSlug: "assembly-to-warehouse", price: 810, width: 870, length: 1260, height: 1e3, numberOfPackagings: 4 }
  ];
  for (const [idx, seed] of extraPackagingSeeds.entries()) {
    const category = categories.find((c) => c.name === seed.categoryName);
    const plant = plants.find((p) => p.name === seed.plantName);
    const supplier = suppliers.find((s) => s.name === seed.supplierName);
    const flow = flows.find((f) => f.slug === seed.flowSlug) ?? flows[(idx + categories.length) % flows.length];
    if (!category || !plant || !flow || !supplier) continue;
    const name = seed.name;
    const packaging = await retry(
      () => prisma.packagingMean.upsert({
        where: {
          plantId_name_packagingMeanCategoryId: {
            plantId: plant.id,
            name,
            packagingMeanCategoryId: category.id
          }
        },
        update: {
          description: `${seed.categoryName} special seed`,
          price: seed.price,
          width: seed.width,
          length: seed.length,
          height: seed.height,
          numberOfPackagings: seed.numberOfPackagings,
          status: import_client.$Enums.PackagingStatus.ACTIVE,
          sop: /* @__PURE__ */ new Date("2027-01-01"),
          eop: /* @__PURE__ */ new Date("2032-01-01"),
          supplierId: supplier.id,
          flowId: flow.id
        },
        create: {
          name,
          description: `${seed.categoryName} special seed`,
          price: seed.price,
          width: seed.width,
          length: seed.length,
          height: seed.height,
          numberOfPackagings: seed.numberOfPackagings,
          status: import_client.$Enums.PackagingStatus.ACTIVE,
          sop: /* @__PURE__ */ new Date("2027-01-01"),
          eop: /* @__PURE__ */ new Date("2032-01-01"),
          supplierId: supplier.id,
          plantId: plant.id,
          flowId: flow.id,
          packagingMeanCategoryId: category.id
        }
      })
    );
    const imageUrl = `${packagingImagePool[(idx + 2) % packagingImagePool.length]}?auto=format&fit=crop&w=1200&q=80&sig=special-${idx}`;
    const image = await prisma.image.create({ data: { imageUrl } });
    await ignoreDuplicate(
      prisma.packagingMeanImage.create({
        data: { packagingMeanId: packaging.id, imageId: image.id, sortOrder: 0 }
      })
    );
    const accessoryLinks = accessories.slice(idx % accessories.length, idx % accessories.length + 2).map((a, aIdx) => ({
      packagingMeanId: packaging.id,
      accessoryId: a.id,
      qtyPerPackaging: 1 + aIdx % 2
    }));
    if (accessoryLinks.length) {
      await prisma.packagingMeanAccessory.createMany({ data: accessoryLinks, skipDuplicates: true });
    }
    const family = partFamilies[(idx + 1) % partFamilies.length];
    const project = projects[(idx + 2) % projects.length];
    const partName = `${seed.categoryName} Special Part ${idx + 1}`;
    const partSlug = buildSlug(`${partName}-${project.code}`, "part");
    const part = await prisma.part.upsert({
      where: { projectId_slug: { projectId: project.id, slug: partSlug } },
      update: { name: partName, partFamilyId: family.id },
      create: { name: partName, slug: partSlug, partFamilyId: family.id, projectId: project.id }
    });
    await prisma.packagingMeanPart.upsert({
      where: { packagingMeanId_partId: { packagingMeanId: packaging.id, partId: part.id } },
      update: { partsPerPackaging: 2, levelsPerPackaging: 1, verticalPitch: 55, horizontalPitch: 45, notes: "Special seed link" },
      create: { packagingMeanId: packaging.id, partId: part.id, partsPerPackaging: 2, levelsPerPackaging: 1, verticalPitch: 55, horizontalPitch: 45, notes: "Special seed link" }
    });
    packagingCreated += 1;
  }
  console.info(`Seeded ${packagingCreated} packaging means with parts, accessories, and images.`);
}
async function seedTransportMeanCategories() {
  for (const category of transportMeanCategoriesSeedData) {
    const slug = buildSlug(category.name, "transport");
    const existing = await prisma.transportMeanCategory.findUnique({
      where: { slug },
      include: { image: { include: { image: true } } }
    });
    if (existing) {
      await prisma.transportMeanCategory.update({
        where: { id: existing.id },
        data: { description: category.description }
      });
      if (!existing.image && category.imageUrl) {
        const image = await prisma.image.create({
          data: {
            imageUrl: category.imageUrl
          }
        });
        await prisma.transportMeanCategoryImage.create({
          data: {
            transportMeanCategoryId: existing.id,
            imageId: image.id
          }
        });
      }
      continue;
    }
    const created = await prisma.transportMeanCategory.create({
      data: {
        name: category.name,
        description: category.description,
        slug
      }
    });
    if (category.imageUrl) {
      const image = await prisma.image.create({
        data: {
          imageUrl: category.imageUrl
        }
      });
      await prisma.transportMeanCategoryImage.create({
        data: {
          transportMeanCategoryId: created.id,
          imageId: image.id
        }
      });
    }
  }
  console.info(`Seeded/updated ${transportMeanCategoriesSeedData.length} transport mean categories.`);
}
async function seedTransportMeans() {
  const plantMap = /* @__PURE__ */ new Map();
  const plants = await prisma.plant.findMany({ select: { id: true, name: true } });
  plants.forEach((p) => plantMap.set(p.name, p.id));
  const supplierMap = /* @__PURE__ */ new Map();
  const suppliers = await prisma.supplier.findMany({ select: { id: true, name: true } });
  suppliers.forEach((s) => supplierMap.set(s.name, s.id));
  const categoryMap = /* @__PURE__ */ new Map();
  const categories = await prisma.transportMeanCategory.findMany({ select: { id: true, name: true, slug: true } });
  categories.forEach((c) => categoryMap.set(c.name, c.id));
  const packagingMap = /* @__PURE__ */ new Map();
  const packagingMeans = await prisma.packagingMean.findMany({ select: { id: true, name: true } });
  packagingMeans.forEach((pm) => packagingMap.set(pm.name, pm.id));
  const flows = await prisma.flow.findMany({ select: { id: true, slug: true } });
  const flowMap = new Map(flows.map((f) => [f.slug, f]));
  let created = 0;
  for (const seed of transportMeansSeedData) {
    const plantId = plantMap.get(seed.plantName);
    const categoryId = categoryMap.get(seed.categoryName);
    const supplierId = seed.supplierName ? supplierMap.get(seed.supplierName) : void 0;
    if (!plantId || !categoryId) continue;
    const slug = buildSlug(seed.name, "transport");
    const packagingLinks = (seed.packagingMeanNames ?? []).map((name, idx) => ({
      packagingMeanId: packagingMap.get(name),
      maxQty: 1 + idx % 3
    })).filter((l) => Boolean(l.packagingMeanId));
    const primaryFlow = (seed.flowSlug ? flowMap.get(seed.flowSlug) : void 0) ?? flows[(created + seed.name.length) % flows.length] ?? flows[0];
    const secondaryFlow = (seed.secondaryFlowSlug ? flowMap.get(seed.secondaryFlowSlug) : void 0) ?? flows[(created + seed.name.length + 1) % flows.length] ?? primaryFlow;
    const tm = await prisma.transportMean.upsert({
      where: { slug },
      update: {
        description: `Seeded ${seed.categoryName.toLowerCase()} transport mean`,
        transportMeanCategoryId: categoryId,
        supplierId: supplierId ?? null,
        plantId,
        loadCapacityKg: seed.loadCapacityKg,
        units: seed.units,
        cruiseSpeedKmh: seed.cruiseSpeedKmh,
        maxSpeedKmh: seed.maxSpeedKmh,
        sop: seed.sop,
        eop: seed.eop,
        packagingLinks: {
          deleteMany: {},
          create: packagingLinks.map((l) => ({
            packagingMeanId: l.packagingMeanId,
            maxQty: l.maxQty
          }))
        }
      },
      create: {
        name: seed.name,
        slug,
        description: `Seeded ${seed.categoryName.toLowerCase()} transport mean`,
        transportMeanCategoryId: categoryId,
        supplierId: supplierId ?? null,
        plantId,
        loadCapacityKg: seed.loadCapacityKg,
        units: seed.units,
        cruiseSpeedKmh: seed.cruiseSpeedKmh,
        maxSpeedKmh: seed.maxSpeedKmh,
        sop: seed.sop,
        eop: seed.eop,
        packagingLinks: packagingLinks.length ? {
          create: packagingLinks.map((l) => ({
            packagingMeanId: l.packagingMeanId,
            maxQty: l.maxQty
          }))
        } : void 0
      }
    });
    created += 1;
    await prisma.transportMeanFlow.deleteMany({ where: { transportMeanId: tm.id } });
    await prisma.transportMeanFlow.createMany({
      data: [
        { transportMeanId: tm.id, flowId: primaryFlow.id },
        secondaryFlow && secondaryFlow.id !== primaryFlow.id ? { transportMeanId: tm.id, flowId: secondaryFlow.id } : null
      ].filter(Boolean),
      skipDuplicates: true
    });
    await pauseEvery(created, 50, 300);
  }
  console.info(`Seeded ${created} transport means.`);
}
async function seedStorageMeanCategories() {
  for (const category of storageMeanCategoriesSeedData) {
    const slug = buildSlug(category.name, "storage");
    const existing = await prisma.storageMeanCategory.findUnique({
      where: { slug },
      include: { image: { include: { image: true } } }
    });
    if (existing) {
      await prisma.storageMeanCategory.update({
        where: { id: existing.id },
        data: {
          description: category.description
        }
      });
      if (!existing.image && category.imageUrl) {
        const image = await prisma.image.create({
          data: {
            imageUrl: category.imageUrl
          }
        });
        await prisma.storageMeanCategoryImage.create({
          data: {
            storageMeanCategoryId: existing.id,
            imageId: image.id
          }
        });
      }
      continue;
    }
    const created = await prisma.storageMeanCategory.create({
      data: {
        name: category.name,
        description: category.description,
        slug
      }
    });
    if (category.imageUrl) {
      const image = await prisma.image.create({
        data: {
          imageUrl: category.imageUrl
        }
      });
      await prisma.storageMeanCategoryImage.create({
        data: {
          storageMeanCategoryId: created.id,
          imageId: image.id
        }
      });
    }
  }
  console.info(`Seeded/updated ${storageMeanCategoriesSeedData.length} storage mean categories.`);
}
async function seedFlows() {
  await prisma.flow.createMany({
    data: flowSeedData.map((flow) => ({
      slug: flow.slug,
      from: flow.from,
      to: flow.to
    })),
    skipDuplicates: true
  });
  console.info(`Seeded ${flowSeedData.length} flows.`);
}
async function seedUsers() {
  for (const user of usersSeedData) {
    const passwordHash = await bcryptjs_default.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, passwordHash, birthDate: user.birthDate },
      create: {
        email: user.email,
        name: user.name,
        passwordHash,
        birthDate: user.birthDate
      }
    });
  }
}
async function seedPlants() {
  try {
    const countryCodes = new Set(plantSeedData.map((plant) => plant.address.countryCode));
    const countryMap = await getCountryMap(countryCodes);
    const existingPlants = await prisma.plant.findMany({ select: { id: true, name: true } });
    const existingPlantMap = new Map(existingPlants.map((p) => [p.name, p.id]));
    for (const plant of plantSeedData) {
      if (existingPlantMap.has(plant.name)) continue;
      const countryId = countryMap.get(plant.address.countryCode);
      await prisma.plant.create({
        data: {
          name: plant.name,
          address: {
            create: {
              street: plant.address.street,
              city: plant.address.city,
              zipcode: plant.address.zipcode,
              countryId
            }
          }
        }
      });
    }
    console.info(`Seeded ${plantSeedData.length} plants with addresses.`);
  } catch (error) {
    if (error instanceof import_library.PrismaClientKnownRequestError && error.code === "P2021" || error && error.code === "P2021") {
      console.warn("Skipping plant seeds; Plant/Address/Country table missing.");
      return;
    }
    throw error;
  }
}
async function seedSuppliers() {
  try {
    const allowedCountries = new Set(plantSeedData.map((plant) => plant.address.countryCode));
    const supplierCodes = new Set(supplierSeedData.map((supplier) => supplier.address.countryCode));
    const invalidCodes = Array.from(supplierCodes).filter((code) => !allowedCountries.has(code));
    if (invalidCodes.length) {
      throw new Error(`Supplier country codes not in plant seeds: ${invalidCodes.join(", ")}`);
    }
    const countryMap = await getCountryMap(supplierCodes);
    const existingSuppliers = await prisma.supplier.findMany({ select: { id: true, name: true } });
    const existingSupplierMap = new Map(existingSuppliers.map((s) => [s.name, s.id]));
    for (const supplier of supplierSeedData) {
      if (existingSupplierMap.has(supplier.name)) continue;
      const countryId = countryMap.get(supplier.address.countryCode);
      await prisma.supplier.create({
        data: {
          name: supplier.name,
          address: {
            create: {
              street: supplier.address.street,
              city: supplier.address.city,
              zipcode: supplier.address.zipcode,
              countryId
            }
          }
        }
      });
    }
    console.info(`Seeded ${supplierSeedData.length} suppliers with addresses.`);
  } catch (error) {
    if (error instanceof import_library.PrismaClientKnownRequestError && error.code === "P2021" || error && error.code === "P2021") {
      console.warn("Skipping supplier seeds; Supplier/Address/Country table missing.");
      return;
    }
    throw error;
  }
}
async function seedStorageMeans() {
  const plantMap = /* @__PURE__ */ new Map();
  const plants = await prisma.plant.findMany({ select: { id: true, name: true } });
  plants.forEach((plant) => plantMap.set(plant.name, plant.id));
  const supplierMap = /* @__PURE__ */ new Map();
  const suppliers = await prisma.supplier.findMany({ select: { id: true, name: true } });
  suppliers.forEach((supplier) => supplierMap.set(supplier.name, supplier.id));
  const flowMap = /* @__PURE__ */ new Map();
  const flows = await prisma.flow.findMany({ select: { id: true, slug: true } });
  flows.forEach((flow) => flowMap.set(flow.slug, flow.id));
  const storageMeanCategoryMap = /* @__PURE__ */ new Map();
  const storageMeanCategories = await prisma.storageMeanCategory.findMany({ select: { id: true, name: true } });
  storageMeanCategories.forEach((category) => storageMeanCategoryMap.set(category.name, category.id));
  for (const storage of storageMeansSeedData) {
    const status = storage.status;
    const plantId = plantMap.get(storage.plantName);
    const flowId = flowMap.get(storage.flowSlug);
    const supplierId = storage.supplierName ? supplierMap.get(storage.supplierName) ?? null : null;
    const storageMeanCategoryId = storageMeanCategoryMap.get(storage.storageMeanCategoryName);
    if (!plantId) throw new Error(`Missing plant for storage mean seed: ${storage.plantName}`);
    if (!flowId) throw new Error(`Missing flow for storage mean seed: ${storage.flowSlug}`);
    if (!storageMeanCategoryId) throw new Error(`Missing storage mean category for storage mean seed: ${storage.storageMeanCategoryName}`);
    const storageMean = await prisma.storageMean.upsert({
      where: {
        plantId_name_storageMeanCategoryId: {
          plantId,
          name: storage.name,
          storageMeanCategoryId
        }
      },
      update: {
        description: storage.description,
        status,
        price: storage.price,
        plantId,
        supplierId,
        heightMm: storage.heightMm ?? 0,
        usefulSurfaceM2: storage.usefulSurfaceM2 ?? 0,
        grossSurfaceM2: storage.grossSurfaceM2 ?? 0,
        sop: storage.sop,
        eop: storage.eop,
        storageMeanCategoryId
      },
      create: {
        name: storage.name,
        description: storage.description,
        status,
        price: storage.price,
        plantId,
        supplierId,
        heightMm: storage.heightMm ?? 0,
        usefulSurfaceM2: storage.usefulSurfaceM2 ?? 0,
        grossSurfaceM2: storage.grossSurfaceM2 ?? 0,
        sop: storage.sop,
        eop: storage.eop,
        storageMeanCategoryId
      },
      select: { id: true }
    });
    if (storage.imageUrl) {
      const existingImage = await prisma.image.findFirst({ where: { imageUrl: storage.imageUrl } });
      const image = existingImage ?? await prisma.image.create({
        data: {
          id: (0, import_node_crypto.randomUUID)(),
          imageUrl: storage.imageUrl
        }
      });
      await prisma.storageMeanImage.upsert({
        where: { storageMeanId_imageId: { storageMeanId: storageMean.id, imageId: image.id } },
        update: {},
        create: { storageMeanId: storageMean.id, imageId: image.id, sortOrder: 0 }
      });
    }
    await prisma.storageMeanFlow.createMany({
      data: [
        {
          storageMeanId: storageMean.id,
          flowId,
          sortOrder: 0
        }
      ],
      skipDuplicates: true
    });
    if (storage.lanes?.length) {
      const laneGroupName = "Default";
      const existingLaneGroup = await prisma.laneGroup.findFirst({
        where: { storageMeanId: storageMean.id, name: laneGroupName }
      });
      const laneGroup = existingLaneGroup ?? await prisma.laneGroup.create({
        data: {
          storageMeanId: storageMean.id,
          name: laneGroupName,
          description: "Seeded lane group"
        }
      });
      await prisma.lane.deleteMany({ where: { laneGroupId: laneGroup.id } });
      for (const lane of storage.lanes) {
        await prisma.lane.create({
          data: {
            laneGroupId: laneGroup.id,
            lengthMm: lane.length,
            widthMm: lane.width,
            heightMm: lane.height,
            numberOfLanes: lane.quantity
          }
        });
      }
    }
  }
  console.info(`Upserted ${storageMeansSeedData.length} storage means.`);
}
async function seedProjects() {
  await prisma.project.createMany({
    data: projectSeedData.map((project) => ({
      ...project,
      slug: buildSlug(project.name, "project")
    })),
    skipDuplicates: true
  });
  console.info(`Seeded ${projectSeedData.length} projects.`);
}
async function seedCountries() {
  try {
    await prisma.country.createMany({ data: countriesSeedData, skipDuplicates: true });
    console.info(`Seeded ${countriesSeedData.length} countries.`);
  } catch (error) {
    if (error instanceof import_library.PrismaClientKnownRequestError && error.code === "P2021" || error && error.code === "P2021") {
      console.warn("Skipping country seeds; Country table missing.");
      return;
    }
    throw error;
  }
}
async function main() {
  await seedCountries();
  await seedPlants();
  await seedSuppliers();
  await seedFlows();
  await seedUsers();
  await seedStorageMeanCategories();
  await seedStorageMeans();
  await seedProjects();
  await seedPackagingMeanCategories();
  await seedPartFamilies();
  await seedAccessories();
  await seedPackagingMeans();
  await seedTransportMeanCategories();
  await seedTransportMeans();
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
