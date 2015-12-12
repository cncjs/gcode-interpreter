import _ from 'lodash';
import fs from 'fs';
import stream from 'stream';
import { GCodeParser } from 'gcode-parser';

const streamify = (text) => {
    let s = new stream.Readable();
    s.push(text);
    s.push(null);
    return s;
};

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
        let cmd = (letter + arg).replace('.', '_');
        let args = {};

        if (_.includes(['G', 'M'], letter)) {
            self.cmd = cmd;
            args = _.zipObject(words.slice(1)); // returns an object composed from arrays of property names and values
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
            args = _.zipObject(words); // returns an object composed from arrays of property names and values.
        }

        if (typeof self[cmd] === 'function') {
            let func = self[cmd].bind(self);
            func(args);
        }
    });
};

class GCodeInterpreter {
    cmd = '';
    _callbacks = {
        'data': [],
        'end': []
    };

    on(evt, callback) {
        this._callbacks[evt] && this._callbacks[evt].push(callback);
        return this;
    }
    interpretStream(stream, callback) {
        callback = callback || (() => {});

        try {
            let results = [];
            stream.pipe(new GCodeParser())
                .on('data', (data) => {
                    this._callbacks['data'].forEach((f) => {
                        f(data);
                    });
                    results.push(data);
                    interpret(this, data);
                })
                .on('end', () => {
                    this._callbacks['end'].forEach((f) => {
                        f(results);
                    });
                    callback(null, results);
                })
                .on('error', (err) => {
                    callback(err);
                });
        }
        catch(err) {
            callback(err);
            return this;
        }

        return this;
    }
    interpretFile(file, callback) {
        file = file || '';
        let s = fs.createReadStream(file, { encoding: 'utf8' });
        s.on('error', callback);
        return this.interpretStream(s, callback);
    }
    interpretText(text, callback) {
        let s = streamify(text);
        return this.interpretStream(s, callback);
    }
}

export {
    GCodeInterpreter
};
