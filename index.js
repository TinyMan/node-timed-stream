const Stream = require('stream')
const debug = require('debug')('TimedStream')

class TimedStream extends Stream.Transform {
	constructor(options) {
		super(options)
		const opts = Object.assign({
			rate: 0, // unlimited
			period: 100
		}, options)

		const now = Date.now()
		this._internalStream = new Stream.PassThrough()
		this._internalStream.pause()
		this._interval = null

		this.start = now
		this.last = this.start
		this._passed = 0

		this._last_expected = 0
		this._last_rate_change = now
		this._rate = 0
		this._period = 0
		this._chunkSize = 0
		this._timePaused = 0

		this.rate = opts.rate
		this.period = opts.period

		this.streamPaused = false

		this.registerInterval()
		// debug("rate: %d, period: %d", this._rate, this._period)
	}
	destructor() {
		clearInterval(this._interval)
	}
	pauseStream() {
		// debug('pause')
		if (this.streamPaused) return
		if (this._interval) {
			clearInterval(this._interval)
		}
		this.streamPaused = true
		this._pauseStart = Date.now()
	}
	resumeStream() {
		// debug("resume")
		if (!this.streamPaused) return
		this.streamPaused = false
		this.registerInterval()
		this._timePaused += Date.now() - this._pauseStart
	}
	registerInterval() {
		if (this._interval) {
			clearInterval(this._interval)
			this._interval = null
		}
		this._internalStream.removeAllListeners("readable")
		if (this.rate === 0) {
			this._internalStream.on('readable', this._passthrough.bind(this))
		} else {
			this._interval = setInterval(this._passthrough.bind(this), this._period)
		}
	}
	_passthrough() {
		// debug("passing through")
		let size = null;
		if (this.rate > 0) {
			const now = Date.now() - this._timePaused
			const elapsed_since_rate_change = now - this._last_rate_change

			const expected = Math.round(this.rate * elapsed_since_rate_change) + this._last_expected
			size = expected - this._passed
			if (size <= 0) return

			const elapsed = now - this.start
			const error = elapsed % this.period
			this._interval._repeat = this.period - error

			// size = this._chunkSize === 0 ? null : this._chunkSize
			// debug("Elapsed: %d, Error: %d, Expected size: %d", elapsed, error, size)
			this.last = now
		}
		const data = this._internalStream.read(size)
		if (data) {
			this._passed += data.length
			// if(data.length !== size) debug("Expected size: %d, real size: %d", size, data.length)
		}
		this.push(data)
	}
	_transform(chunk, encoding, callback) {
		// debug("Chunk length: ", chunk.length)
		this._internalStream.write(chunk, encoding, callback)
	}
	_flush(callback) {
		// debug("Flush")
		this._internalStream.on('end', () => {
			if (this._interval) clearInterval(this._interval)
			this._interval = null
			callback()
		})
		this._internalStream.end()
	}

	set rate(rate) {
		rate /= 1000 // convert to bytes / ms
		const now = Date.now()
		this._last_expected = Math.round(this._last_expected + (now - this._last_rate_change) * this._rate)
		this._last_rate_change = now

		this._rate = rate
		this._chunkSize = this.period * this.rate
		// debug("set rate. expected: ", this._last_expected)
	}
	set period(period) {
		this._period = period
		this._chunkSize = this.period * this.rate
	}
	get rate() { return this._rate }
	get period() { return this._period }
	get totalTime() {
		return this.last - this.start // - this._timePaused is done each time last is assigned
	}
}



module.exports = TimedStream