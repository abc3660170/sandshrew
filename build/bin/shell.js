const command = process.argv[2];

var localNpm = require('../local-npm');
if(command === 'start'){
    var app = localNpm(command);
    setTimeout(() => {
        app.shutdown();
    },4000)
}
