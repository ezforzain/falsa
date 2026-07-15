const path = process.argv[2];
let data = '';
process.stdin.on('data', (c) => (data += c));
process.stdin.on('end', () => {
  try {
    const obj = JSON.parse(data);
    const parts = path.split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur == null) break;
      cur = cur[p];
    }
    console.log(typeof cur === 'object' && cur !== null ? JSON.stringify(cur) : cur);
  } catch {
    console.log('');
  }
});
