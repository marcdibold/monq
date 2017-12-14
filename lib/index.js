var Connection = require('./connection'),
    mongoose = require('mongoose');

mongoose.Promise = global.Promise;

module.exports = function connect(uri, options, callback) {

    function done(err) {
        if(err) {
            callback(err, null);
        }

        var connection = new Connection();
        mongoose.connection.on('error', connection.connectionError.bind(connection));

        callback(err, connection);
    }

    mongoose.connect(uri, options, done);
};