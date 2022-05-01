import JoinablePhase from '../../JoinablePhase.js';
import WS from '../../../helpers/websocket.js';

class Phase2 extends JoinablePhase {

    complete = false;

    constructor (game, wss) {
        super (game, wss, [{
            "type": "chat-with-player",
            "role": null,
            "action": function(ws, message, player, caller) {
                console.log(message);

                const toPlayer = game.players.find(p => p.number === message.to);

                if (toPlayer == null) {
                    WS.error(ws, `Game ${message.gameId}: Could not find player ${message.to}`);
                    return;
                }

                const err = wss.sendEvent(
                    game.id,
                    toPlayer.number,
                    "message-received",
                    {
                        "sender": player.number,
                        "to": toPlayer.number,
                        "text": message.text
                    }
                );

                if (err != null) {
                    console.error(err);
                }
            }
        }], [
            'Click on a plot to chat with its owner'
        ]);
    }

    async onEnter () {
        await super.onEnter();

        console.log('PHASE 2');

        const self = this;
        
        const visibleTimeout = 6;
        //const totalTimeout = (visibleTimeout + Math.floor(Math.random() * 3))  * 60 * 1000;

        setTimeout(() => {
            self.complete = true;
        }, 120000 ); //TODO: replace 60000 with totalTimeout

        console.log(this.game.players);

        const err = self.wss.broadcastEvent(
            self.game.id,
            "set-timer",
            {
                "end": Date.now() + visibleTimeout * 60 * 1000
            }
        );

        if (err != null) {
            console.log(err);
        }
    }

    getData() {
        return {}
    }

    testComplete () {
        return this.complete;
    }

    onExit() {
        const err = this.wss.broadcastEvent(
            this.game.id,
            "reset-timer",
            {}
        );

        if (err != null) {
            console.log(err);
        }
    }
}

export default {
    create(game, wss) {
        return new Phase2(game, wss);
    }
}