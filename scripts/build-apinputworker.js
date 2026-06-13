import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const rootDir = process.cwd();
const javaDir = path.join(rootDir, 'apinputworker');
const binDir = path.join(javaDir, 'bin');
const jarPath = path.join(javaDir, 'InputWorker.jar');
const manifestPath = path.join(javaDir, 'manifest.txt');

function getJarCommand() {
    if (os.platform() === 'win32') {
        try {
            const javaProgramFiles = 'C:\\Program Files\\Java';
            if (fs.existsSync(javaProgramFiles)) {
                const items = fs.readdirSync(javaProgramFiles);
                const jdkDir = items.find(item => item.toLowerCase().startsWith('jdk-'));
                if (jdkDir) {
                    const fullJarPath = path.join(javaProgramFiles, jdkDir, 'bin', 'jar.exe');
                    if (fs.existsSync(fullJarPath)) return `"${fullJarPath}"`;
                }
            }
        } catch (e) {}
    }
    return 'jar';
}

try {
    console.log('[1/3] Cleaning old build directories...');
    if (fs.existsSync(binDir)) fs.rmSync(binDir, { recursive: true, force: true });
    fs.mkdirSync(binDir, { recursive: true });

    console.log('[2/3] Compiling clean Java source files...');
    execSync('javac -d bin src/InputWorker.java', { cwd: javaDir, stdio: 'inherit' });

    console.log('[3/3] Generating manifest and packaging JAR...');
    fs.writeFileSync(manifestPath, 'Main-Class: Main.InputWorker\n', 'utf8');
    
    const jarCmd = getJarCommand();
    execSync(`${jarCmd} cvfm "${jarPath}" manifest.txt -C bin .`, { cwd: javaDir, stdio: 'inherit' });

    console.log('\n✅ Standalone InputWorker.jar generated successfully!');
} catch (error) {
    console.error('\n❌ Build Failed.');
    process.exit(1);
}