const fs = require('fs');
const glob = require('glob');

const files = glob.sync('app/api/v1/hackathons/**/route.ts');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Revert auth: "ctx.user!" back to auth: "user"
  content = content.replace(/auth: "ctx\.user!"/g, 'auth: "user"');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Fixed ${file}`);
  }
}
