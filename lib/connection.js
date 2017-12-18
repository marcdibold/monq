var Queue = require('./queue');
var Worker = require('./worker');
var events = require('events');
var util = require('util');
var mongoose = require('mongoose');

mongoose.Promise = global.Promise;

module.exports = Connection;

/**
 * @constructor
 */
function Connection(uri, options) {
    this.workers = [];

    options = options || {};
    options.useMongoClient = true;

    mongoose.connect(uri, options);

    var self = this;
    mongoose.connection.on('error', function (error) {
        return self.connectionError(error);
    });
}

util.inherits(Connection, events.EventEmitter);

/**
* Returns a new {@link Worker}
* @param {string[]|string} queues - list of queue names, a single queue name, or '*' for a universal worker
* @param {Object} options - an object with worker options
*/
Connection.prototype.worker = function (queues, options) {
    var self = this;

    options || (options = {});

    var collection = options.collection || 'jobs';

    if (queues === "*") {
        options.universal = true;

        queues = [self.queue('*', {
          universal: true,
          collection: collection
        })];
    } else {
        if (!Array.isArray(queues)) {
            queues = [queues];
        }

        var queues = queues.map(function (queue) {
            if (typeof queue === 'string') {
                queue = self.queue(queue, {
                  collection: collection
                });
            }

            return queue;
        });
    }

    var worker = new Worker(queues, options);
    self.workers.push(worker);
    return new Worker(queues, options);
};

Connection.prototype.queue = function (name, options) {
    return new Queue(name, options);
};

Connection.prototype.close = function () {
    this.db.close();
    this.terminateWorkers();
};

Connection.prototype.connectionError = function (error) {
    this.terminateWorkers(error);
    this.emit('error', error);
};

Connection.prototype.terminateWorkers = function (error) {
    for(var worker in this.workers) {
        worker.terminate(error);
    }
};