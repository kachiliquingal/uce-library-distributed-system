# LoadRunner Performance Tests

Este directorio contiene los scripts base en C para ejecutar las pruebas de carga y rendimiento de los 5 casos de uso de mayor riesgo de la aplicación **UCE Library**. 

## Instrucciones para LoadRunner VuGen

1. Abre **LoadRunner Virtual User Generator (VuGen)**.
2. Selecciona **File > New Script and Solution**.
3. Elige el protocolo **Web - HTTP/HTML** (o **C Vuser**).
4. Copia el contenido de cada archivo `.c` de esta carpeta y pégalo en la acción `Action.c` de tu nuevo script en VuGen.
5. Puedes usar la función de "Parameterization" en VuGen (por ejemplo, reemplazar el correo en `Login_Vuser.c` por `{p_email}`) si deseas simular múltiples usuarios dinámicos mediante un archivo CSV o base de datos.
6. Ejecuta el script localmente en VuGen para asegurar que la petición devuelve el código 200/201 (revisar el Replay Log).

## Instrucciones para LoadRunner Controller

Una vez que tengas los 5 scripts en VuGen:
1. Abre **LoadRunner Controller**.
2. Añade los 5 scripts al escenario (Scenario Groups).
3. Asigna la cantidad de Vusers por grupo priorizando por riesgo:
   - Login: 30% de la carga
   - Create Loan: 25% de la carga
   - Return Loan: 20% de la carga
   - Create Reservation: 15% de la carga
   - Generate Report: 10% de la carga
4. Configura el **Schedule** (Start Vusers, Duration, Stop Vusers) para simular un pico de usuarios.
5. Ejecuta el escenario y analiza los resultados en **LoadRunner Analysis**.
