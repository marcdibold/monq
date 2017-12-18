const monqClient = require('./lib'),
    mongoURI = 'mongodb://localhost/test-db';

class Worker {

    constructor() {
        const options = {};

        this.connection = monqClient(mongoURI, options);
        this.shopifyImportQueue = this.connection.queue('import.shopify.statistic');
        this.shopifyCategoryQueue = this.connection.queue('import.shopify.category');
        this.chargeQueue = this.connection.queue('stripe.charge');
        this.worker = this.connection.worker([ 'import.shopify.statistic', 'import.shopify.category', 'stripe.charge' ]);
        this.worker.on('failed', this.onFailed.bind(this));
        this.worker.on('complete', this.onComplete.bind(this));
        this.worker.on('error', this.onError.bind(this));
    }

    start() {
        this.worker.start();
    }

    register(jobs = {}) {
        this.worker.register(jobs);
    }

    addChargeQueue(type, data) {
        this.chargeQueue.enqueue(type, data, {
            attempts: {
                strategy: 'linear',
                count: 1,
                delay: 5000
            }
        }, (err) => {
            if (err) {
                console.log(err); // eslint-disable-line
                return false;
            }

            return true;
        });
    }

    addImportQueue(type, data) {
        this.shopifyImportQueue.enqueue(type, data, {
            attempts: {
                strategy: 'linear',
                count: 5,
                delay: 5000
            }
        }, (err) => {
                if (err) {
                    console.log(err); // eslint-disable-line
                    return false;
                }

                return true;
        });
    }

    addImportCategoryQueue(type, data) {
        this.shopifyCategoryQueue.enqueue(type, data, {
            attempts: {
                strategy: 'linear',
                count: 5,
                delay: 5000
            }
        }, (err) => {
            if (err) {
                console.log(err); // eslint-disable-line
                return false;
            }

            return true;
        });
    }

    onFailed(data) {
        console.error(data);
    }

    onComplete(data) {
        console.log(data);
    }

    onError(data) {
        console.error(data);
    }

}

const instance = new Worker();

instance.register({
    'test.handler': (data, done) => {
        console.log(data);
        done(null);
    }
});

instance.addImportQueue('test.handler', { name: 'mishab' });
instance.start();





