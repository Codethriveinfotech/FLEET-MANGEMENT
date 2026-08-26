const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packageJsonPath = path.join(__dirname, 'package.json');
const packageJsonBackupPath = path.join(__dirname, 'package.json.bak');

try {
  // 1. Build Expo Web assets
  console.log('Building Expo Web assets...');
  execSync('npx expo export --platform web', { stdio: 'inherit' });

  // 2. Backup package.json
  console.log('Backing up package.json...');
  fs.copyFileSync(packageJsonPath, packageJsonBackupPath);

  // 3. Modify package.json main and dependencies
  console.log('Modifying package.json main entry and clearing dependencies...');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.main = 'electron-main.js';
  packageJson.dependencies = {};
  packageJson.devDependencies = {
    "electron": "31.7.7",
    "electron-builder": "^24.13.3"
  };
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');

  // 4. Run electron-builder
  console.log('Packaging desktop application with electron-builder...');
  execSync('npx electron-builder build --win', { stdio: 'inherit' });

  console.log('Desktop application built successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
} finally {
  // 5. Restore package.json
  if (fs.existsSync(packageJsonBackupPath)) {
    console.log('Restoring package.json...');
    fs.copyFileSync(packageJsonBackupPath, packageJsonPath);
    fs.unlinkSync(packageJsonBackupPath);
  }
}
