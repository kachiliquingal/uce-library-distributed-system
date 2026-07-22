#include "web_api.h"

Action()
{
    // Transacción para medir el tiempo de devolución
    lr_start_transaction("UC03_ReturnLoan");

    web_add_header("Content-Type", "application/json");

    // {loanId} se parametriza típicamente en LoadRunner. Simulamos el préstamo ID 1.
    web_custom_request("ReturnLoan_Request",
        "URL=http://32.199.97.153/api/loans/1/return",
        "Method=PUT",
        "TargetFrame=",
        "Resource=0",
        "RecContentType=application/json",
        "Referer=",
        "Snapshot=t3.inf",
        "Mode=HTTP",
        "Body={\"condition\": \"Good\"}",
        LAST);

    lr_end_transaction("UC03_ReturnLoan", LR_AUTO);

    return 0;
}
