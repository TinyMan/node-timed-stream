/* eslint no-console: "off" */

const fs = require('fs')
const TimedStream = require('../')

console.log("Reading file rate.js at constant rate of 10bps with a period of 1 seconds between each data burst")

const t = new TimedStream({
	rate: 10 /* 1 byte per second */,
	period: 1000 /* try to emit data every 1000 ms */
})

let c = 0 // counting data length
t.on('data', data => {
	c += data.length
	console.log(data.toString())
})
t.on('end', () => {
	console.log("Total length: " + c)
})

fs.createReadStream('./rate.js').pipe(t)