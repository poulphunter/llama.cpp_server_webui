'use strict';
'use strict';

import forge from 'node-forge';
import { Buffer } from 'buffer';
import { ENCRYPT_KEY } from './Config.ts';

export class Crypt {
  key = ENCRYPT_KEY;

  stringToHex(str: string): string {
    let hex = '';
    for (let i = 0; i < str.length; i++) {
      // Get the ASCII value of the character
      const asciiValue = str.charCodeAt(i);

      // Convert the ASCII value to a hexadecimal string and pad with leading zeros if necessary
      const hexValue = asciiValue.toString(16).padStart(2, '0');

      // Append the hexadecimal value to the result string
      hex += hexValue;
    }
    return hex.toLowerCase(); // Convert to uppercase for consistency
  }

  hexToString(hexString: string): string {
    let str = '';
    for (let i = 0; i < hexString.length; i += 2) {
      // Get the hexadecimal pair
      const hexPair = hexString.substring(i, i + 2);

      // Convert the hexadecimal pair to a decimal number
      const decimalValue = parseInt(hexPair, 16);

      // Convert the decimal number to a character
      const char = String.fromCharCode(decimalValue);

      // Append the character to the result string
      str += char;
    }
    return str;
  }

  encrypt(data: string): string {
    try {
      const key = forge.util.createBuffer(Buffer.from(this.key, 'hex'));
      const iv = forge.random.getBytesSync(16);
      const cipher = forge.cipher.createCipher('AES-GCM', key);
      cipher.start({
        iv: iv, // should be a 12-byte binary-encoded string or byte buffer
        // additionalData: "binary-encoded string", // optional
        tagLength: 128, // optional, defaults to 128 bits
      });
      cipher.update(forge.util.createBuffer(forge.util.encodeUtf8(data)));
      cipher.finish();
      const encrypted = cipher.output;
      const tag = cipher.mode.tag;
      const ivh = this.stringToHex(iv);
      return ivh + tag.toHex() + encrypted.toHex();
    } catch (err) {
      console.log(err);
    }
    return '';
  }

  decrypt(data: string): string {
    try {
      const key = forge.util.createBuffer(Buffer.from(this.key, 'hex'));
      const ivh = data.substring(0, 32);
      const iv = this.hexToString(ivh);
      data = data.substring(32);
      const tagh = data.substring(0, 32);
      const tag = forge.util.createBuffer(Buffer.from(tagh, 'hex'));
      data = data.substring(32);
      const data2 = forge.util.createBuffer(Buffer.from(data, 'hex'));

      const decipher = forge.cipher.createDecipher('AES-GCM', key);
      decipher.start({
        iv: iv,
        // additionalData: "binary-encoded string", // optional
        tagLength: 128, // optional, defaults to 128 bits
        tag: tag, // authentication tag from encryption
      });
      decipher.update(data2);
      const pass = decipher.finish();
      // pass is false if there was a failure (eg: authentication tag didn't match)
      if (pass) {
        return forge.util.decodeUtf8(decipher.output.data);
      }
    } catch (err) {
      console.log(err);
    }
    return '';
  }
}
