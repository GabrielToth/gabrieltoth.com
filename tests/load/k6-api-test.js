import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 20 }, // Ramp-up to 20 virtual users
        { duration: '1m', target: 50 },  // Stay at 50 virtual users
        { duration: '30s', target: 0 },  // Ramp-down to 0
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests must complete within 500ms
        http_req_failed: ['rate<0.01'],    // Less than 1% failure rate
    },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';

export default function () {
    // 1. Health Endpoint
    const healthRes = http.get(`${BASE_URL}/api/health`);
    check(healthRes, {
        'health status is 200': (r) => r.status === 200,
    });

    sleep(1);

    // 2. Sitemap Endpoint
    const sitemapRes = http.get(`${BASE_URL}/sitemap.xml`);
    check(sitemapRes, {
        'sitemap status is 200': (r) => r.status === 200,
        'sitemap content-type is xml': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('xml'),
    });

    sleep(1);

    // 3. Contact API Rate Limit Test
    const contactPayload = JSON.stringify({
        name: 'LoadTester',
        email: 'test@example.com',
        subject: 'Load Test Message',
        message: 'Automated load test execution by k6 suite.',
    });

    const contactHeaders = { 'Content-Type': 'application/json' };
    const contactRes = http.post(`${BASE_URL}/api/contact`, contactPayload, { headers: contactHeaders });

    check(contactRes, {
        'contact API accepts or rate-limits correctly': (r) => r.status === 200 || r.status === 429,
    });

    sleep(2);
}
