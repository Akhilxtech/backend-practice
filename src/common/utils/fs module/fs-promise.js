import fs from "node:fs/promises"

const data=await fs.readFile("promise.txt",'utf-8')
console.log(data);

await fs.writeFile("promise.txt","writing from promise");