let fs = require('fs')
function load_presentation_registry(){
    return fs.readFileSync("presentations.txt", 'utf8').split('\n').reduce((acc, line, i) => {
        let string = line.trim();
        if(string.length > 0){
            acc[i+1] = line.trim(); // the index is 1-indexed
        }
        return acc;
    }, {});
}

let presentations = load_presentation_registry();

// open "tmp.txt" with write mode
fs.open('tmp.txt', 'w', function (err, file) {
    if (err) throw err;
    console.log('Saved!');
    let new_file_text = '';
    // cycle over the presentations object
    for (let key in presentations) {
        new_file_text += key.toString() + ': ' + presentations[key] + '\n';
    }

    fs.write(file, new_file_text, (err) => {
        if (err) throw err;
        console.log('Written to file');
    });
});

