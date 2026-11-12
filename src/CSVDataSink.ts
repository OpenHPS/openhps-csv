import { DataFrame, SinkNode, SinkNodeOptions } from '@openhps/core';
import * as csv from 'csv-writer';
import { CsvWriter } from 'csv-writer/src/lib/csv-writer';
import { ObjectMap } from 'csv-writer/src/lib/lang/object';
import { ObjectStringifierHeader } from 'csv-writer/src/lib/record';

/**
 * CSVDataSink
 * @category Sink node
 */
export class CSVDataSink<In extends DataFrame> extends SinkNode<In> {
    private _writeCallback: (frame: In) => DataFrame;
    private _file: string;
    private _csvWriter: CsvWriter<ObjectMap<any>>;
    private _header: ObjectStringifierHeader;
    private _writeQueue: any[] = [];
    private _writeReady = true;
    private _timeout: NodeJS.Timeout;
    private _pending: Array<() => void> = [];

    constructor(
        file: string,
        header: Array<{ id: string; title: string }>,
        writeCallback: (frame: In) => any,
        options?: SinkNodeOptions,
    ) {
        super(options);
        this._header = header;
        this._writeCallback = writeCallback;
        this._file = file;

        this.once('build', this._initCSV.bind(this));
    }

    private _initCSV(): Promise<void> {
        return new Promise((resolve) => {
            this._csvWriter = csv.createObjectCsvWriter({
                path: this._file,
                header: this._header,
            });
            resolve();
        });
    }

    public onPush(data: In): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this._writeQueue.push(this._writeCallback(data));
            this._handleQueue(resolve, reject).catch(reject);
        });
    }

    private _handleQueue(onSuccess?: () => void, onError?: (err: any) => void): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this._writeReady) {
                this._writeReady = false;
                const queue = new Array(...this._writeQueue);
                this._writeQueue = [];
                if (this._timeout) {
                    clearTimeout(this._timeout);
                    this._timeout = undefined;
                }
                this._csvWriter
                    .writeRecords(queue)
                    .then(() => {
                        const pending = this._pending;
                        this._pending = [];
                        pending.forEach((pending) => pending());
                        if (onSuccess) {
                            onSuccess();
                        }
                        resolve();
                    })
                    .catch((err) => {
                        if (onError) {
                            onError(err);
                        }
                        reject(err);
                    })
                    .finally(() => {
                        this._writeReady = true;
                    });
            } else {
                if (this._timeout) {
                    clearTimeout(this._timeout);
                }
                this._timeout = setTimeout(() => this._handleQueue(onSuccess, onError), 100);
                this._pending.push(onSuccess || resolve);
            }
        });
    }
}
