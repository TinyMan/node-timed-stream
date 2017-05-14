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
# JSDoc

## TimedStream
A TimedStream allow data to passthrough at a given rate and pause/resume at any time

**Kind**: global class

* [TimedStream](#TimedStream)
    * [new TimedStream([options])](#new_TimedStream_new)
    * [.rate](#TimedStream+rate) : <code>number</code>
    * [.period](#TimedStream+period) : <code>number</code>
    * [.streamPaused](#TimedStream+streamPaused) : <code>boolean</code>
    * [.totalTime](#TimedStream+totalTime) : <code>number</code>
    * [.pauseStream()](#TimedStream+pauseStream)
    * [.resumeStream()](#TimedStream+resumeStream)

<a name="new_TimedStream_new"></a>

### new TimedStream([options])
Creates an instance of TimedStream.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>object</code> |  | Options forwarder to Stream.Transform ctor |
| [options.rate] | <code>number</code> | <code>0</code> | Bytes per seconds (0: unlimited) |
| [options.period] | <code>number</code> | <code>100</code> | Time between data event in ms |

<a name="TimedStream+rate"></a>

### timedStream.rate : <code>number</code>
The rate in bytes per second

**Kind**: instance property of [<code>TimedStream</code>](#TimedStream)
<a name="TimedStream+period"></a>

### timedStream.period : <code>number</code>
The period between data events in ms

**Kind**: instance property of [<code>TimedStream</code>](#TimedStream)
<a name="TimedStream+streamPaused"></a>

### timedStream.streamPaused : <code>boolean</code>
True if the stream is paused

**Kind**: instance property of [<code>TimedStream</code>](#TimedStream)
<a name="TimedStream+totalTime"></a>

### timedStream.totalTime : <code>number</code>
The total time that the data flowed

**Kind**: instance property of [<code>TimedStream</code>](#TimedStream)
**Read only**: true
<a name="TimedStream+pauseStream"></a>

### timedStream.pauseStream()
Pause the stream

**Kind**: instance method of [<code>TimedStream</code>](#TimedStream)
<a name="TimedStream+resumeStream"></a>

### timedStream.resumeStream()
Resume the stream

**Kind**: instance method of [<code>TimedStream</code>](#TimedStream)

