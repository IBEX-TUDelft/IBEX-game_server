import WS from '../../../helpers/websocket.js';
import MessageHandler from '../../MessageHandler.js';
import PostOrderHandler from './PostOrderHandler.js';

export default class CancelOrderHandler extends MessageHandler {

    constructor() {
        super('cancel-order', null, true);
    }

    action (ws, message, player, phase) {
        const order = phase.orders.find(o => o.id === message.order.id);

        if (order == null) {
            WS.error(ws, `Order not found. ${message.order.id}`);
            return;
        }

        if (order.sender != player.number) {
            WS.error(ws, `You cannot delete this order because you did not create it`);
            return;
        }

        phase.results.log.push({
            "id": PostOrderHandler.nextLogEntryId++,
            "orderId": order.id,
            "time": new Date(),
            "round": phase.game.currentRound.number,
            "phase": 6,
            "actor": {
                "number": player.number,
                "role": player.role
            },
            "action": (order.type === 'ask' ? 'Cancel Sell Order' : 'Cancel Buy Order'),
            "quantity": order.quantity,
            "price": order.price,
            "bestBid": phase.getBestBid(),
            "bestAsk": phase.getBestAsk(),
            "book": phase.printBook()
        });

        const err = phase.removeOrder(order.id);

        phase.orderList.push({
            "id": message.order.id,
            "type": "cancel"
        });

        if (err != null) {
            WS.error(ws, err);
            return;
        }
    }
}