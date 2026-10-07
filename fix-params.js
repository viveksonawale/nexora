const fs = require('fs');
const glob = require('glob');

const files = glob.sync('app/api/v1/hackathons/**/route.ts');
let fixedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace signature: async (req, { params, user }) => {
  content = content.replace(/async \(\s*req\s*,\s*\{\s*params\s*,\s*user\s*\}\s*\)\s*=>/g, 'async (req, ctx) =>');
  
  // Replace signature: async (req, { params }) => {
  content = content.replace(/async \(\s*req\s*,\s*\{\s*params\s*\}\s*\)\s*=>/g, 'async (req, ctx) =>');

  // Replace param extraction
  content = content.replace(/const\s+\{\s*id\s*\}\s*=\s*params\s+as\s+Record<string,\s*string>\s*;/g, 'const id = ctx.params?.id as string;');
  content = content.replace(/const\s+\{\s*id,\s*([\w]+)\s*\}\s*=\s*params\s+as\s+Record<string,\s*string>\s*;/g, 'const id = ctx.params?.id as string;\n  const $1 = ctx.params?.$1 as string;');

  // Replace user! usage with ctx.user!
  // Be careful not to replace it if it's already ctx.user or if it's in a different context.
  // A safer approach: find the body of the function and replace user! with ctx.user! if we updated the signature to ctx
  if (content !== original) {
    // only if we changed the signature
    content = content.replace(/\buser!?\b(?!\s*:)/g, (match) => {
      // rough heuristic, if it's 'user' or 'user!'
      if (match === 'user' || match === 'user!') return 'ctx.user!';
      return match;
    });
    // clean up 'ctx.ctx.user!' if it happened
    content = content.replace(/ctx\.ctx\.user!/g, 'ctx.user!');
  }

  if (content !== original) {
    fs.writeFileSync(file, content);
    fixedCount++;
    console.log(`Fixed ${file}`);
  }
}
console.log(`Fixed ${fixedCount} files.`);
