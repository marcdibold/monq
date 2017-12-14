var Connection = require('./connection'),
    mongoose = require('mongoose');

mongoose.Promise = global.Promise;

function connect(uri, options, callback) {
    if(arguments.length < 2) throw new Error('Specify connection URI and callback');

    function done(err) {
        if(err) {
            callback(err, null);
        }

        var connection = new Connection();
        mongoose.connection.on('error', connection.connectionError.bind(connection));

        callback(err, connection);
    }

    options = options || {};
    options.useMongoClient = true;
    mongoose.connect(uri, options, done);
};

exports.connect = connect;