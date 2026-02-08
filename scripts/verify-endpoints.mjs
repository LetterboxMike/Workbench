// using global fetch

async function verify() {
    const baseUrl = process.env.WORKBENCH_BASE_URL || 'http://localhost:4000';
    const endpoints = [
        '/api/auth/session',
        '/api/auth/me',
        '/api/health' // Checking if a health endpoint exists or 404s
    ];

    console.log(`Verifying endpoints at ${baseUrl}...`);

    for (const endpoint of endpoints) {
        try {
            const start = Date.now();
            const response = await fetch(`${baseUrl}${endpoint}`);
            const duration = Date.now() - start;

            console.log(`[${response.status}] ${endpoint} (${duration}ms)`);

            if (response.status === 200) {
                try {
                    const data = await response.json();
                    console.log(`  Preview: ${JSON.stringify(data).slice(0, 100)}...`);
                } catch (e) {
                    console.log(`  Could not parse JSON: ${e.message}`);
                }
            } else {
                console.log(`  Status Text: ${response.statusText}`);
                try {
                    const text = await response.text();
                    console.log(`  Body Preview: ${text.slice(0, 100)}...`);
                } catch (e) { }
            }

        } catch (error) {
            console.error(`[ERROR] ${endpoint}: ${error.message}`);
            if (error.cause) console.error('  Cause:', error.cause);
        }
    }
}

verify().catch(console.error);
