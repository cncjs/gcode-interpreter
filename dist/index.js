'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.GCodeInterpreter = undefined;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _stream = require('stream');

var _stream2 = _interopRequireDefault(_stream);

var _gcodeParser = require('gcode-parser');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var streamify = function streamify(text) {
    var s = new _stream2.default.Readable();
    s.push(text);
    s.push(null);
    return s;
};

var partitionWordsByGroup = function partitionWordsByGroup(words) {
    var groups = [];

    _lodash2.default.each(words, function (word) {
        var letter = word[0];
        var argument = word[1];

        if (_lodash2.default.includes(['G', 'M'], letter)) {
            groups.push([word]);
            return;
        }

        if (_lodash2.default.size(groups) > 0) {
            groups[groups.length - 1].push(word);
        } else {
            groups.push([word]);
        }
    });

    return groups;
};

var interpret = function interpret(self, data) {
    var groups = partitionWordsByGroup(data.words);
    _lodash2.default.each(groups, function (words) {
        var word = words[0] || [];
        var letter = word[0];
        var arg = word[1];
        var cmd = (letter + arg).replace('.', '_');
        var args = {};

        if (_lodash2.default.includes(['G', 'M'], letter)) {
            self.cmd = cmd;
            args = _lodash2.default.zipObject(words.slice(1)); // returns an object composed from arrays of property names and values
        } else {
                // Use the same command if the line does not start with Gxx or Mxx.
                // For example:
                // G0 Z0.25
                //  X-0.5 Y0.
                //  Z0.1
                // G01 Z0. F5.
                //  X0.5 Y0. I0. J-0.5
                //  X0. Y-0.5 I-0.5 J0.
                //  X-0.5 Y0. I0. J0.5
                cmd = self.cmd;
                args = _lodash2.default.zipObject(words); // returns an object composed from arrays of property names and values.
            }

        if (typeof self[cmd] === 'function') {
            var func = self[cmd].bind(self);
            func(args);
        }
    });
};

var GCodeInterpreter = (function () {
    function GCodeInterpreter() {
        _classCallCheck(this, GCodeInterpreter);

        this.cmd = '';
    }

    _createClass(GCodeInterpreter, [{
        key: 'interpretStream',
        value: function interpretStream(stream, callback) {
            var _this = this;

            callback = callback || function () {};

            try {
                (function () {
                    var results = [];
                    stream.pipe(new _gcodeParser.GCodeParser()).on('data', function (data) {
                        results.push(data);
                        interpret(_this, data);
                    }).on('end', function () {
                        callback(null, results);
                    }).on('error', callback);
                })();
            } catch (err) {
                callback(err);
                return;
            }

            return stream;
        }
    }, {
        key: 'interpretFile',
        value: function interpretFile(file, callback) {
            file = file || '';
            var s = _fs2.default.createReadStream(file, { encoding: 'utf8' });
            s.on('error', callback);
            return this.interpretStream(s, callback);
        }
    }, {
        key: 'interpretText',
        value: function interpretText(text, callback) {
            var s = streamify(text);
            return this.interpretStream(s, callback);
        }
    }]);

    return GCodeInterpreter;
})();

exports.GCodeInterpreter = GCodeInterpreter;