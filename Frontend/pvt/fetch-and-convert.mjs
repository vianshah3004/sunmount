import fs from 'fs/promises';

const screens = [
    { name: 'Sales', url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzUwN2U3OTYxYzkwYjQ0ZjViMDIzNTg2OTllOTg5ZDUxEgsSBxCO9IOiww0YAZIBJAoKcHJvamVjdF9pZBIWQhQxNzc1NDA5MjU2NzE1MDA4ODYzOQ&filename=&opi=89354086" },
    { name: 'Manufacturing', url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzBjNWU1OWM4Zjk2ZjQzZmQ4ODlhYjc1NGM3MTgxODExEgsSBxCO9IOiww0YAZIBJAoKcHJvamVjdF9pZBIWQhQxNzc1NDA5MjU2NzE1MDA4ODYzOQ&filename=&opi=89354086" },
    { name: 'Customers', url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzZiNWJhZjhjYjJjNTQwMjZhOGU3MGEwMDZmOWEyOGRhEgsSBxCO9IOiww0YAZIBJAoKcHJvamVjdF9pZBIWQhQxNzc1NDA5MjU2NzE1MDA4ODYzOQ&filename=&opi=89354086" },
    { name: 'Reports', url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzQxNTExYWUxMjhlYzRjYjQ4YmI0NDYzZDA4OTlhZGVkEgsSBxCO9IOiww0YAZIBJAoKcHJvamVjdF9pZBIWQhQxNzc1NDA5MjU2NzE1MDA4ODYzOQ&filename=&opi=89354086" },
    { name: 'Settings', url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2YwNDdhZDZhMWY5NzQzYjdiZDM4MjlmM2RkMzM4OTZlEgsSBxCO9IOiww0YAZIBJAoKcHJvamVjdF9pZBIWQhQxNzc1NDA5MjU2NzE1MDA4ODYzOQ&filename=&opi=89354086" },
    { name: 'NotificationPanel', url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzc1NDI3YjNiYjdkNDQ2YzFiMjQwNTg4YWE0YmM5ZmM3EgsSBxCO9IOiww0YAZIBJAoKcHJvamVjdF9pZBIWQhQxNzc1NDA5MjU2NzE1MDA4ODYzOQ&filename=&opi=89354086" },
    { name: 'CreateEditOrder', url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2YyYmNhNzM1NjdkMDQyNzRhOTM0MWRiMGVhNWJhZDI3EgsSBxCO9IOiww0YAZIBJAoKcHJvamVjdF9pZBIWQhQxNzc1NDA5MjU2NzE1MDA4ODYzOQ&filename=&opi=89354086" },
    { name: 'OrderDetailModal', url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2U0ZTUyMmVmZTVhMTRhNGQ4NjhiNmFlODU5YzYzYTAxEgsSBxCO9IOiww0YAZIBJAoKcHJvamVjdF9pZBIWQhQxNzc1NDA5MjU2NzE1MDA4ODYzOQ&filename=&opi=89354086" }
];

async function convert() {
    for (const screen of screens) {
        console.log("Fetching " + screen.name);
        const res = await fetch(screen.url);
        let html = await res.text();
        
        let bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (!bodyMatch) continue;
        let body = bodyMatch[1];
        
        body = body.replace(/<!-- SideNavBar Anchor -->[\s\S]*?<\/aside>/i, '');
        body = body.replace(/<!--[\s\S]*?-->/g, "");
        body = body.replace(/class=/g, "className=");
        body = body.replace(/for=/g, "htmlFor=");
        
        body = body.replace(/<img(.*?)>/g, (m, p) => p.endsWith("/") ? m : "<img" + p + " />");
        body = body.replace(/<input(.*?)>/g, (m, p) => p.endsWith("/") ? m : "<input" + p + " />");
        body = body.replace(/<br>/g, "<br/>");
        body = body.replace(/<hr>/g, "<hr/>");
        
        body = body.replace(/style="([^"]*)"/g, (match, p1) => {
            if (p1.includes("font-variation-settings")) {
                let val = p1.split(':')[1].replace(';', '').trim();
                return `style={{ fontVariationSettings: "${val}" }}`;
            }
            if (p1.includes("width:")) {
                let val = p1.split(':')[1].replace(';', '').trim();
                return `style={{ width: "${val}" }}`;
            }
            if (p1.includes("--progress:")) {
                let val = p1.split(':')[1].replace(';', '').trim();
                return `style={{ "--progress": "${val}" }}`;
            }
            return "";
        });

        const jsx = `
export default function ${screen.name}() {
  return (
    <>
      ${body}
    </>
  );
}`;
        await fs.writeFile(`src/pages/${screen.name}.jsx`, jsx);
    }
}
convert();
