/**
 * Validates the ids for all the files in the data directory. If there are errors,
 * it will print them to stderr and write them to a "id-errors.txt" file.
 */
const fs = require('fs');

const walk = function(dir) {
    var results = [];
    var list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        var stat = fs.statSync(file);
        if (stat && stat.isDirectory()) results = results.concat(walk(file));
        else results.push(file);
    });
    return results;
}

const errors = [];
function error(msg) {
    console.error(msg);
    errors.push(msg);
}

const ids = {};
const childrenIds = {};
for(const file of walk('data')) {
    const obj = JSON.parse(fs.readFileSync(file));
    const match = /^data\/(.+?)\//.exec(file);
    const data_type = match ? match[1] : 'null';
    const key = data_type + '::' + obj.id;

    if(ids[key])
        error(`Found duplicate id "${obj.id}" at ${file} and ${ids[key]}!`);
    else {
        ids[key] = file;
        switch(data_type) {
            case 'class':
                childrenIds[key] = obj.races.map(a => 'discipline::' + a).concat(obj.powers.map(a => 'power::' + a));
                break;
            case 'power':
                childrenIds[key] = obj.sources.map(a => a.type + '::' + a.id);
                break;
            case 'discipline':
                childrenIds[key] = obj.classes.map(a => 'class::' + a).concat(obj.powers.map(a => 'power::' + a));
                break;
        }
    }
}

for(const id in childrenIds) {
    for(const cid of childrenIds[id]) {
        if(!ids[cid])
            error(`Found missing child-id for object ${id}: ${cid}`);
    }
}

if(errors.length) {
    fs.writeFileSync('error-ids.txt', errors.join('\n'));
}