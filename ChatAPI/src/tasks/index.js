import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const path = join(__dirname);
const postfix = ".task.js";

const entries = fs.readdirSync(path).filter((task) => task.endsWith(postfix));
const taskMap = {};
for (const fileName of entries) {
    const name = fileName.replace(postfix, "");
    const mod = await import(`./${fileName}`);
    taskMap[name] = mod.default;
}
export default taskMap;
