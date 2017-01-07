import {
    parseStream,
    parseFile,
    parseFileSync,
    parseString,
    parseStringSync
} from 'gcode-parser';

const noop = () => {};

/**
 * fromPairs([['a', 1], ['b', 2]]);
 * // => { 'a': 1, 'b': 2 }
 */
const fromPairs = (pairs) => {
    let index = -1;
    const length = (!pairs) ? 0 : pairs.length;
    const result = {};

    while (++index < length) {
        const pair = pairs[index];
        result[pair[0]] = pair[1];
    }

    return result;
};

const partitionWordsByGroup = (words = []) => {
    const groups = [];

    for (let i = 0; i < words.length; ++i) {
        const word = words[i];
        const letter = word[0];

        if ((letter === 'G') || (letter === 'M')) {
            groups.push([word]);
            continue;
        }

        if (groups.length > 0) {
            groups[groups.length - 1].push(word);
        } else {
            groups.push([word]);
        }
    }

    return groups;
};

const interpret = (self, data) => {
    const groups = partitionWordsByGroup(data.words);

    for (let i = 0; i < groups.length; ++i) {
        const words = groups[i];
        const word = words[0] || [];
        const letter = word[0];
        const arg = word[1];
        let cmd = (letter + arg);
        let args = {};

        if ((letter === 'G') || (letter === 'M')) {
            self.cmd = cmd;
            args = fromPairs(words.slice(1)); // returns an object composed from arrays of property names and values
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
            args = fromPairs(words); // returns an object composed from arrays of property names and values.
        }

        if (typeof self.handlers[cmd] === 'function') {
            const func = self.handlers[cmd];
            func(args);
        }

        if (typeof self[cmd] === 'function') {
            const func = self[cmd].bind(self);
            func(args);
        }
    }
};

class GCodeInterpreter {
    cmd = '';
    handlers = {};

    constructor(options) {
        options = options || {};
        options.handlers = options.handlers || {};

        this.handlers = options.handlers;
    }
    loadFromStream(stream, callback = noop) {
        const s = parseStream(stream, callback);
        s.on('data', (data) => {
            interpret(this, data);
        });
        return s;
    }
    loadFromFile(file, callback = noop) {
        const s = parseFile(file, callback);
        s.on('data', (data) => {
            interpret(this, data);
        });
        return s;
    }
    loadFromFileSync(file) {
        const list = parseFileSync(file);
        for (let i = 0; i < list.length; ++i) {
            interpret(this, list[i]);
        }
        return list;
    }
    loadFromString(str, callback = noop) {
        const s = parseString(str, callback);
        s.on('data', (data) => {
            interpret(this, data);
        });
        return s;
    }
    loadFromStringSync(str) {
        const list = parseStringSync(str);
        for (let i = 0; i < list.length; ++i) {
            interpret(this, list[i]);
        }
        return list;
    }
}

export {
    GCodeInterpreter
};
