import Utils from '../helpers/utils.js';

const handleGenericError = function(res, error, status) {
    return res.status(status).json({
        data: {},
        status: true,
        message: error
    });
}

const handleServerError = function (res, error) {
    console.log(error);

    return handleGenericError(res, error, 500);
}

const handlePermissionError = function(res, error) {
    return handleGenericError(res, error, 401);
}

const handleSuccess = function(res, data, message) {
    return res.status(200).json({
        data: data,
        status: true,
        message: message
    });
}

const addPostRoute = function (app, route, permissionRequired, handler) {
    app.post(route, async (req, res) => {
        try {
            if (permissionRequired) {
                const verification = Utils.verifyJWT(req.body.token);

                if (verification == null || verification.role != 0)  {
                    return handlePermissionError(res, 'Could not verify your token');
                }
            }

            await handler(req, res);
        } catch (err) {
            handleServerError(res, err);
        }
    });
}

const addGetRoute = function (app, route, permissionRequired, handler) {
    app.get(route, async (req, res) => {
        try {
            if (permissionRequired) {
                const verification = Utils.verifyJWT(req.query.token);

                if (verification == null || verification.role != 0)  {
                    return handlePermissionError(res, 'Could not verify your token');
                }
            }

            await handler(req, res);
        } catch (err) {
            handleServerError(res, err);
        }
    });
}

export default {
    handleGenericError, handleServerError, handlePermissionError, handleSuccess, addPostRoute, addGetRoute
}