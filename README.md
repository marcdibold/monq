monq-mongoose
====

Monq is a MongoDB-backed job queue for Node.js.

[![NPM](https://img.shields.io/npm/v/monq.svg?style=flat)](http://npm.im/monq)
[![Build Status](https://img.shields.io/travis/scttnlsn/monq.svg?style=flat)](https://travis-ci.org/scttnlsn/monq)

[API Reference](API.md)

Usage
-----

Connect to MongoDB by specifying a URI or providing `host`, `port` and `database` options:

```javascript
var client = require('monq');

client.connect('mongodb://localhost:27017/monq_example', null, function(err, connection) {
  ...
});

```

Enqueue jobs by supplying a job name and a set of parameters.  Below, the job `reverse` is being placed into the `example` queue:

```javascript
var queue = connection.queue('example');

queue.enqueue('reverse', { text: 'foobar' }, function (err, job) {
    console.log('enqueued:', job.data);
});
```

Create workers to process the jobs from one or more queues.  The functions responsible for performing a job must be registered with each worker:

```javascript
var worker = connection.worker(['example']);

worker.register({
    reverse: function (params, callback) {
        try {
            var reversed = params.text.split('').reverse().join('');
            callback(null, reversed);
        } catch (err) {
            callback(err);
        }
    }
});

worker.start();
```

Events
------

Workers will emit various events while processing jobs:

```javascript
worker.on('dequeued', function (data) { … });
worker.on('failed', function (data) { … });
worker.on('complete', function (data) { … });
worker.on('error', function (err) { … });
worker.on('terminated', function (err) { … });
```

Install
-------

    npm install monq

Tests
-----

    npm test

You can optionally specify the MongoDB URI to be used for tests:

    MONGODB_URI=mongodb://localhost:27017/monq_tests npm test

Updating API documentation
--------------------------

`npm run jsdoc2md`
