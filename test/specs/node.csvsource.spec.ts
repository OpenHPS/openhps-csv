import 'mocha';
import {
    Model, ModelBuilder, DataObject, Absolute2DPosition, DataFrame, CallbackSinkNode
} from '@openhps/core';
import {
    CSVDataSource, CSVDataSourceOptions
} from '../../src';
import { expect } from 'chai';

describe('csv source', () => {

    it('use case 1', (done) => {
        ModelBuilder.create()
            .from(new CSVDataSource("test/data/example1.csv", (row: any) => {
                const object = new DataObject(row.NAME);
                const position = new Absolute2DPosition(parseFloat(row.X), parseFloat(row.Y));
                position.timestamp = parseInt(row.TIME);
                object.setPosition(position);
                return new DataFrame(object);
            }))
            .to(new CallbackSinkNode((frame: DataFrame) => {
                expect(frame.source).to.not.be.undefined;
                expect(frame.source.uid).to.equal("Maxim");
                expect(frame.source.getPosition()).to.not.be.undefined;
                expect(frame.source.getPosition().timestamp).to.equal(1);
                done();
            }))
            .build().then((model: Model) => {
                return model.pull();
            }).then(() => {}).catch((ex: any) => {
                done(ex);
            });
    });

    it('use case 2', (done) => {
        ModelBuilder.create()
            .from(new CSVDataSource("test/data/example2.csv", (row: any) => {
                const object = new DataObject(row.NAME);
                const position = new Absolute2DPosition(parseFloat(row.X), parseFloat(row.Y));
                position.timestamp = parseInt(row.TIME);
                object.setPosition(position);
                return new DataFrame(object);
            }, {
                headers: ["TIME", "NAME", "X", "Y"],
            }))
            .to(new CallbackSinkNode((frame: DataFrame) => {
                expect(frame.source).to.not.be.undefined;
                expect(frame.source.uid).to.equal("Maxim");
                expect(frame.source.getPosition()).to.not.be.undefined;
                expect(frame.source.getPosition().timestamp).to.equal(1);
                done();
            }))
            .build().then((model: Model) => {
                return model.pull();
            }).then(() => {}).catch((ex: any) => {
                done(ex);
            });
    });

    it('use case 3', (done) => {
        ModelBuilder.create()
            .from(new CSVDataSource("test/data/example3.csv", (row: any) => {
                const object = new DataObject(row.NAME);
                const position = new Absolute2DPosition(parseFloat(row.X), parseFloat(row.Y));
                position.timestamp = parseInt(row.TIME);
                object.setPosition(position);
                return new DataFrame(object);
            }, {
                headers: ["TIME", "NAME", "X", "Y"],
                separator: ";"
            }))
            .to(new CallbackSinkNode((frame: DataFrame) => {
                expect(frame.source).to.not.be.undefined;
                expect(frame.source.uid).to.equal("Maxim");
                expect(frame.source.getPosition()).to.not.be.undefined;
                expect(frame.source.getPosition().timestamp).to.equal(1);
                done();
            }))
            .build().then((model: Model) => {
                return model.pull();
            }).then(() => {}).catch((ex: any) => {
                done(ex);
            });
    });

    it('use case 4', (done) => {
        ModelBuilder.create()
            .from(new (class ABC extends CSVDataSource<DataFrame> {
               constructor(rowCallback: (row: any) => DataFrame, options?: CSVDataSourceOptions) {
                    super(undefined, rowCallback, options);
                    this.parseContent(
                        `1;Maxim;0;0
                        2;Maxim;0;1
                        3;Maxim;1;1`
                    ).then(data => {
                        this.inputData = data;
                    });
               }

            })((row: any) => {
                const object = new DataObject(row.NAME);
                const position = new Absolute2DPosition(parseFloat(row.X), parseFloat(row.Y));
                position.timestamp = parseInt(row.TIME);
                object.setPosition(position);
                return new DataFrame(object);
            }, {
                headers: ["TIME", "NAME", "X", "Y"],
                separator: ";"
            }))
            .to(new CallbackSinkNode((frame: DataFrame) => {
                expect(frame.source).to.not.be.undefined;
                expect(frame.source.uid).to.equal("Maxim");
                done();
            }))
            .build().then((model: Model) => {
                return model.pull();
            }).then(() => {}).catch((ex: any) => {
                done(ex);
            });
    });

    it('should use the source object if no source is provided', (done) => {
        ModelBuilder.create()
            .from(new CSVDataSource("test/data/example3.csv", (row: any) => {
                return new DataFrame();
            }, {
                headers: ["TIME", "NAME", "X", "Y"],
                separator: ";",
                source: new DataObject("Maxim")
            }))
            .to(new CallbackSinkNode((frame: DataFrame) => {
                expect(frame.source).to.not.be.undefined;
                expect(frame.source.uid).to.equal("Maxim");
                done();
            }))
            .build().then((model: Model) => {
                return model.pull();
            }).then(() => {}).catch((ex: any) => {
                done(ex);
            });
    });

    it('should reset', (done) => {
        let model;
        let source = new CSVDataSource("test/data/example3.csv", (row: any) => {
            const object = new DataObject(row.NAME);
            const position = new Absolute2DPosition(parseFloat(row.X), parseFloat(row.Y));
            position.timestamp = parseInt(row.TIME);
            object.setPosition(position);
            return new DataFrame(object);
        }, {
            headers: ["TIME", "NAME", "X", "Y"],
            separator: ";"
        });

        ModelBuilder.create()
            .from(source)
            .to(new CallbackSinkNode((frame: DataFrame) => {
                expect(frame.source).to.not.be.undefined;
                expect(frame.source.uid).to.equal("Maxim");
                expect(frame.source.getPosition()).to.not.be.undefined;
                expect(frame.source.getPosition().timestamp).to.equal(1);
            }))
            .build().then((m: Model) => {
                model = m;
                return model.pull();
            }).then(() => {
                source.reset();
                return model.pull();
            }).then(() => { done(); }).catch((ex: any) => {
                done(ex);
            });
    });

});
