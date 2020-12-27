import { DataFrame, DataObject, ListSourceNode, SourceNodeOptions } from '@openhps/core';
import * as path from 'path';
import * as fs from 'fs';
import * as csv from 'csv-parser';

/**
 * CSVDataSource
 *
 * ## Usage
 * Files are loaded when the model is build. You can force a reset using the ```reset()``` function.
 *
 * ### Basic Usage
 * **example1.csv**
 * ```csv
 * TIME,NAME,X,Y
 * 1,Maxim,0,0
 * 2,Maxim,0,1
 * 3,Maxim,1,1
 * ```
 * **Implementation**
 * ```typescript
 * new CSVDataSource("example1.csv", (row: any) => {
 *  const object = new DataObject(row.NAME);
 *  const position = new Absolute2DPosition(parseFloat(row.X), parseFloat(row.Y));
 *  position.timestamp = parseInt(row.TIME);
 *  object.setPosition(position);
 *  return new DataFrame(object);
 * })
 * ```
 *
 * ### Advanced Usage
 * For more info, please check the [csv-parser](https://www.npmjs.com/package/csv-parser) documentation.
 *
 * **example3.csv**
 * ```csv
 * 1;Maxim;0;0
 * 2;Maxim;0;1
 * 3;Maxim;1;1
 * ```
 * **Implementation**
 * ```typescript
 * new CSVDataSource("example1.csv", (row: any) => {
 *  const object = new DataObject(row.NAME);
 *  const position = new Absolute2DPosition(parseFloat(row.X), parseFloat(row.Y));
 *  position.timestamp = parseInt(row.TIME);
 *  object.setPosition(position);
 *  return new DataFrame(object);
 * }, {
 *  headers: ["TIME", "NAME", "X", "Y"],
 *  separator: ";"
 * })
 * ```
 */
export class CSVDataSource<Out extends DataFrame> extends ListSourceNode<Out> {
    private _rowCallback: (row: any) => Out;
    private _file: string;
    protected options: csv.Options & SourceNodeOptions;

    constructor(file: string, rowCallback: (row: any) => Out, options: csv.Options & SourceNodeOptions = {}) {
        super([], options);
        this.options.source = this.options.source || new DataObject(path.basename(file));

        this._rowCallback = rowCallback;
        this._file = file;

        this.once('build', this._initCSV.bind(this));
    }

    private _initCSV(): Promise<void> {
        return new Promise((resolve, reject) => {
            const inputData: Out[] = [];
            const stream = fs
                .createReadStream(this._file)
                .pipe(csv(this.options))
                .on('data', (row: any) => {
                    const frame = this._rowCallback(row);
                    if (frame !== null && frame !== undefined) {
                        if (frame.source === undefined) {
                            frame.source = this.source;
                        }
                        inputData.push(frame);
                    }
                })
                .on('end', () => {
                    this.inputData = inputData;
                    stream.destroy();
                })
                .on('close', function (err: any) {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
        });
    }

    public reset(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.inputData = [];
            this._initCSV()
                .then(() => {
                    resolve();
                })
                .catch((ex) => {
                    reject(ex);
                });
        });
    }
}
