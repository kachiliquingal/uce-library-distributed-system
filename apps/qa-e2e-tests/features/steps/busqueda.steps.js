const { Given, When, Then } = require('@cucumber/cucumber');
const { By, until } = require('selenium-webdriver');
const assert = require('assert');
const { getDriver } = require('./driver-holder');

Then('el sistema muestra el libro {string} en los resultados', async function (nombreLibro) {
    const driver = getDriver();
    // Esperamos a que la tabla o lista de resultados se actualice
    // Buscamos cualquier elemento que contenga el nombre del libro en el DOM
    // Como el texto puede variar en mayúsculas/minúsculas o formato, hacemos una búsqueda parcial usando XPath
    const bookResult = await driver.wait(until.elementLocated(By.xpath(`//*[contains(text(), '${nombreLibro}')]`)), 5000);
    const texto = await bookResult.getText();
    assert.ok(texto.includes(nombreLibro), `No se encontró el libro "${nombreLibro}" en los resultados`);
});
