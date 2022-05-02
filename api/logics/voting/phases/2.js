import JoinablePhase from '../../JoinablePhase.js';
import WS from '../../../helpers/websocket.js';

class Phase2 extends JoinablePhase {

    complete = false;

    results = {
        chatLog: []
    };

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

                const messageSent = {
                    "sender": player.number,
                    "to": toPlayer.number,
                    "text": message.text
                };

                const err = wss.sendEvent(
                    game.id,
                    toPlayer.number,
                    "message-received",
                    messageSent
                );

                if (err != null) {
                    console.error(err);
                }

                // Recording the chat events for showing later

                const chatLog = caller.results.chatLog;

                let senderJournal = chatLog.find(j => j.number === player.number);

                if (senderJournal == null) {
                    senderJournal = {
                        "number": player.number,
                        "logs": []
                    };

                    chatLog.push(senderJournal);
                }

                let receiverJournal = chatLog.find(j => j.number === toPlayer.number);

                if (receiverJournal == null) {
                    receiverJournal = {
                        "number": toPlayer.number,
                        "logs": []
                    };

                    chatLog.push(receiverJournal);
                }

                let bidirectionalLog = senderJournal.logs.find(l => l.people.includes(toPlayer.number) && l.people.includes(player.number));

                if (bidirectionalLog == null) {
                    bidirectionalLog = {
                        "people": [player.number, toPlayer.number],
                        "messages": []
                    }

                    senderJournal.logs.push(bidirectionalLog);
                    receiverJournal.logs.push(bidirectionalLog);
                }

                bidirectionalLog.messages.push(messageSent);
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

        setTimeout(() => {
            self.complete = true;
        }, 120000 ); //TODO: replace with totalTimeout

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
        return this.results.chatLog;
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