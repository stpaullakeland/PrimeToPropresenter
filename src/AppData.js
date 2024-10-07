const fs = require('fs');
const ini = require('ini');
let log = console.log.bind(console, 'AppData.js')

let notifications = new (require('events').EventEmitter)();
function load_app_ini(){
    let iniData = fs.readFileSync('app.ini', 'utf8');
    return ini.parse(iniData);
}
let config = load_app_ini();
let last_initialized = Date.now();


function load_presentation_registry(){
    return fs.readFileSync(config.presentations_file, 'utf8').split('\n').reduce((acc, line, i) => {
        let string = line.trim();
        if(string.length > 0){
            acc[i+1] = line.trim(); // the index is 1-indexed
        }
        return acc;
    }, {});
}

let presentations_loaded_timestamp = Date.now();
let presentations_registry = load_presentation_registry();

setInterval(() => {

    // let's reload the app.ini file if it has been updated
    if (fs.statSync('app.ini').mtimeMs > last_initialized){
        log('reloading app.ini')
        try{
            config = load_app_ini();
            last_initialized = Date.now();
            notifications.emit('AppData.config:updated')
        }catch(e){
            log('error loading app.ini', e)
        }
    }


    // we want to check if the presentations file has been updated since we last loaded it
    if (fs.statSync(config.presentations_file).mtimeMs > presentations_loaded_timestamp){
        log('reloading presentations')
        try{
            presentations_registry = load_presentation_registry();
            notifications.emit('AppData.presentations_registry:updated', presentations_registry)
            presentations_loaded_timestamp = Date.now();
        }catch(e){
            log('error loading presentations', e)
        }
    }
},1000 / 30);// 30fps

module.exports = {
    config,
    presentations_registry,
    notifications,
    pp7_url: (path) => {
        return config.pp7_api_base + path;
    }
}