const mongoose = require('mongoose'),
    job = require('./job'),
    Queue = require('./queue'),
    Worker = require('./worker');

mongoose.Promise = global.Promise;

module.exports = Connection;

/**
 * @constructor
 */
function Connection() {
    this.workers = [];
}

/**
 * Returns a connection db promise
 * @param {string} uri - MongoDB connection string
 * @param {Object} options - connection options
 */
Connection.prototype.connect = function (uri, options) {
    return mongoose.connect(uri, options)
        .then((db) => {
            this.db = db;
        });
};

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
    return new Queue(this, name, options);
};

Connection.prototype.close = function () {
    this.db.close();
    this.terminateWorkers();
};

Connection.prototype.terminateWorkers = function () {
    for(var worker in this.workers) {
        worker.terminate();
    }
};