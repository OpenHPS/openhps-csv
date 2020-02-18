import { DataFrame, DataObject, SinkNode, GraphOptions } from "@openhps/core";
import * as csv from 'csv-writer';
import { CsvWriter } from "csv-writer/src/lib/csv-writer";
import { ObjectMap } from "csv-writer/src/lib/lang/object";
import { ObjectStringifierHeader } from "csv-writer/src/lib/record";

export class CSVDataSink<In extends DataFrame> extends SinkNode<In> {
    private _writeCallback: (frame: In) => DataFrame;
    private _file: string;
    private _csvWriter: CsvWriter<ObjectMap<any>>;
    private _header: ObjectStringifierHeader;

    constructor(file: string, header: Array<{ id: string, title: string }>, writeCallback: (frame: In) => any) {
        super();
        this._header = header;
        this._writeCallback = writeCallback;
        this._file = file;

        this.on("build", this._initCSV.bind(this));
    }

    private _initCSV(_?: any): Promise<void> {
        return new Promise((resolve, reject) => {
            this._csvWriter = csv.createObjectCsvWriter({
                path: this._file,
                header: this._header
            });
            resolve();
        });
    }

    public onPush(data: In, options?: GraphOptions): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this._csvWriter.writeRecords([this._writeCallback(data)]).then(_ => {
                resolve();
            }).catch(ex => {
                reject(ex);
            });
        });
    }
    
}