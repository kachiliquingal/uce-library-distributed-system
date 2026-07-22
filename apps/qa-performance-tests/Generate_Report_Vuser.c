#include "web_api.h"

Action()
{
    // Transacción para medir el tiempo de generación de reporte (agregación en BD)
    lr_start_transaction("UC05_GenerateReport");

    // Endpoint pesado que consolida todos los datos
    web_custom_request("GenerateReport_Request",
        "URL=http://32.199.97.153/api/reports/summary",
        "Method=GET",
        "TargetFrame=",
        "Resource=0",
        "RecContentType=application/json",
        "Referer=",
        "Snapshot=t5.inf",
        "Mode=HTTP",
        LAST);

    lr_end_transaction("UC05_GenerateReport", LR_AUTO);

    return 0;
}
