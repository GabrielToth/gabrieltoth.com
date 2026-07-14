try {
    const { execSync } = require('child_process');
    execSync('npx next build', { 
        stdio: 'inherit',
        env: { ...process.env, NODE_OPTIONS: process.env.NODE_OPTIONS || '' }
    });
} catch (e) {
    console.error('=== BUILD FAILED ===');
    console.error(e.message);
    if (e.stderr) console.error('STDERR:', e.stderr.toString());
    if (e.stdout) {
        const lines = e.stdout.toString().split('\n');
        const last50 = lines.slice(-50).join('\n');
        console.error('LAST 50 LINES:', last50);
    }
    process.exit(1);
}
