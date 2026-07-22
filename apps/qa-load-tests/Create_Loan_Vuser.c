#include "web_api.h"

Action()
{
    // Transacción para medir el tiempo de creación de un préstamo
    lr_start_transaction("UC02_CreateLoan");

    web_add_header("Content-Type", "application/json");

    // En LoadRunner se suele parametrizar el ISBN o UserID (ej. {p_userId}) 
    // Aquí usamos datos fijos de QA para pruebas base.
    web_custom_request("CreateLoan_Request",
        "URL=http://32.199.97.153/api/loans/",
        "Method=POST",
        "TargetFrame=",
        "Resource=0",
        "RecContentType=application/json",
        "Referer=",
        "Snapshot=t2.inf",
        "Mode=HTTP",
        "Body={\"userId\": 1, \"isbn\": \"978-0132-35-0884\", \"bookTitle\": \"Clean Code\", \"faculty\": \"Ingeniería\"}",
        LAST);

    lr_end_transaction("UC02_CreateLoan", LR_AUTO);

    return 0;
}
