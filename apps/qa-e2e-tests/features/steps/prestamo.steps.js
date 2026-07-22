const { Given, When, Then } = require('@cucumber/cucumber');
const { By, until } = require('selenium-webdriver');
const assert = require('assert');
const { BASE_URL } = require('../../config');
const { getDriver } = require('./driver-holder');

Given('el usuario {string} ha iniciado sesión', async function (email) {
    const driver = getDriver();
    await driver.get(`${BASE_URL}/login`);
    await driver.sleep(1000);

    // Login rápido para tener sesión
    await driver.findElement(By.css('input[type="email"], input[name="email"]')).sendKeys(email);
    await driver.findElement(By.css('input[type="password"], input[name="password"]')).sendKeys('TestSeguro2026');
    await driver.findElement(By.css('button[type="submit"]')).click();

    await driver.wait(async () => {
        const currentUrl = await driver.getCurrentUrl();
        return !currentUrl.includes('/login');
    }, 8000);
});

When('busca el libro {string}', async function (nombreLibro) {
    const driver = getDriver();
    // Busca una barra de búsqueda y envía el nombre
    const searchInput = await driver.wait(until.elementLocated(By.css('input[type="search"], input[placeholder*="Buscar"]')), 5000);
    await searchInput.sendKeys(nombreLibro);

    // Si hay un botón de buscar, presionarlo (sino asume que busca en vivo)
    try {
        const searchBtn = await driver.findElement(By.xpath("//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'buscar')]"));
        await searchBtn.click();
    } catch (e) {
        // No hay botón, búsqueda asíncrona
    }
    await driver.sleep(2000);
});

When('selecciona la opción de prestar', async function () {
    const driver = getDriver();
    // Busca el botón que diga Prestar o Loan
    const prestarBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'prestar') or contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'loan')]")), 5000);
    await prestarBtn.click();
    await driver.sleep(1000);
});

Then('el sistema muestra un mensaje de éxito', async function () {
    const driver = getDriver();
    // Busca la notificación de react-hot-toast por texto
    const successMsg = await driver.wait(until.elementLocated(By.xpath("//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'exitoso') or contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'éxito')]")), 5000);
    const texto = await successMsg.getText();
    assert.ok(texto.length > 0, 'No se encontró mensaje de éxito');
});

Then('el sistema muestra el botón "No disponible" para el libro', async function () {
    const driver = getDriver();
    // Busca el botón que diga 'No disponible'
    const unavailableBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'no disponible')]")), 5000);
    const texto = await unavailableBtn.getText();
    assert.ok(texto.toLowerCase().includes('no disponible'), 'No se encontró el botón de no disponible');
    
    // Verifica que esté deshabilitado
    const isDisabled = await unavailableBtn.getAttribute('disabled');
    assert.ok(isDisabled, 'El botón debería estar deshabilitado');
});
