class MyError extends Error{
    constructor(message, name){
        super( message || 'Default Message')
        this.name = name || 'Error';
    }
}

module.exports = MyError