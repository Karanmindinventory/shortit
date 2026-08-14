const http = require('http');

async function run() {
    console.log('Generating short codes...');
    const codes = [];
    for (let i = 0; i < 200; i++) {
        const res = await new Promise((resolve) => {
            const req = http.request({
                hostname: 'localhost',
                port: 3000,
                path: '/shorten',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, (response) => {
                let data = '';
                response.on('data', chunk => data += chunk);
                response.on('end', () => resolve(JSON.parse(data)));
            });
            req.write(JSON.stringify({ url: "https://benchmark.com/" + i }));
            req.end();
        });
        codes.push(res.code);
    }

    console.log('Codes generated: ', codes.join(', '));
    console.log('Starting concurrent requests...');

    const totalRequests = 1000000;
    let completed = 0;
    const times = [];
    const startAll = Date.now();

    const makeRequest = (code) => {
        return new Promise((resolve) => {
            const start = performance.now();
            const req = http.get(`http://localhost:3000/${code}`, (res) => {
                res.resume(); // free up memory
                res.on('end', () => {
                    const time = performance.now() - start;
                    times.push(time);
                    completed++;
                    resolve();
                });
            }).on('error', (err) => {
                console.error("Error:", err.message);
                resolve();
            });
            // KeepAlive to reuse TCP connections, avoiding port exhaustion during load test
            req.shouldKeepAlive = true;
        });
    };

    // Concurrency of 50
    const concurrency = 50;
    let currentIndex = 0;

    async function worker() {
        while (currentIndex < totalRequests) {
            const index = currentIndex++;
            const code = codes[index % codes.length];
            await makeRequest(code);
        }
    }

    const workers = [];
    for (let i = 0; i < concurrency; i++) {
        workers.push(worker());
    }

    await Promise.all(workers);

    const endAll = Date.now();
    const sum = times.reduce((a, b) => a + b, 0);
    const avg = sum / times.length;

    // Calculate P95 and P99
    times.sort((a, b) => a - b);
    const p95 = times[Math.floor(times.length * 0.95)];
    const p99 = times[Math.floor(times.length * 0.99)];

    console.log(`\n=== BENCHMARK RESULTS ===`);
    console.log(`Total Requests: ${completed}`);
    console.log(`Total Wall Clock Time: ${endAll - startAll} ms`);
    console.log(`Throughput: ${(completed / ((endAll - startAll) / 1000)).toFixed(2)} requests/second`);
    console.log(`-------------------------`);
    console.log(`Average Latency: ${avg.toFixed(2)} ms`);
    console.log(`Fastest Request: ${times[0].toFixed(2)} ms`);
    console.log(`Slowest Request: ${times[times.length - 1].toFixed(2)} ms`);
    console.log(`P95 Latency: ${p95.toFixed(2)} ms`);
    console.log(`P99 Latency: ${p99.toFixed(2)} ms`);
}

run();
