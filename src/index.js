import _ from 'lodash';
import { parseFile, parseStream, parseString } from 'gcode-parser';

const noop = () => {};

const partitionWordsByGroup = (words) => {
    let groups = [];

    _.each(words, (word) => {
        let letter = word[0];
        let argument = word[1];

        if (_.includes(['G', 'M'], letter)) {
            groups.push([word]);
            return;
        }

        if (_.size(groups) > 0) {
            groups[groups.length - 1].push(word);
        } else {
            groups.push([word]);
        }
    });

    return groups;
};

const interpret = (self, data) => {
    let groups = partitionWordsByGroup(data.words);
    _.each(groups, (words) => {
        let word = words[0] || [];
        let letter = word[0];
        let arg = word[1];
        let cmd = (letter + arg);
        let args = {};

        if (_.includes(['G', 'M'], letter)) {
            self.cmd = cmd;
            args = _.fromPairs(words.slice(1)); // returns an object composed from arrays of property names and values
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
            args = _.fromPairs(words); // returns an object composed from arrays of property names and values.
        }

        if (typeof self.handlers[cmd] === 'function') {
            let func = self.handlers[cmd];
            func(args);
        }

        if (typeof self[cmd] === 'function') {
            let func = self[cmd].bind(self);
            func(args);
        }
    });
};

class GCodeInterpreter {
    cmd = '';
    handlers = {};

    constructor(options) {
        super();

        options = options || {};
        options.handlers = options.handlers || {};

        this.handlers = options.handlers;
    }
    loadFromStream(stream, callback = noop) {
        let s = parseStream(stream, callback);
        s.on('data', (data) => {
            interpret(this, data);
        });
        return s;
    }
    loadFromFile(file, callback = noop) {
        let s = parseFile(file, callback);
        s.on('data', (data) => {
            interpret(this, data);
        });
        return s;
    }
    loadFromString(str, callback = noop) {
        let s = parseString(str, callback);
        s.on('data', (data) => {
            interpret(this, data);
        });
        return s;
    }
}

export {
    GCodeInterpreter
};
