import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('BROWSER ERROR:', msg.text());
        }
    });

    page.on('pageerror', error => {
        console.log('PAGE ERROR:', error.message);
    });

    try {
        await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0', timeout: 15000 });

        // Fill login form
        await page.type('input[type="email"]', 'resident@test.com');
        await page.type('input[type="password"]', 'password');
        await page.click('button[type="submit"]');

        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => console.log("No nav"));
        await new Promise(r => setTimeout(r, 2000));

        console.log('Finished waiting.');
    } catch (e) {
        console.error("Script error:", e.message);
    }

    await browser.close();
})();
