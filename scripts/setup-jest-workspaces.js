const fs = require('fs');
const path = require('path');

const appsDir = path.join(__dirname, '..', 'apps');
const apps = fs.readdirSync(appsDir).filter(file => {
  return fs.statSync(path.join(appsDir, file)).isDirectory();
});

console.log(`Configuring Jest (.cjs) across ${apps.length} workspaces...`);

apps.forEach(app => {
  const appDir = path.join(appsDir, app);
  
  // Remove old jest.config.js if exists
  const oldConfig = path.join(appDir, 'jest.config.js');
  if (fs.existsSync(oldConfig)) {
    fs.unlinkSync(oldConfig);
  }

  // 1. Create jest.config.cjs
  const jestConfigPath = path.join(appDir, 'jest.config.cjs');
  const jestConfigContent = `const baseConfig = require('../../jest.config.base');

module.exports = {
  ...baseConfig,
  displayName: '${app}',
};
`;
  fs.writeFileSync(jestConfigPath, jestConfigContent, 'utf8');
  console.log(`✅ Created jest.config.cjs for ${app}`);

  // 2. Update package.json
  const pkgPath = path.join(appDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.scripts = pkg.scripts || {};
    pkg.scripts.test = 'jest --config jest.config.cjs --passWithNoTests';
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    console.log(`✅ Updated test script in package.json for ${app}`);
  }
});

console.log('🎉 All workspaces configured for Jest (.cjs)!');
