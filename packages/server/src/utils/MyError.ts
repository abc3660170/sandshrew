class MyError extends Error{
    constructor(message: string, name?: string){
        super( message || 'Default Message')
        this.name = name || 'Error';
    }
}
export default MyError