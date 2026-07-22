#include "web_api.h"

Action()
{
    // Transacción para medir el tiempo de creación de una reserva
    lr_start_transaction("UC04_CreateReservation");

    web_add_header("Content-Type", "application/json");

    // Reserva para el libro "Práctica a" (que sabemos que está agotado)
    web_custom_request("CreateReservation_Request",
        "URL=http://32.199.97.153/api/reservations",
        "Method=POST",
        "TargetFrame=",
        "Resource=0",
        "RecContentType=application/json",
        "Referer=",
        "Snapshot=t4.inf",
        "Mode=HTTP",
        "Body={\"userId\": 1, \"isbn\": \"978-8290-23-4991\"}",
        LAST);

    lr_end_transaction("UC04_CreateReservation", LR_AUTO);

    return 0;
}
