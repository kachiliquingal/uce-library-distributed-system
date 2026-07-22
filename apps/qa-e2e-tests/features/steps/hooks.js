const { Before, After, setDefaultTimeout } = require('@cucumber/cucumber');
const { createDriver, quitDriver, getDriver } = require('./driver-holder');
const fs = require('fs');
const path = require('path');

setDefaultTimeout(30 * 1000);

Before(async function () {
    await createDriver();
});

After(async function (scenario) {
    const driver = getDriver();
    if (driver) {
        try {
            const screen = await driver.takeScreenshot();
            const screenshotsDir = path.join(process.cwd(), 'screenshots');
            if (!fs.existsSync(screenshotsDir)) {
                fs.mkdirSync(screenshotsDir, { recursive: true });
            }
            const safeName = scenario.pickle.name.replace(/[^a-zA-Z0-9]/g, '_');
            const filePath = path.join(screenshotsDir, `${safeName}.png`);
            fs.writeFileSync(filePath, screen, 'base64');
        } catch (error) {
            console.error('Error taking screenshot:', error);
        }
    }
    await quitDriver();
});
