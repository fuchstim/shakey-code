import enc from './encode';
import dec from './decode';
import decv2 from './decode-v2';

export function encode(...args) { return enc(...args); }

export function decode(...args) { return dec(...args); };

export function decodeV2(...args) { return decv2(...args); }
