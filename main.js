let midiImplementation = require('./src/MidiImplementation.js');
let AppData = require('./src/AppData.js');
let ProPresenter7 = new (require('./src/ProPresenter7.js'))();
let log = (...a) => {console.log('main.js', ...a)}



let presentations = AppData.presentations_registry;
AppData.notifications.on('AppData.presentations_registry:updated', (presentations_registry) => {
    presentations = presentations_registry;
    log('presentations updated')
});

let playlist_items_url = null;
let playlist_items = [];
ProPresenter7.watch('playlist/active');
ProPresenter7.event_bus.on('playlist/active', (data) => {
    let id = data.presentation.playlist.uuid;
    let url = `/v1/playlist/${id}`;
    if(url === playlist_items_url){
        return;
    }
    playlist_items_url = url;
    ProPresenter7.fetch(url).then(response => response.json()).then(data => {
        playlist_items = data.items;
        log('playlist items updated',playlist_items.map(item => item.id.name))
    })

});
ProPresenter7.start_watching();

midiImplementation.midi_event_bus.on('midi',async  (note, velocity, on) => {
    switch (note) {
        case 18:
            log('presentation', presentations[velocity])
            let presentation_name = presentations[velocity];
            if ( ! presentation_name){
                log('no presentation found for', velocity)
                break;
            }
            let match = playlist_items.find(item => item.id.name === presentation_name);
            if(! match){
                // no exact match, let's try to find a starting match
                match = playlist_items.find(item => item.id.name.startsWith(presentation_name));
            }
            if( ! match){
                log('no match found for', presentation_name,playlist_items.map(item => item.id.name))
                break;
            }
            await fetch(AppData.pp7_url(`/v1/playlist/active/presentation/${match.id.index}/trigger` ))

            break;
        case 19:
            let index = velocity - 1;
            try {
                await ProPresenter7.fetch(`/v1/presentation/active/${index}/trigger`)
            }catch (e){
                log('error triggering slide', e)
            }
            break;
        default:
            log('unknown note', note)
            break;
    }
})