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

    function connectionFailure(error) {
        self.emit('connectionFailure');
        return self.terminateWorkers(error);
    }

    function reconnectionFailure(error) {
        self.emit('reconnectFailed');
    }

    function reconnectionSuccess() {
        self.emit('reconnected');
        self.resumeWorkers();
    }

    mongoose.connection.on('error', connectionFailure);
    mongoose.connection.on('disconnecting', connectionFailure);
    mongoose.connection.on('disconnected', connectionFailure);
    mongoose.connection.on('close', connectionFailure);

    mongoose.connection.on('reconnectFailed', reconnectionFailure);
    mongoose.connection.on('reconnected', reconnectionSuccess);
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
    return worker;
};

Connection.prototype.queue = function (name, options) {
    return new Queue(name, options);
};

Connection.prototype.close = function () {
    this.db.close();
    this.terminateWorkers();
};

Connection.prototype.terminateWorkers = function () {
    for(var i in this.workers) {
        this.workers[i].terminate();
    }
};

Connection.prototype.resumeWorkers = function () {
    for(var i in this.workers) {
        this.workers[i].resume();
    }
};