import path from 'path';
import fs from 'fs';

// Prepend native DLL directories to process.env.PATH on Windows
// This ensures sharp and libvips dependencies (libvips-42.dll) can be located by LoadLibraryEx
if (process.platform === 'win32') {
  const possiblePaths = [
    // Packaged application path in resources/app.asar.unpacked
    process.resourcesPath
      ? path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', '@img', 'sharp-win32-x64', 'lib')
      : '',
    // Fallback relative to __dirname (when main.js is in dist-electron)
    path.join(__dirname, '..', 'node_modules', '@img', 'sharp-win32-x64', 'lib'),
    path.join(__dirname, '..', '..', 'node_modules', '@img', 'sharp-win32-x64', 'lib'),
    // Fallback relative to current working directory
    path.join(process.cwd(), 'node_modules', '@img', 'sharp-win32-x64', 'lib'),
    path.join(process.cwd(), 'resources', 'app.asar.unpacked', 'node_modules', '@img', 'sharp-win32-x64', 'lib'),
  ].filter(Boolean);

  for (const dllPath of possiblePaths) {
    try {
      if (fs.existsSync(dllPath)) {
        const currentPath = process.env.PATH || '';
        if (!currentPath.split(';').includes(dllPath)) {
          process.env.PATH = `${dllPath};${currentPath}`;
        }
        break;
      }
    } catch {
      // Ignore filesystem permission errors during check
    }
  }
}
