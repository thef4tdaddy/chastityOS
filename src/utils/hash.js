/*
 * [js-sha256]{@link https://github.com/emn178/js-sha256}
 *
 * @version 0.11.0
 * @author Chen, Yi-Cyuan [emn178@gmail.com]
 * @copyright Chen, Yi-Cyuan 2014-2024
 * @license MIT
 */
/* eslint-disable */
(function () {
  'use strict';

  var ERROR = 'input is invalid type';
  var FINALIZE = 'finalize already called';
  var INPUT_ERROR = 'input must be a string, a Uint8Array, a Buffer, or an ArrayBuffer';

  var H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  var K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  var ROOT = typeof window === 'object' ? window : {};
  var Z = typeof Uint8Array !== 'undefined';
  var M = typeof BigInt !== 'undefined';
  var W = M ? BigInt(0) : 0;
  var st = M ? BigInt(32) : 32;

  var Sha256 = function () {
    var h = H.slice();
    var k = K.slice();
    var o = new Int32Array(64);
    var u = new Array(8);
    var a = new Array(8);

    var R = function (x, y) {
      if (M) {
        return (x << y) | (x >> (st - y));
      } else {
        var d = x << y;
        var r = x >>> (32 - y);
        return d | r;
      }
    };

    var nt = function (x, y) {
      if (M) {
        return x >> y;
      } else {
        return x >>> y;
      }
    };

    var S = function (x, y, z) {
      return (x & y) ^ (x & z) ^ (y & z);
    };

    var et = function (x, y, z) {
      return (x & y) ^ (~x & z);
    };

    var T = function (x) {
      return R(x, W) ^ R(x, 13) ^ R(x, 22);
    };

    var A = function (x) {
      return R(x, 6) ^ R(x, 11) ^ R(x, 25);
    };

    var it = function (x) {
      return R(x, 7) ^ R(x, 18) ^ nt(x, 3);
    };

    var ot = function (x) {
      return R(x, 17) ^ R(x, 19) ^ nt(x, 10);
    };

    var L = function (a, b) {
      if (M) {
        return (a + b) & 0xFFFFFFFFn;
      } else {
        return (a + b) | 0;
      }
    };

    var O = function (message) {
      var v, C, i, j;
      var l = message.length;
      for (v = 0; v < 8; ++v) {
        u[v] = h[v];
      }
      for (i = 0; i < l; i += 16) {
        for (j = 0; j < 16; j++) {
          o[j] = message[i + j];
        }
        for (j = 16; j < 64; j++) {
          C = L(ot(o[j - 2]), o[j - 7]);
          C = L(C, it(o[j - 15]));
          o[j] = L(C, o[j - 16]);
        }
        for (j = 0; j < 64; j++) {
          C = L(L(L(L(o[j], k[j]), u[7]), A(u[4])), et(u[4], u[5], u[6]));
          v = L(T(u[0]), S(u[0], u[1], u[2]));
          u[7] = u[6];
          u[6] = u[5];
          u[5] = u[4];
          u[4] = L(u[3], C);
          u[3] = u[2];
          u[2] = u[1];
          u[1] = u[0];
          u[0] = L(C, v);
        }
        for (j = 0; j < 8; j++) {
          h[j] = L(h[j], u[j]);
        }
      }
    };

    var P = function () {
      this.finalized = false;
      this.message = [];
      this.length = 0;
      this.start();
    };
    P.prototype = {
      start: function () {
        this.finalized = false;
        this.message = [];
        for (var i = 0; i < 8; i++) {
          h[i] = H[i];
        }
      },
      update: function (message) {
        if (this.finalized) {
          throw new Error(FINALIZE);
        }
        var m, l = message.length;
        if (typeof message === 'string') {
          m = [];
          for (var i = 0; i < l; i++) {
            var c = message.charCodeAt(i);
            if (c < 128) {
              m.push(c);
            } else if (c < 2048) {
              m.push(192 | c >> 6, 128 | c & 63);
            } else if (c < 55296 || c >= 57344) {
              m.push(224 | c >> 12, 128 | c >> 6 & 63, 128 | c & 63);
            } else {
              c = 65536 + ((c & 1023) << 10 | message.charCodeAt(++i) & 1023);
              m.push(240 | c >> 18, 128 | c >> 12 & 63, 128 | c >> 6 & 63, 128 | c & 63);
            }
          }
        } else if (Z && message instanceof Uint8Array) {
          m = Array.prototype.slice.call(message);
        } else {
          throw new Error(INPUT_ERROR);
        }
        for (var j = 0; j < m.length; j++) {
            this.message.push(m[j]);
        }
        this.length += l;
        while (this.message.length >= 64) {
          var r = this.message.splice(0, 64);
          for (var k = 0; k < 16; k++) {
            o[k] = (r[k * 4] << 24) | (r[k * 4 + 1] << 16) | (r[k * 4 + 2] << 8) | r[k * 4 + 3];
          }
          O(o);
        }
        return this;
      },
      finalize: function () {
        if (this.finalized) {
          return;
        }
        this.finalized = true;
        var m = this.message, l = this.length;
        m.push(128);
        var i = (64 - (l + 9) % 64) % 64;
        for (var j = 0; j < i; j++) {
          m.push(0);
        }
        if (M) {
          var I = BigInt(l) << 3n;
          m.push(Number((I >> 56n) & 255n));
          m.push(Number((I >> 48n) & 255n));
          m.push(Number((I >> 40n) & 255n));
          m.push(Number((I >> 32n) & 255n));
          m.push(Number((I >> 24n) & 255n));
          m.push(Number((I >> 16n) & 255n));
          m.push(Number((I >> 8n) & 255n));
          m.push(Number(I & 255n));
        } else {
          l <<= 3;
          m.push(0, 0, 0, 0, 0, Math.floor(l / 4294967296), Math.floor(l / 16777216) % 256, Math.floor(l / 65536) % 256, Math.floor(l / 256) % 256, l % 256);
        }
        while (m.length >= 64) {
          var r = m.splice(0, 64);
          for (var k = 0; k < 16; k++) {
            o[k] = (r[k * 4] << 24) | (r[k * 4 + 1] << 16) | (r[k * 4 + 2] << 8) | r[k * 4 + 3];
          }
          O(o);
        }
      },
      hex: function () {
        this.finalize();
        var result = '';
        for (var i = 0; i < 8; i++) {
          result += ('00000000' + h[i].toString(16)).slice(-8);
        }
        return result;
      },
      toString: P.prototype.hex,
    };
    return new P();
  };
  var sha256 = function (message) {
    var s = Sha256();
    s.update(message);
    return s.hex();
  };
  ROOT.sha256 = sha256;
}());


// --- ChastityOS Wrapper Functions ---
/**
 * Hashes a string using the self-contained SHA256 logic.
 * @param {string} data The plaintext data to hash.
 * @returns {string} The resulting SHA256 hash.
 */
export function hash(data) {
  if (typeof data !== 'string') return '';
  // 'sha256' is now a globally available function from the code above.
  return window.sha256(data);
}

/**
 * Verifies plaintext data against a stored SHA256 hash.
 * @param {string} data The plaintext data to verify.
 * @param {string} storedHash The hash to compare against.
 * @returns {boolean} True if the data matches the hash, false otherwise.
 */
export function verify(data, storedHash) {
  if (typeof data !== 'string' || !storedHash) {
    return false;
  }
  return window.sha256(data) === storedHash;
}

// Maintaining the old export names for any part of the app that might still use them.
export { hash as hashPassword };
export { verify as verifyPassword };
