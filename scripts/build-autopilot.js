import child_process from 'child_process';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const AUTOPILOT_DIR = path.join(ROOT_DIR, 'autopilot');
const BUILD_DIR = path.join(AUTOPILOT_DIR, 'build');

async function removeBuildDir() {
    await fs.rm(BUILD_DIR, { recursive: true, force: true });
}

function spawnProcess(command, args) {
    return new Promise((resolve, reject) => {
        const proc = child_process.spawn(command, args, { stdio: 'inherit' });
        proc.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`${command} exited with code ${code}`));
            }
        });
        proc.on('error', (error) => reject(error));
    });
}

function getCMakeConfigureArgs() {
    const args = ['-S', AUTOPILOT_DIR, '-B', BUILD_DIR];
    if (process.platform === 'win32') {
        args.push('-G', 'Visual Studio 18 2026', '-A', 'x64');
    }
    return args;
}

function getCMakeBuildArgs() {
    const args = ['--build', BUILD_DIR];
    if (process.platform === 'win32') {
        args.push('--config', 'Release');
    } else {
        const cpus = Math.max(2, os.cpus()?.length || 2);
        args.push('--', `-j${cpus}`);
    }
    return args;
}

async function buildAutopilot() {
    await removeBuildDir();
    await spawnProcess('cmake', getCMakeConfigureArgs());
    await spawnProcess('cmake', getCMakeBuildArgs());
}

async function main() {
    try {
        await buildAutopilot();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main();
}