const chai = require('chai');
const expect = chai.expect;
const TimedStream = require('../')
const Stream = require('stream')
const debug = require('debug')('test')

class RandomStream extends Stream.Readable {
	constructor(max_bytes, options) {
		super(options)
		this.max_bytes = max_bytes
		this._written = 0
	}
	_read(size) {
		size = Math.min(this.max_bytes - this._written, size)
		if (size <= 0)
			return this.push(null) // end stream	
		this._written += size
		this.push(Buffer.alloc(size, Math.random()))

	}
}

describe("TimedStream", function () {
	this.timeout(20000)
	this.slow(5000)
	let timers = []

	after(() => {
		timers.forEach(function (element) {
			clearTimeout(element)
		}, this);
		timers = []
	})

	it("should send data from input to output", done => {
		const t = new TimedStream()
		const input = Buffer.alloc(10, "test")
		t.on('data', output => {
			expect(output).to.be.equal(input)
			done()
		})
		t.write(input);
	})
	it("should passthrough random bytes like a normal passthrough stream when rate is 0", done => {
		const t = new TimedStream()
		const r = new RandomStream(1000)
		let c = 0
		t.on('data', data => c += data.length)
		t.on('end', () => {
			expect(c).to.be.equal(r.max_bytes)
			done()
		})
		r.pipe(t)
	})
	it("should take ~2 seconds to read 500 kbytes at 250kbps", done => {
		const t = new TimedStream({ rate: 250000 })
		const r = new RandomStream(500000)
		const expectedTime = 2000
		const start = Date.now()
		let c = 0 // counting data length
		t.on('data', data => c += data.length)
		t.on('end', () => {
			const totalTime = Date.now() - start
			// debug(totalTime)
			expect(totalTime)
				.to.be.lessThan(expectedTime + t.period + 20)
				.to.be.greaterThan(expectedTime - 20)
			expect(c).to.equals(r.max_bytes)
			done()
		})
		r.pipe(t)
	})
	it("should take ~4 seconds to read 4000 bytes at 1000bps", done => {
		const t = new TimedStream({ rate: 1000 })
		const r = new RandomStream(4000)
		const expectedTime = 4000
		const start = Date.now()
		let c = 0

		t.on('data', data => c += data.length)
		t.on('end', () => {
			const totalTime = Date.now() - start
			// debug(totalTime)
			expect(totalTime)
				.to.be.lessThan(expectedTime + t.period + 20)
				.to.be.greaterThan(expectedTime - 20)
			expect(c).to.be.equal(r.max_bytes)
			done()
		})
		r.pipe(t)
	})
	it("should take ~8 seconds to read 160 kbytes at 20 kbps", done => {
		const t = new TimedStream({ rate: 20000 })
		const r = new RandomStream(160000)
		const expectedTime = 8000
		const start = Date.now()
		let c = 0

		t.on('data', data => c += data.length)
		t.on('end', () => {
			const totalTime = Date.now() - start
			// debug(totalTime)
			expect(totalTime)
				.to.be.lessThan(expectedTime + t.period + 20)
				.to.be.greaterThan(expectedTime - 20)
			expect(c).to.be.equal(r.max_bytes)
			done()
		})
		r.pipe(t)
	})
	it("should still be precise with period of 10ms", done => {
		const t = new TimedStream({ rate: 20000, period: 10 })
		const r = new RandomStream(160000)
		const expectedTime = 8000
		const start = Date.now()
		let c = 0

		t.on('data', data => c += data.length)
		t.on('end', () => {
			const totalTime = Date.now() - start
			// debug(totalTime)
			expect(totalTime)
				.to.be.lessThan(expectedTime + t.period + 20)
				.to.be.greaterThan(expectedTime - 20)
			expect(c).to.be.equal(r.max_bytes)
			done()
		})
		r.pipe(t)
	})
	it("should stay consistent when we change the rate after start", done => {
		const t = new TimedStream({ rate: 2048, period: 50 })
		const r = new RandomStream(2048 * 2)
		const expectedTime = 3000
		const start = Date.now()
		let c = 0
		t.on('data', data => c += data.length)
		t.on('end', () => {
			const totalTime = Date.now() - start
			// debug(totalTime)
			expect(totalTime)
				.to.be.lessThan(expectedTime + t.period + 20)
				.to.be.greaterThan(expectedTime - 20)
			expect(c).to.be.equal(r.max_bytes)
			done()
		})
		r.pipe(t)
		timers.push(setTimeout(function () {
			t.rate = 1024
		}, 1000));
	})

	it("should stay consistent when we change the period after start", done => {
		const t = new TimedStream({ rate: 2048, period: 50 })
		const r = new RandomStream(2048 * 2)
		const expectedTime = 2000
		const start = Date.now()
		let c = 0
		t.on('data', data => c += data.length)
		t.on('end', () => {
			const totalTime = Date.now() - start
			// debug(totalTime)
			expect(totalTime)
				.to.be.lessThan(expectedTime + t.period + 20)
				.to.be.greaterThan(expectedTime - 20)
			expect(c).to.be.equal(r.max_bytes)
			done()
		})
		r.pipe(t)
		timers.push(setTimeout(function () {
			t.period = 10
		}, 1000));
	})
	it.only("should contain the correct rate in the member .rate", done => {
		let rate = 512
		const t = new TimedStream({ rate: rate, period: 50 })
		const r = new RandomStream(2048)
		t.on('data', () => expect(t.rate).to.be.equal(rate))
		t.on('end', () => {
			expect(t.rate).to.be.equal(rate)
			done()
		})
		r.pipe(t)
		timers.push(setTimeout(function () {
			rate = 1024
			t.rate = rate
		}, 500));
	})
})
describe("Pausing and other features", function () {
	this.timeout(20000)
	this.slow(5000)
	let timers = []

	after(() => {
		timers.forEach(function (element) {
			clearTimeout(element)
		}, this);
		timers = []
	});

	it("should not emit anything when paused", done => {
		const t = new TimedStream({ rate: 1000, period: 10 })
		const r = new RandomStream(2000)
		let paused = false
		let c = 0
		t.on('data', data => {
			expect(paused).to.be.false
			expect(t.streamPaused).to.be.false
			c += data.length
		})
		t.on('end', () => {
			expect(paused).to.be.false
			expect(t.streamPaused).to.be.false
			expect(c).to.be.equal(r.max_bytes)
			throw "The end should never be reached"
		})
		r.pipe(t)
		timers.push(setTimeout(() => {
			paused = true
			t.pauseStream()
			timers.push(setTimeout(function () {
				done()
			}, 2500))
		}, 500))
	})
	it("should be resumable", done => {
		const t = new TimedStream({ rate: 1000, period: 10 })
		const r = new RandomStream(2000)
		let c = 0
		t.on('data', data => c += data.length)
		t.on('end', () => {
			expect(c).to.be.equal(r.max_bytes)
			done()
		})
		r.pipe(t)
		timers.push(setTimeout(() => {
			t.pauseStream()
			timers.push(setTimeout(function () {
				t.resumeStream()
			}, 1500))
		}, 500))
	})
	it("should take ~3 sec to stream 2000b@1000bps being paused 1sec", done => {
		const t = new TimedStream({ rate: 1000, period: 10 })
		const r = new RandomStream(2000)
		const expectedTime = 3000
		const start = Date.now()
		let c = 0
		t.on('data', data => {
			c += data.length
		})
		t.on('end', () => {
			expect(c).to.be.equal(r.max_bytes)
			const totalTime = Date.now() - start
			expect(totalTime)
				.to.be.lessThan(expectedTime + t.period + 20)
				.to.be.greaterThan(expectedTime - 20)
			done()
		})
		r.pipe(t)
		timers.push(setTimeout(() => {
			t.pauseStream()
			timers.push(setTimeout(function () {
				t.resumeStream()
			}, 1000))
		}, 500))
	})

	it("should not break when pausing and resuming multiple times", done => {
		const t = new TimedStream({ rate: 1000, period: 10 })
		const r = new RandomStream(2000)
		const expectedTime = 5000
		const start = Date.now()
		let ok = false
		let c = 0
		t.on('data', data => {
			c += data.length
		})
		t.on('end', () => {
			expect(c).to.be.equal(r.max_bytes)
			const totalTime = Date.now() - start
			expect(totalTime)
				.to.be.lessThan(expectedTime + t.period + 20)
				.to.be.greaterThan(expectedTime - 20)
			expect(ok).to.be.true
			done()
		})
		r.pipe(t)
		timers.push(setTimeout(() => {
			t.pauseStream()
			timers.push(setTimeout(function () {
				t.resumeStream()
				timers.push(setTimeout(() => {
					t.pauseStream()
					timers.push(setTimeout(function () {
						t.resumeStream()
						timers.push(setTimeout(() => {
							t.pauseStream()
							timers.push(setTimeout(function () {
								ok = true
								t.resumeStream()
							}, 1000))
						}, 200))
					}, 1000))
				}, 200))
			}, 1000))
		}, 200))

	})
	it("should compute the total time since the data started to flow", done => {
		const t = new TimedStream({ rate: 1000, period: 10 })
		const r = new RandomStream(2000)
		const expectedTime = 2000
		t.on('data', () => { })
		t.on('end', () => {
			expect(t.totalTime)
				.to.be.greaterThan(expectedTime - t.period - 10)
				.to.be.lessThan(expectedTime + t.period + 10)
			done()
		})
		r.pipe(t)
		timers.push(setTimeout(() => {
			expect(t.totalTime)
				.to.be.lessThan(515)
				.to.be.greaterThan(485)
			t.resumeStream()
		}, 500))
	})
	it("should take the time paused into account when computing total time", done => {
		const t = new TimedStream({ rate: 1000, period: 10 })
		const r = new RandomStream(2000)
		const expectedTime = 2000
		t.on('data', () => { })
		t.on('end', () => {
			expect(t.totalTime)
				.to.be.greaterThan(expectedTime - t.period - 5)
				.to.be.lessThan(expectedTime + t.period + 5)
			// debug(t.totalTime)
			done()
		})
		r.pipe(t)
		timers.push(setTimeout(() => {
			t.pauseStream()
			timers.push(setTimeout(function () {
				expect(t.totalTime)
					.to.be.lessThan(t.period + 515)
					.to.be.greaterThan(495 - t.period)
				t.resumeStream()
			}, 2000))
		}, 500))
	})
	it("should contains the total # of bytes that passed through in _passed", done => {
		const t = new TimedStream({ rate: 250000 })
		const r = new RandomStream(500000)
		let c = 0 // counting data length
		t.on('data', data => {
			c += data.length
			expect(t._passed).to.be.equal(c)
		})
		t.on('end', () => {
			expect(t._passed).to.be.equal(c)
			done()
		})
		r.pipe(t)
		timers.push(setTimeout(function () {
			expect(t._passed).to.be.equal(c)
		}, Math.floor(Math.random() * 1500)))
	})
})