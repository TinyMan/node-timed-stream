const Stream = require('stream')
const debug = require('debug')('TimedStream')

/**
 * A TimedStream allow data to passthrough at a given rate and pause/resume at any time
 */
class TimedStream extends Stream.Transform {
	/**
	 * Creates an instance of TimedStream.
	 * @param {object} [options] Options forwarder to Stream.Transform ctor
	 * @param {number} [options.rate=0] Bytes per seconds (0: unlimited)
	 * @param {number} [options.period=100] Time between data event in ms
	 */
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

		/**
		 * The rate in bytes per second
		 * @member {number} TimedStream#rate
		 */
		this.rate = opts.rate
		/**
		 * The period between data events in ms
		 * @member {number} TimedStream#period
		 */
		this.period = opts.period

		/**
		 * True if the stream is paused
		 * @member {boolean} TimedStream#streamPaused
		 */
		this.streamPaused = false

		this._registerInterval()
		// debug("new TimedStream(rate: %d, period: %d)", this._rate, this._period)
	}
	/**
	 * Pause the stream
	 * @method TimedStream#pauseStream
	 */
	pauseStream() {
		// debug('pause')
		if (this.streamPaused) return
		if (this._interval) {
			clearInterval(this._interval)
		}
		this.streamPaused = true
		this._pauseStart = Date.now()
		this._internalStream.removeAllListeners("readable")
	}
	/**
	 * Resume the stream
	 * @method TimedStream#resumeStream
	 */
	resumeStream() {
		// debug("resume")
		if (!this.streamPaused) return
		this.streamPaused = false
		this._registerInterval()
		this._timePaused += Date.now() - this._pauseStart
		if (this._internalStream._readableState.emittedReadable) // if it has not been read since the last 'readable' event
			this._internalStream.emit("readable")
	}
	/**
	 * Destroy the stream. A destroyed stream will not emit 'end' or any other event
	 * @method TimedStream#destroy
	 */
	destroy() {
		if (this._interval) clearInterval(this._interval)
		this._internalStream.removeAllListeners("readable")
		this._internalStream = null
		this._destroyed = true
	}
	_registerInterval() {
		if (this._interval) {
			clearInterval(this._interval)
			this._interval = null
		}
		this._internalStream.removeAllListeners("readable")
		if (this._rate === 0) {
			this._internalStream.on('readable', this._passthrough.bind(this))
		} else {
			this._interval = setInterval(this._passthrough.bind(this), this._period)
		}
	}
	_passthrough() {
		// debug("passing through")
		let size = null;
		if (this._rate > 0) {
			const now = Date.now() - this._timePaused
			const elapsed_since_rate_change = now - this._last_rate_change

			const expected = Math.round(this._rate * elapsed_since_rate_change) + this._last_expected
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
			this.push(data)
		} else {
			// debug("Warning: data not coming quickly enough")
		}
	}
	_transform(chunk, encoding, callback) {
		// debug("Chunk length: ", chunk.length)
		if (this._destroyed) return
		this._internalStream.write(chunk, encoding, callback)
	}
	_flush(callback) {
		// debug("Flush")
		if (this._destroyed) return
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
		this._chunkSize = this.period * this._rate
		// debug("set rate. expected: ", this._last_expected)
	}
	set period(period) {
		this._period = period
		this._chunkSize = this.period * this._rate
	}
	get rate() { return this._rate * 1000 }
	get period() { return this._period }
	/**
	 * The total time that the data flowed
	 * @readonly
	 * @member {number} TimedStream#totalTime
	 */
	get totalTime() {
		return this.last - this.start // - this._timePaused is done each time last is assigned
	}
}



module.exports = TimedStream