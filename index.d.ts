// Type definitions for timed-stream
// Project: https://github.com/TinyMan/node-timed-stream
// Definitions by: TinyMan https://github.com/TinyMan

export = TimedStream

import * as EventEmitter from "events";
import { Transform } from "stream";


declare class TimedStream extends Transform {
	/**
	 * The rate in bytes per second
	 */
	public rate: number;
	/**
	 * The period between data events in ms
	 */
	public period: number;
	/**
	 * True if the stream is paused
	 */
	public readonly streamPaused: boolean;

	/**
	 * Pause the stream
	 */
	public pauseStream(): void;
	/**
	 * Resume the stream
	 */
	public resumeStream(): void;

	/**
	 * The total time that the data flowed
	 */
	public readonly totalTime: number;


}