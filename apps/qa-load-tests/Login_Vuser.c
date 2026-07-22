#include "web_api.h"

Action()
{
    // Transacción para medir el tiempo de respuesta del Login
    lr_start_transaction("UC01_Login");

    // Configurar cabeceras (Content-Type)
    web_add_header("Content-Type", "application/json");

    // Realizar la petición POST al servicio de autenticación
    web_custom_request("Login_Request",
        "URL=http://32.199.97.153/api/auth/login",
        "Method=POST",
        "TargetFrame=",
        "Resource=0",
        "RecContentType=application/json",
        "Referer=",
        "Snapshot=t1.inf",
        "Mode=HTTP",
        "Body={\"email\": \"qa.tester@uce.edu.ec\", \"password\": \"TestSeguro2026\"}",
        LAST);

    // Finalizar transacción basándose en el estado de la respuesta (200 OK)
    // En la configuración del entorno LoadRunner se debe verificar el código HTTP 200
    lr_end_transaction("UC01_Login", LR_AUTO);

    return 0;
}
