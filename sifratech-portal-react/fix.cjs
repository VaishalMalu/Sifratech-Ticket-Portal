const fs = require('fs');
let c = fs.readFileSync('src/components/TicketDetailModal.jsx', 'utf8');

c = c.replace(/c\.msg\.split\(\/\(\\\\\\[\.\*\?\\\\\\]\\\\\\(\.\*\?\\\\\\)\)\/g\)/, 'c.msg.split(/(\\[.*?\\]\\(.*?\\))/g)');
c = c.replace(/const m = part\.match\(\/\\\\\[\(\.\*\?\)\\\\\\]\\\\\\(\(\.\*\?\)\\\\\\)\/\)/, 'const m = part.match(/\\[(.*?)\\]\\((.*?)\\)/)');
c = c.replace(/const isImage = url\.match\(\/\\\\\\.\(jpeg\|jpg\|gif\|png\|webp\)\(\\\\\\?\.\*\)\?\\\$\/i\) \|\| m\[1\]\.match\(\/\\\\\\.\(jpeg\|jpg\|gif\|png\|webp\)\\\$\/i\)/, 'const isImage = url.match(/\\.(jpeg|jpg|gif|png|webp)(\\?.*)?$/i) || m[1].match(/\\.(jpeg|jpg|gif|png|webp)$/i)');

fs.writeFileSync('src/components/TicketDetailModal.jsx', c);
console.log('Fixed regex in TicketDetailModal.jsx');
