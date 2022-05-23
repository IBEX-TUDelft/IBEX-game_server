import JoinablePhase from '../../JoinablePhase.js';
import WS from '../../../helpers/websocket.js';

class Phase2 extends JoinablePhase {

    complete = false;

    messageCounter = 0;

    results = {
        chatLog: []
    };

    constructor (game, wss) {
        super (game, wss, [{
            "type": "chat-with-players",
            "role": null,
            "action": function(ws, message, player, caller) {
                console.log(message);

                if (message.to == null || message.to.length === 0) {
                    WS.error(ws, `Game ${message.gameId}: no recipient specified to this message: ${message.text} from ${player.tag}`);
                    return;
                }

                message.to.forEach(toPlayerNumber => {
                    const toPlayer = game.players.find(p => p.number === toPlayerNumber);

                    if (toPlayer == null) {
                        WS.error(ws, `Game ${message.gameId}: Could not find player ${toPlayerNumber}`);
                        return;
                    }

                    const messageSent = {
                        "sender": player.number,
                        "to": message.to,
                        "number": caller.messageCounter,
                        "text": message.text
                    };
    
                    caller.messageCounter++;
                    
                    const err = wss.sendEvent(
                        game.id,
                        toPlayer.number,
                        "message-received",
                        messageSent
                    );
    
                    if (err != null) {
                        console.error(err);
                    }                    
                });

                // Recording the chat events for showing at a later time

                const chatLog = caller.results.chatLog.push({
                    "time": Date.now(),
                    "sender": player.number,
                    "to": message.to,
                    "text": message.text
                });
            }
        }], [
            'Click on a plot to chat with its owner'
        ]);
    }

    async onEnter () {
        await super.onEnter();

        console.log('PHASE 2');

        const self = this;
        
        const visibleTimeout = 6 * 60;
        //const totalTimeout = (visibleTimeout + Math.floor(Math.random() * 3 * 60)) * 1000;
        const totalTimeout = 30000;

        this.setTimer(visibleTimeout * 1000, totalTimeout);
    }

    getData() {
        return this.results.chatLog;
    }

    testComplete () {
        return this.complete;
    }

}

export default {
    create(game, wss) {
        return new Phase2(game, wss);
    }
}