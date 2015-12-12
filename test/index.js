import chai from 'chai';
import fs from 'fs';
import { GCodeInterpreter } from '../dist/';
import _ from 'lodash';

const expect = chai.expect;
const should = chai.should();

describe('G-code Interpreter', (done) => {
    describe('Pass a null value as the first argument', (done) => {
        class GCodeRunner extends GCodeInterpreter {
            constructor(options) {
                super(options);
            }
        }

        let runner = new GCodeRunner();
        it('should call interpretText\'s callback.', (done) => {
            runner.interpretText(null, (err, results) => {
                expect(err).to.be.okay;
                done();
            });
        });
        it('should call interpretFile\'s callback.', (done) => {
            runner.interpretFile(null, (err, results) => {
                expect(err).to.be.okay;
                done();
            });
        });
        it('should call interpretStream\'s callback.', (done) => {
            runner.interpretStream(null, (err, results) => {
                expect(err).to.be.okay;
                done();
            });
        });
    });

    describe('Event callbacks', (done) => {
        class GCodeRunner extends GCodeInterpreter {
            constructor(options) {
                super(options);
            }
        }

        let runner = new GCodeRunner();
        runner
            .on('data', (data) => {
                expect(data).to.be.an('object');
            })
            .on('end', (results) => {
                expect(results).to.be.an('array');
            });

        it('should call event callbacks.', (done) => {
            runner.interpretFile('test/fixtures/circle.nc', (err, results) => {
                expect(err).to.be.okay;
                done();
            });
        });
    });

    describe('G-code: circle', (done) => {
        let calls = {};

        class GCodeRunner extends GCodeInterpreter {
            constructor(options) {
                super(options);
            }
            G0(args) {
                calls.G0 = (calls.G0 || 0) + 1;
                expect(args).to.be.an('object');
            }
            G1(args) {
                calls.G1 = (calls.G1 || 0) + 1;
                expect(args).to.be.an('object');
            }
            G2(args) {
                calls.G2 = (calls.G2 || 0) + 1;
                expect(args).to.be.an('object');
            }
        }

        it('should call each function with the expected number of times.', (done) => {
            let runner = new GCodeRunner();
            runner.interpretFile('test/fixtures/circle.nc', (err, results) => {
                expect(calls.G0).to.equal(2);
                expect(calls.G1).to.equal(1);
                expect(calls.G2).to.equal(4);
                done();
            });
        });
    });

    describe('G-code: 1 inch circle', (done) => {
        let calls = {};

        class GCodeRunner extends GCodeInterpreter {
            constructor(options) {
                super(options);
            }
            G17() {
                calls.G17 = (calls.G17 || 0) + 1;
            }
            G20() {
                calls.G20 = (calls.G20 || 0) + 1;
            }
            G90() {
                calls.G90 = (calls.G90 || 0) + 1;
            }
            G94() {
                calls.G94 = (calls.G94 || 0) + 1;
            }
            G54() {
                calls.G54 = (calls.G54 || 0) + 1;
            }
            G0(args) {
                expect(args).to.be.an('object');
                calls.G0 = (calls.G0 || 0) + 1;
            }
            G1(args) {
                expect(args).to.be.an('object');
                calls.G1 = (calls.G1 || 0) + 1;
            }
            G2(args) {
                expect(args).to.be.an('object');
                calls.G2 = (calls.G2 || 0) + 1;
            }
        }

        it('should call each function with the expected number of times.', (done) => {
            let runner = new GCodeRunner();
            runner.interpretFile('test/fixtures/one-inch-circle.nc', (err, results) => {
                expect(calls.G0).to.equal(4);
                expect(calls.G1).to.equal(2);
                expect(calls.G2).to.equal(4);
                done();
            });
        });
    });

});
