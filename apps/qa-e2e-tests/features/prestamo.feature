Feature: Préstamo de un libro

  Scenario: Realizar el préstamo de un libro disponible
    Given el usuario "qa.tester@uce.edu.ec" ha iniciado sesión
    When busca el libro "Clean Code"
    And selecciona la opción de prestar
    Then el sistema muestra un mensaje de éxito

  Scenario: Préstamo de un libro que no está disponible
    Given el usuario "qa.tester@uce.edu.ec" ha iniciado sesión
    When busca el libro "Práctica a"
    Then el sistema muestra el botón "No disponible" para el libro
