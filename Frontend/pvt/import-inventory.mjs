import fs from 'fs/promises';

const url = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2M1NDkyMjY5YzI1YjQzYzZhYzFmNmI3MjQ0ZTk4OTg1EgsSBxCO9IOiww0YAZIBJAoKcHJvamVjdF9pZBIWQhQxNzc1NDA5MjU2NzE1MDA4ODYzOQ&filename=&opi=89354086";

async function run() {
    console.log("Fetching...");
    const res = await fetch(url);
    const html = await res.text();
    await fs.writeFile("Inventory.html", html);
    console.log("Done");
}
run();
