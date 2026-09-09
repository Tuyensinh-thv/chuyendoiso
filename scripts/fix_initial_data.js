import fs from 'fs';

const filePath = './src/data/initialData.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// Match `approvalStatus: 'Chua_Nop'\n  },` where tiendo is not present before it
content = content.replace(/(\s+approvalStatus:\s*'Chua_Nop')(\s*\n\s*\},)/g, (match, p1, p2) => {
  return `${p1},\n    tiendo: 0,\n    mucDoUuTien: 'Bình thường'${p2}`;
});

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Fixed initialData.ts');
