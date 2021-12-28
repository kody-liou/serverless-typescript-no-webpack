const fs = require('fs');
const path = require('path');

const a = fs.readFileSync(path.resolve(__dirname, './IMG20201004134009.jpg'));
console.log(a);
