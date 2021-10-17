const message = function (ws, type, message, handleException) {
    try {
        ws.send(JSON.stringify({
            "type": type,
            "message": message
        }));
    } catch (e) {
        console.error(e);
        
        if (handleException != null) {
            handleException(e);
        }
    }
}

export default {
    send(ws, message, handleException) {
        try {
            ws.send(JSON.stringify(message));
        } catch (e) {
            console.error(e);
            
            if (handleException != null) {
                handleException(e);
            }
        }
    },
    info (ws, msg, handleException) {
        message(ws, "info", msg, handleException);
    },
    notice (ws, msg, handleException) {
        message(ws, "notice", msg, handleException);
    },
    warning (ws, msg, handleException) {
        message(ws, "warning", msg, handleException);
    },
    error (ws, msg, handleException) {
        message(ws, "error", msg, handleException);
    },
    fatal (ws, msg, handleException) {
        message(ws, "fatal", msg, handleException);
    }
}