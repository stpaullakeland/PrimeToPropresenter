let log = console.log.bind(console, 'ProPresenter7.js')
function decodeChunk(chunk) {
    // Split the chunk data into individual decimal values
    const values = chunk.split(',');

    // Convert each decimal value to its corresponding ASCII character
    let decodedChunk = '';
    for (let i = 0; i < values.length; i++) {
        decodedChunk += String.fromCharCode(parseInt(values[i]));
    }

    return decodedChunk;
}
class ProPresenter7{
    constructor(){
        this.event_bus = new (require('events').EventEmitter)();
        this.endpoint_watchers = [];

        this.started_watching_times = 0;

        this.data = new Proxy({},{
            get: (target, prop) => {
                return target[prop];
            },
            set: (target, prop, value) => {
                this.event_bus.emit(prop,value);
                target[prop] = value;
                return true;
            }
        })

    }

    add_watcher(endpoint,callback){
        this.endpoint_watchers.push({endpoint: endpoint, callback: callback});
        return this;
    }

    watch(endpoint){
        this.endpoint_watchers.push({endpoint: endpoint, callback: data => {
            this.data[endpoint] = data;
        }});

        return this;
    }



    start_watching(){
        fetch(require('./AppData.js').pp7_url(`/v1/status/updates`), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(this.endpoint_watchers.map(watcher => watcher.endpoint))
        }).then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            // Return the response body as a ReadableStream
            return response.body;
        })
            .then(body => {
                const reader = body.getReader();

                let read = () => {
                    reader.read()
                        .then(({done, value}) => {
                            if (done) {
                                // Reinitialize the listener after response ends
                                setTimeout(() => {
                                    this.start_watching();
                                }, 500);
                                return;
                            }
                            // Trigger the callback with each received chunk
                            let array_of_json_strings = decodeChunk(value.toString()).split('\r').map(x => x.trim()).filter(x => x.length > 0);
                            let dataList = array_of_json_strings.map(chunked_data => JSON.parse(chunked_data))

                            dataList.forEach(data => {
                                this.endpoint_watchers.filter(watcher => watcher.endpoint === data.url).forEach(watcher => {
                                    this.data[watcher.endpoint] = data.data;
                                    watcher.callback(data.data);
                                })
                            });

                            // Continue reading the next chunk
                            read();
                        })
                        .catch(error => {
                            setTimeout(() => {
                                // Reinitialize the listener in case of an error
                                this.start_watching()
                            }, 500);
                        });
                }

                // Start reading chunks
                read();
            })
            .catch(error => {
                setTimeout(() => {
                    // Reinitialize the listener in case of an error
                    this.start_watching();
                }, 500);
            });
    }

    fetch(relative_url, options){
        let url = require('./AppData.js').pp7_url(relative_url);
        log('fetching',url)
        return fetch(url, options);
    }
}

module.exports = ProPresenter7;