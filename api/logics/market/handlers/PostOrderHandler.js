import WS from '../../../helpers/websocket.js';
import { MessageHandler } from '../../messaging/MessageHandler.ts';

export default class PostOrderHandler extends MessageHandler{
    constructor() {
        super('post-order', null, true);
    }

    static nextOrderId = 0;
    static nextLogEntryId = 0;

    action (ws, message, player, phase) {
        const order = message.order;

        /*console.log(message);
        console.log(order);
        console.log(player);*/

        if (order == null) {
            WS.error(ws, `Game ${message.gameId}: the order is null`);
            return;
        }

        if (order.price  == null) {
            WS.sendEvent(
                ws,
                'order-refused',
                {
                    "message": `Order price was not filled.`,
                    "placeholder": "order-price-missing"
                }
            );
            return; //Cannot ask or bid negative numbers
        }

        if (typeof order.price != 'number') {
            order.price = parseFloat(order.price);
        }

        if (order.price < 0) {
            WS.sendEvent(
                ws,
                'order-refused',
                {
                    "message": `Order prices must be non negative. Your price: ${order.price}`,
                    "placeholder": "order-price-negative",
                    "parameters": [order.price]
                }
            );
            return; //Cannot ask or bid negative numbers
        }

        if (order.type === 'ask') {
            const activeAsks = phase.orders.filter(o => o.sender === player.number && o.type === 'ask').length;

            if (player.wallet.shares <= activeAsks) {
                WS.sendEvent(
                    ws,
                    'order-refused',
                    {
                        "message": `You have already committed all your shares ${player.wallet.shares} in other asks.
                         You can cancel them if you want to publish new ones`,
                        "placeholder": "no-shares-available",
                        "parameters": [player.wallet.shares]
                    }
                );
                return; //Cannot have more asks than shares
            }
        } else if (order.type === 'bid') {
            const committedSum = phase.orders.filter(o => o.sender === player.number && o.type === 'bid')
                .map(o => o.price)
                .reduce((a, b) => a + b, 0);

            if (player.wallet.balance - order.price - phase.buyerTransactionCost < committedSum) {
                const remainder = player.wallet.balance - committedSum;

                WS.sendEvent(
                    ws,
                    'order-refused',
                    {
                        "message": `You have already committed much of your balance (${committedSum}) in other bids,
                         The remainder ${remainder} is not enough to bid ${order.price} (plus a fee equal to ${phase.buyerTransactionCost}).
                         You may cancel previous bids to free some of your balance.`,
                        "placeholder": "no-balance-available",
                        "parameters": [committedSum, remainder, order.price]
                    }
                );

                return; //The sum of the bids (including the coming one) cannot exceed the balance
            }
        }

        const nextOrder = {
            "id": PostOrderHandler.nextOrderId,
            "sender": player.number,
            "price": order.price,
            "quantity": order.quantity,
            "type": order.type
        };

        phase.orderList.push(nextOrder);
        
        phase.results.log.push({
            "id": PostOrderHandler.nextLogEntryId++,
            "orderId": nextOrder.id,
            "time": new Date(),
            "round": phase.game.currentRound.number,
            "phase": 6,
            "actor": {
                "number": player.number,
                "role": player.role
            },
            "action": (order.type === 'ask' ? 'added Sell' : 'added Buy'),
            "quantity": order.quantity,
            "price": order.now ? 'any' : order.price,
            "bestBid": phase.getBestBid(),
            "bestAsk": phase.getBestAsk(),
            "book": phase.printBook()
        });

        const result = phase.fulfillOrder(order, player.number);

        if (result.type == "error") {
            WS.sendEvent(
                ws,
                'order-refused',
                {
                    "message": `Could not fulfill your order: ${result.message}`
                }
            );
        }

        if (result.quantity > 0) {
            if (!order.now) {
                const newOrder = {
                    "id": PostOrderHandler.nextOrderId++,
                    "sender": player.number,
                    "price": order.price,
                    "quantity": result.quantity,
                    "type": order.type
                };

                phase.orders.push(newOrder);

                phase.wss.broadcastEvent (
                    phase.game.id,
                    "add-order",
                    {
                        "order": newOrder
                    }
                );
            } else {
                if (order.type === 'ask') {
                    WS.sendEvent(
                        ws,
                        'order-refused',
                        {
                            "message": `Could not fulfill your order: ${result.message}`,
                            "placeholder": "could-not-find-bids"
                        }
                    );
                } else if (order.type === 'bid') {
                    WS.sendEvent(
                        ws,
                        'order-refused',
                        {
                            "message": `Could not fulfill your order: ${result.message}`,
                            "placeholder": "could-not-find-asks"
                        }
                    );
                }
            }
        }
    }
}