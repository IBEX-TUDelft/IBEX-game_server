import fs from 'fs';

import Controller from '../helpers/controller.js';

export default {
    apply (app) {
        Controller.addGetRoute(app, '/api/v1/resources/sessions', true, async (req, res) => {
            const raw = fs.readFileSync(`resources/sessions.json`);

            Controller.handleSuccess(res, JSON.parse(raw), 'Data found');
        });

        Controller.addGetRoute(app, '/api/v1/resources/session-count', true, async (req, res) => {
            try {
                const raw = fs.readFileSync(`resources/sessions.json`);
                
                const sessions = JSON.parse(raw);

                Controller.handleSuccess(res, {
                    "count": sessions.length
                }, 'Data found');
            } catch (e) {
                Controller.handleServerError(res, e);
            }
        });
    }
}
