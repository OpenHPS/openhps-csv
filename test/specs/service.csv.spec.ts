import 'mocha';
import {
    CSVDataObjectService
} from '../../src';
import { Absolute3DPosition, DataObject } from '@openhps/core';
import { expect } from 'chai';

describe('CSVDataObjectService', () => {

    it('should parse a csv to objects', (done) => {
        const service = new CSVDataObjectService(DataObject, {
            rowCallback: (row) => {
                const object = new DataObject(row.ID);
                object.setPosition(new Absolute3DPosition(
                    Number(row.X), Number(row.Y), Number(row.Z)))
                return object;
            },
            file: "test/data/ble_devices.csv"
        });
        service.emitAsync('build').then(() => {
            return service.findAll();
        }).then(objects => {
            expect(objects.length).to.equal(11);
            expect(objects[0].uid).to.equal("BEACON_01");
            expect((objects[0].position as Absolute3DPosition).x).to.equal(13.1);
            expect((objects[0].position as Absolute3DPosition).y).to.equal(31.2);
            expect((objects[0].position as Absolute3DPosition).z).to.equal(1.6);
            done();
        }).catch(done);
    });

});
