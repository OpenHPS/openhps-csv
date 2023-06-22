import { Constructor, DataObject, DataObjectService, DataServiceOptions, MemoryDataService } from '@openhps/core';
import * as csv from 'csv-parser';
import * as fs from 'fs';
import { Readable, Stream } from 'stream';

export class CSVDataObjectService<T extends DataObject> extends DataObjectService<T> {
    protected options: CSVDataServiceOptions<T>;

    constructor(dataType: Constructor<T>, options?: CSVDataServiceOptions<T>) {
        super(new MemoryDataService(dataType));
        this.options = options;
        this.once('build', this._initCSV.bind(this));
    }

    private _initCSV(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.options.file) {
                return resolve();
            }
            this.parseStream(fs.createReadStream(this.options.file))
                .then((data) => {
                    return Promise.all(data.map(this.insertObject.bind(this)));
                })
                .then(() => {
                    resolve();
                })
                .catch(reject);
        });
    }

    parseContent(content: string): Promise<T[]> {
        const s = new Readable();
        s.push(content);
        s.push(null);
        return this.parseStream(s);
    }

    parseStream(s: Stream): Promise<T[]> {
        return new Promise((resolve, reject) => {
            const inputData: T[] = [];
            let countUnprocessed = 0;
            let countProcessed = 0;
            const stream = s
                .pipe(csv(this.options))
                .on('data', async (row: any) => {
                    countUnprocessed++;
                    const object = await Promise.resolve(this.options.rowCallback(row));
                    if (object !== null && object !== undefined) {
                        inputData.push(object);
                    }
                    countProcessed++;
                })
                .on('end', () => {
                    stream.destroy();
                })
                .on('close', function (err: any) {
                    if (err) {
                        return reject(err);
                    }
                    if (countProcessed !== countUnprocessed) {
                        const timer = setInterval(() => {
                            if (countProcessed === countUnprocessed) {
                                clearInterval(timer);
                                resolve(inputData);
                            }
                        }, 100);
                    } else {
                        resolve(inputData);
                    }
                });
        });
    }
}

export interface CSVDataServiceOptions<T> extends DataServiceOptions<T>, csv.Options {
    file: string;
    rowCallback: (row: any) => T | Promise<T>;
}
