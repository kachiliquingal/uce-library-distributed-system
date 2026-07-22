const { Given, When, Then } = require('@cucumber/cucumber');
const { By, until } = require('selenium-webdriver');
const assert = require('assert');
const { BASE_URL } = require('../../config');
const { getDriver } = require('./driver-holder');

Given('el usuario abre la página de login', async function () {
  const driver = getDriver();
  await driver.get(`${BASE_URL}/login`);
  await driver.sleep(1000); // Dar tiempo a que React renderice
});

When('ingresa el correo {string} y la contraseña {string}', async function (email, password) {
  const driver = getDriver();
  // Busca por name='email' o type='email' (muy común en React)
  const emailField = await driver.wait(until.elementLocated(By.css('input[type="email"], input[name="email"]')), 5000);
  await emailField.sendKeys(email);
  
  const passwordField = await driver.wait(until.elementLocated(By.css('input[type="password"], input[name="password"]')), 5000);
  await passwordField.sendKeys(password);
});

When('presiona el botón de iniciar sesión', async function () {
  const driver = getDriver();
  // Busca un botón que tenga type="submit" o que diga "Ingresar", "Login", "Acceder"
  const button = await driver.wait(until.elementLocated(By.css('button[type="submit"]')), 5000);
  await button.click();
  await driver.sleep(2000);
});

Then('el sistema lo redirige a la página principal de la biblioteca', async function () {
  const driver = getDriver();
  await driver.wait(async () => {
    const currentUrl = await driver.getCurrentUrl();
    return !currentUrl.includes('/login');
  }, 8000);
  
  const url = await driver.getCurrentUrl();
  assert.ok(!url.includes('/login'), 'El test falló porque el usuario sigue en la página de login.');
});

Then('el sistema muestra un mensaje de error de login y no permite el ingreso', async function () {
  const driver = getDriver();
  
  // Validar que se muestre un mensaje de error en pantalla
  const errorMsg = await driver.wait(until.elementLocated(By.xpath("//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'incorrect') or contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'error') or contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'invalid') or contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'inválid')]")), 5000);
  const texto = await errorMsg.getText();
  assert.ok(texto.length > 0, 'No se encontró mensaje de error.');

  // Validar que sigamos en la página de login
  const url = await driver.getCurrentUrl();
  assert.ok(url.includes('/login'), 'El sistema redirigió, pero debía quedarse en el login.');
});
