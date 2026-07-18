Feature: Préstamo de un libro

  Scenario: Realizar el préstamo de un libro disponible
    Given el usuario "qa.tester@uce.edu.ec" ha iniciado sesión
    When busca el libro "Práctica a Artes Vol. 186"
    And selecciona la opción de prestar
    Then el sistema muestra un mensaje de éxito
