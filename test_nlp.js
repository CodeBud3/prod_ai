
import { parseTaskInput } from './src/utils/nlp.js';

const input = "refactor dem tomorrow :50 pm";
const result = parseTaskInput(input);

console.log(JSON.stringify(result, null, 2));
