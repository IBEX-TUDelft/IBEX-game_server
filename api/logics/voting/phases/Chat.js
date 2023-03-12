import JoinablePhase from '../../JoinablePhase.js';
import WS from '../../../helpers/websocket.js';

class Chat extends JoinablePhase {

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

                const time = Date.now();

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
                        "text": message.text,
                        "time": time
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

                caller.results.chatLog.push({
                    "time": time,
                    "sender": player.number,
                    "to": message.to,
                    "text": message.text.replaceAll("'", "&lsquo;")
                });

                console.log(caller.results.chatLog[caller.results.chatLog.length - 1]);
                console.log(caller.results.chatLog);
                console.log(JSON.stringify(caller.results.chatLog));
            }
        }], [
            'Click on a plot to chat with its owner'
        ]);
    }

    async onEnter () {
        await super.onEnter();
        
        //const visibleTimeout = parseInt(process.env.VOTING_CHAT_FIXED_DURATION);
        const visibleTimeout = this.game.parameters.seconds_for_deliberation;
        const totalTimeout = (visibleTimeout + Math.floor(Math.random() * parseInt(process.env.VOTING_CHAT_MAX_EXTRA_TIME))) * 1000;

        console.log(`Timer: ${process.env.VOTING_CHAT_FIXED_DURATION}s visible, ${process.env.VOTING_CHAT_MAX_EXTRA_TIME}s extra. Total: ${totalTimeout}ms`);

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
        return new Chat(game, wss);
    }
}