import 'mocha';
import {
    Model, ModelBuilder, DataObject, Absolute2DPosition, DataFrame, CallbackSinkNode, TimedPullNode, TimeUnit
} from '@openhps/core';
import {
    CSVDataSink,
    CSVDataSource
} from '../../src';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('csv sink', () => {

    it('use case 1', (done) => {
        const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'openhps-csv-'));

        ModelBuilder.create()
            .from(new CSVDataSource("test/data/example1.csv", (row: any) => {
                const object = new DataObject(row.NAME);
                const position = new Absolute2DPosition(parseFloat(row.X), parseFloat(row.Y));
                position.timestamp = parseInt(row.TIME);
                object.setPosition(position);
                return new DataFrame(object);
            }))
            .via(new TimedPullNode(1, TimeUnit.MILLISECOND))
            .to(new CSVDataSink(path.join(temp, "example1_output.csv"), [
                { id: "time", title: "time" },
                { id: "name", title: "name" },
                { id: "x", title: "x" },
                { id: "y", title: "y" }
            ], frame => {
                return {
                    time: frame.source.getPosition().timestamp,
                    name: frame.source.uid,
                    x: frame.source.getPosition().toVector3().x,
                    y: frame.source.getPosition().toVector3().y
                };
            }))
            .build().then((model: Model) => {
                model.emit('destroy');
                done();
            }).catch((ex: any) => {
                done(ex);
            });
    }).timeout(5000);

});
