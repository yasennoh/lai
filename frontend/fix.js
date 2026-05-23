const fs = require('fs');

function fixFile(f) {
  const file = './src/app/' + f + '/page.tsx';
  if(!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');
  
  if(!code.includes('import { useLanguage }')) {
    code = "import { useLanguage } from '../components/LanguageContext';\n" + code;
  }
  
  const m = code.match(/export default function [a-zA-Z]+\(\) \{/);
  if(m && !code.includes('const { locale } = useLanguage();')) {
    code = code.replace(m[0], m[0] + '\n  const { locale } = useLanguage();');
  }

  fs.writeFileSync(file, code, 'utf8');
  console.log('Fixed', f);
}

['departments', 'employees', 'expenses', 'payroll', 'reports'].forEach(fixFile);
