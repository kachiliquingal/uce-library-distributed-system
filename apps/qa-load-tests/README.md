# Apache JMeter Load Tests

Este directorio contiene el plan de pruebas `.jmx` para ejecutar las pruebas de carga y rendimiento de los 5 casos de uso de mayor riesgo de la aplicación **UCE Library**. 

## Instrucciones de Uso

1. Descarga **Apache JMeter** (versión 5.6.3 o superior) desde la página oficial.
2. Descomprime el archivo ZIP en tu computadora.
3. Ingresa a la carpeta `bin` de JMeter y ejecuta el archivo `jmeter.bat` (en Windows) o `jmeter` (en Mac/Linux) para abrir la interfaz gráfica.
4. En JMeter, ve a **File > Open...** y selecciona el archivo `QA_Load_Tests.jmx` que se encuentra en esta carpeta.
5. Verás el plan de pruebas con los 5 escenarios (Thread Groups) ya configurados con sus peticiones HTTP.
6. Haz clic en el botón **Play** (icono verde de Start) en la barra superior.
7. Selecciona los componentes **View Results Tree** y **Summary Report** (al final del árbol a la izquierda) para ver en tiempo real cómo se ejecutan las peticiones y los tiempos promedios de respuesta.
8. ¡Toma captura de los resultados para tu informe final!
