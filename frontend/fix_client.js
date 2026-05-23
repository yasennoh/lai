const fs = require('fs');

['departments', 'employees', 'expenses', 'payroll', 'reports'].forEach(f => {
  const file = './src/app/' + f + '/page.tsx';
  if(fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    if (code.includes('"use client";')) {
      code = code.replace(/"use client";\r?\n/g, '');
      code = '"use client";\n' + code;
      fs.writeFileSync(file, code, 'utf8');
      console.log('Fixed use client in', f);
    }
  }
});
