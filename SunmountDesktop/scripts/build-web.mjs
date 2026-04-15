import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';

const frontendDir = '/Users/vineetkumarshah/Hackathon/Sunmount /Frontend/pvt';
const desktopRoot = '/Users/vineetkumarshah/Desktop/SunmountDesktop';
const webOutDir = path.join(desktopRoot, 'web');
const frontendDistDir = path.join(frontendDir, 'dist');

const env = {
  ...process.env,
  VITE_API_BASE_URL: 'http://localhost:4000',
  VITE_SOCKET_URL: 'http://localhost:4000'
};

console.log('[build-web] Building frontend with desktop API base URL...');
execSync('npm run build -- --base=./', {
  cwd: frontendDir,
  stdio: 'inherit',
  env
});

if (!existsSync(frontendDistDir)) {
  throw new Error(`Frontend build output not found at ${frontendDistDir}`);
}

rmSync(webOutDir, { recursive: true, force: true });
mkdirSync(webOutDir, { recursive: true });
cpSync(frontendDistDir, webOutDir, { recursive: true });

console.log(`[build-web] Copied build to ${webOutDir}`);
