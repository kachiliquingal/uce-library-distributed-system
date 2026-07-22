Feature: Búsqueda de libros

  Scenario: Búsqueda exitosa de un libro en la biblioteca
    Given el usuario "qa.tester@uce.edu.ec" ha iniciado sesión
    When busca el libro "Clean Code"
    Then el sistema muestra el libro "Clean Code" en los resultados
