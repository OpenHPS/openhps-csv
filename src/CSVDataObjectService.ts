import { Constructor, DataObject, DataObjectService, DataServiceOptions, MemoryDataService } from '@openhps/core';
import * as csv from 'csv-parser';
import * as fs from 'fs';
import { Stream } from 'stream';
import { parseCsvContent, parseCsvStream } from './parseStream';

export class CSVDataObjectService<T extends DataObject> extends DataObjectService<T> {
    protected options: CSVDataServiceOptions<T>;

    constructor(dataType: Constructor<T>, options?: CSVDataServiceOptions<T>) {
        super(new MemoryDataService(dataType));
        this.options = options ?? ({} as CSVDataServiceOptions<T>);
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
        return parseCsvContent(content, this.options, this._onRow.bind(this));
    }

    parseStream(s: Stream): Promise<T[]> {
        return parseCsvStream(s, this.options, this._onRow.bind(this));
    }

    private _onRow(row: any): Promise<T> {
        return Promise.resolve().then(() => this.options.rowCallback(row));
    }
}

export interface CSVDataServiceOptions<T> extends DataServiceOptions<T>, csv.Options {
    file: string;
    rowCallback: (row: any) => T | Promise<T>;
}
