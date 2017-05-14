# node-timed-stream
[![Build Status](https://travis-ci.org/TinyMan/node-timed-stream.svg?branch=master)](https://travis-ci.org/TinyMan/node-timed-stream)
[![codecov](https://codecov.io/gh/TinyMan/node-timed-stream/branch/master/graph/badge.svg)](https://codecov.io/gh/TinyMan/node-timed-stream)
[![Dependency Status](https://david-dm.org/TinyMan/node-timed-stream.svg)](https://david-dm.org/TinyMan/node-timed-stream)
[![devDependencies](https://david-dm.org/TinyMan/node-timed-stream/dev-status.svg)](https://david-dm.org/TinyMan/node-timed-stream?type=dev)
[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/TinyMan/node-timed-stream/issues)

Yet another timed stream package. Mostly an exercise.

This module offers features similar to `node-throttle` and `node-brake`: throttle a stream with time constraints (rate and period at which it emits data)
There is one more feature that this package provide: ability to pause the stream.

The rate can be adjusted on the fly.

Internally it uses backpressure to ensure the rate and period are constant. 
It also uses a passthrough stream in paused mode and reads to it at the given rate & period.

# Examples
```javascript
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
```
For more insight please take a look at tests

# Installing
To install via git and run tests:
```
git clone https://github.com/TinyMan/node-timed-stream.git
cd node-timed-stream
npm install
npm test
```
# Methods
