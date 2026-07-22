Feature: Inicio de Sesión en UCE Library

  Scenario: Login exitoso con credenciales válidas
    Given el usuario abre la página de login
    When ingresa el correo "qa.tester@uce.edu.ec" y la contraseña "TestSeguro2026"
    And presiona el botón de iniciar sesión
    Then el sistema lo redirige a la página principal de la biblioteca

  Scenario: Login con credenciales inválidas
    Given el usuario abre la página de login
    When ingresa el correo "qa.tester@uce.edu.ec" y la contraseña "ClaveIncorrecta123"
    And presiona el botón de iniciar sesión
    Then el sistema muestra un mensaje de error de login y no permite el ingreso
