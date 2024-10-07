let midi = require('midi');
let midi_event_bus = new (require('events').EventEmitter)();
let config = require('./AppData.js').config;
let log = console.log.bind(console, 'MidiImplementation.js');
function get_input() {
    log('opening midi port')
    // create a new input
    let input = new midi.Input();
    let opened = false;
    // iterate over the available ports
    for (let i = 0; i < input.getPortCount(); i++) {
        if (input.getPortName(i) === config.midi_portname) {
            let s = input.openPort(i);
            opened = true;
            log('opened port', config.midi_portname, s)
            break;
        }
    }
    if (!opened) {
        log(`Could not find port ${config.midi_portname}`);
        return null;
    }

    input.on('message', async (deltaTime, message) => {
        log(message)
        let on = message[0] === 144;
        let note = message[1];
        let velocity = message[2];
        midi_event_bus.emit('midi',note,velocity, on);

    });

    log('midi port opened');
    return input;
}

let input = null;

// Function to close the MIDI input port
function closeMidiPort() {
    if (input) {
        input.closePort();
        input = null; // Release the reference to the MIDI input object
    }
}

// Cleanup logic when the script exits
process.on('exit', () => {
    closeMidiPort();
});

// Cleanup logic when the script is terminated
process.on('SIGINT', () => {
    closeMidiPort();
    process.exit(); // Terminate the script
});

let port_check = 0;
// Interval to check the MIDI port status
setInterval(() => {
    // Check if the port is still open
    if (!input || !input.getPortCount()) {
        closeMidiPort(); // Close the MIDI port if it's no longer available
        input = get_input(); // Attempt to open the MIDI port again
    }

}, 1000 / 30); // Check the port 30 times a second

module.exports = {
    midi_event_bus: midi_event_bus
}