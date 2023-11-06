'use strict';
import dotenv from 'dotenv';

dotenv.config();


import {networkInterfaces} from 'os'

const nets : any = networkInterfaces();
let results : any[] = [] // Or just '{}', an empty object

if (nets) {
    
for (const name of Object.keys(nets)) {
  if (!name || !nets || !nets[name] || nets[name] == undefined)
    continue;
    for (const net of nets[name]) {
        if (!net || !net.address || !net.family){
            continue
        }
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
        const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
        if (net.family === familyV4Value && !net.internal) {
            results.push(net.address);
        }
    }
}
}
results = results.map((ip) => 'http://'+ip+ ':' + process.env['FRONTEND_PORT'])
results.push('http://localhost:' + process.env['FRONTEND_PORT']);

export default results