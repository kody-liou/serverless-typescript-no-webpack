import fs from 'fs';
import path from 'path';

const a = fs.readFileSync(
  path.resolve(__dirname, '../assets/IMG20201004134009.jpg'),
);
console.log(a);