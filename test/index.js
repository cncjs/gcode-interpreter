import { expect } from 'chai';
import fs from 'fs';
import Interpreter from '../src/';

describe('G-code Interpreter', () => {
    describe('Pass a null value as the first argument', () => {
        class Runner extends Interpreter {
            constructor(options) {
                super(options);
            }
        }

        const runner = new Runner();
        it('should call loadFromString\'s callback.', (done) => {
            runner.loadFromString(null, (err, results) => {
                expect(err).to.be.equal(null);
                done();
            });
        });
        it('should call loadFromFile\'s callback.', (done) => {
            runner.loadFromFile(null, (err, results) => {
                expect(err).not.to.equal(null);
                done();
            });
        });
        it('should call loadFromStream\'s callback.', (done) => {
            runner.loadFromStream(null, (err, results) => {
                expect(err).not.to.equal(null);
                done();
            });
        });
    });

    describe('Event listeners', () => {
        it('should call event listeners when loading G-code from file.', (done) => {
            const file = 'test/fixtures/circle.nc';
            const runner = new Interpreter();

            runner
                .loadFromFile(file, (err, results) => {
                    expect(err).to.be.null;
                    done();
                })
                .on('data', (data) => {
                    expect(data).to.be.an('object');
                })
                .on('end', (results) => {
                    expect(results).to.be.an('array');
                    expect(results.length).to.be.equal(7);
                });
        });

        it('should call event listeners when loading G-code from stream.', (done) => {
            const stream = fs.createReadStream('test/fixtures/circle.nc');
            const runner = new Interpreter();

            runner
                .loadFromStream(stream, (err, results) => {
                    expect(err).to.be.null;
                    done();
                })
                .on('data', (data) => {
                    expect(data).to.be.an('object');
                })
                .on('end', (results) => {
                    expect(results).to.be.an('array');
                    expect(results.length).to.be.equal(7);
                });
        });

        it('should call event listeners when loading G-code from string.', (done) => {
            const string = fs.readFileSync('test/fixtures/circle.nc', 'utf8');
            const runner = new Interpreter();

            runner
                .loadFromString(string, (err, results) => {
                    expect(err).to.be.null;
                    done();
                })
                .on('data', (data) => {
                    expect(data).to.be.an('object');
                })
                .on('end', (results) => {
                    expect(results).to.be.an('array');
                    expect(results.length).to.be.equal(7);
                });
        });

        it('loadFromFileSync() should return expected result.', (done) => {
            let i = 0;
            const file = 'test/fixtures/circle.nc';
            const runner = new Interpreter();
            const results = runner.loadFromFileSync(file, (data, index) => {
                expect(i).to.be.equal(index);
                ++i;
            });
            expect(results).to.be.an('array');
            expect(results.length).to.be.equal(7);
            done();
        });

        it('loadFromStringSync() should return expected result.', (done) => {
            let i = 0;
            const file = 'test/fixtures/circle.nc';
            const string = fs.readFileSync(file, 'utf8');
            const runner = new Interpreter();
            const results = runner.loadFromStringSync(string, (data, index) => {
                expect(i).to.be.equal(index);
                ++i;
            });
            expect(results).to.be.an('array');
            expect(results.length).to.be.equal(7);
            done();
        });
    });

    describe('Default handler', () => {
        it('should call default handler if no matching handler found.', (done) => {
            let i = 0;
            let defaultHandlerCalled = 0;
            const file = 'test/fixtures/default-handler.nc';
            const string = fs.readFileSync(file, 'utf8');
            const runner = new Interpreter({
                handlers: {
                    'G0': (params) => {
                    },
                    'G1': (params) => {
                    }
                },
                defaultHandler: (cmd, params) => {
                    // G9999 P1

                    defaultHandlerCalled++;
                }
            });
            const results = runner.loadFromStringSync(string, (data, index) => {
                expect(i).to.be.equal(index);
                ++i;
            });
            expect(defaultHandlerCalled).to.be.equal(1);
            expect(results).to.be.an('array');
            expect(results.length).to.be.equal(3);
            expect(results).to.deep.equal([
                {
                    line: 'G0 X0 Y0 Z0',
                    words: [['G', 0], ['X', 0], ['Y', 0], ['Z', 0]]
                },
                {
                    line: 'G1 X10 Y10',
                    words: [['G', 1], ['X', 10], ['Y', 10]]
                },
                {
                    line: 'G9999 P1',
                    words: [['G', 9999], ['P', 1]]
                }
            ]);

            done();
        });
    });

    describe('G-code: circle', () => {
        it('should call each function with the expected number of times.', (done) => {
            const calls = {};

            class Runner {
                loadFile(file, callback) {
                    const handlers = {
                        'G0': (args) => {
                            calls.G0 = (calls.G0 || 0) + 1;
                            expect(args).to.be.an('object');
                        },
                        'G1': (args) => {
                            calls.G1 = (calls.G1 || 0) + 1;
                            expect(args).to.be.an('object');
                        },
                        'G2': (args) => {
                            calls.G2 = (calls.G2 || 0) + 1;
                            expect(args).to.be.an('object');
                        }
                    };

                    const interpreter = new Interpreter({ handlers: handlers })
                    interpreter.loadFromFile(file, callback);

                    return interpreter;
                }
            };

            new Runner().loadFile('test/fixtures/circle.nc', (err, results) => {
                expect(calls.G0).to.equal(2);
                expect(calls.G1).to.equal(1);
                expect(calls.G2).to.equal(4);
                done();
            });
        });
    });

    describe('G-code: circle (extends Interpreter)', () => {
        const calls = {};

        class Runner extends Interpreter {
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
            const file = 'test/fixtures/circle.nc';
            const string = fs.readFileSync(file, 'utf8');
            const runner = new Runner();
            runner.loadFromFileSync(file);
            expect(calls.G0).to.equal(2);
            expect(calls.G1).to.equal(1);
            expect(calls.G2).to.equal(4);
            runner.loadFromStringSync(string);
            expect(calls.G0).to.equal(2 * 2);
            expect(calls.G1).to.equal(1 * 2);
            expect(calls.G2).to.equal(4 * 2);
            done();
        });
    });

    describe('G-code: 1 inch circle', () => {
        const calls = {};

        class Runner extends Interpreter {
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
            const file = 'test/fixtures/one-inch-circle.nc';
            const string = fs.readFileSync(file, 'utf8');
            const runner = new Runner();
            runner.loadFromFileSync(file);
            expect(calls.G0).to.equal(4);
            expect(calls.G1).to.equal(2);
            expect(calls.G2).to.equal(4);
            runner.loadFromStringSync(string);
            expect(calls.G0).to.equal(4 * 2);
            expect(calls.G1).to.equal(2 * 2);
            expect(calls.G2).to.equal(4 * 2);
            done();
        });
    });

    describe('G-code: T2Laser', () => {
        class Runner extends Interpreter {
            calls = {};

            constructor(options) {
                super(options);
            }
            M3(args) {
                expect(args).to.be.an('object');
                this.calls.M3 = (this.calls.M3 || 0) + 1;
            }
            M5(args) {
                expect(args).to.be.an('object');
                this.calls.M5 = (this.calls.M5 || 0) + 1;
            }
            M6(args) {
                expect(args).to.be.an('object');
                this.calls.M6 = (this.calls.M6 || 0) + 1;
            }
            T(args) {
                expect(args).to.be.an('number');
                this.calls.T = (this.calls.T || 0) + 1;
            }
            F(args) {
                expect(args).to.be.an('number');
                this.calls.F = (this.calls.F || 0) + 1;
            }
            G0(args) {
                expect(args).to.be.an('object');
                this.calls.G0 = (this.calls.G0 || 0) + 1;
            }
            G1(args) {
                expect(args).to.be.an('object');
                this.calls.G1 = (this.calls.G1 || 0) + 1;
            }
        }

        it('should call each function with the expected number of times.', (done) => {
            const file = 'test/fixtures/t2laser.nc';
            const runner = new Runner();
            runner.loadFromFileSync(file);
            expect(runner.calls.M3).to.equal(31);
            expect(runner.calls.M5).to.equal(1);
            expect(runner.calls.M6).to.equal(1);
            expect(runner.calls.T).to.equal(2);
            expect(runner.calls.F).to.equal(1);
            expect(runner.calls.G0).to.equal(2);
            expect(runner.calls.G1).to.equal(31);
            done();
        });

        it('should call each function with the expected number of times.', (done) => {
            const file = 'test/fixtures/t2laser.nc';
            const string = fs.readFileSync(file, 'utf8');
            const runner = new Runner();
            runner.loadFromStringSync(string);
            expect(runner.calls.M3).to.equal(31);
            expect(runner.calls.M5).to.equal(1);
            expect(runner.calls.M6).to.equal(1);
            expect(runner.calls.T).to.equal(2);
            expect(runner.calls.F).to.equal(1);
            expect(runner.calls.G0).to.equal(2);
            expect(runner.calls.G1).to.equal(31);
            done();
        });
    });
});
