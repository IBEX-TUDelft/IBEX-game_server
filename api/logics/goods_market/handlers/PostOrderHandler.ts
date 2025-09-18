import WS from '../../../helpers/websocket.js';
import { MessageHandler } from '../../messaging/MessageHandler.ts';
import GoodsMarketPlayer from '../model/GoodsMarketPlayer.ts';
import GoodsMarketOrder from '../model/GoodsMarketOrder.ts';
import { GoodsMarketOrderType } from '../model/GoodsMarketTypes.ts';
import MarketPhase from '../phases/MarketPhase.ts';
import { UserMessage } from '../../../../generated/UserMessage.ts';

class PostOrderMessage implements UserMessage {
    gameId: string;
    order: GoodsMarketOrder;
}

export default class PostOrderHandler extends MessageHandler<PostOrderMessage> {
    constructor() {
        super('post-order', null, true);
    }

    action(ws, message: PostOrderMessage, player: GoodsMarketPlayer, phase: MarketPhase) {
        const order = message.order;

        console.log('Message', message);
        console.log('Order', order);
        console.log('Player', player);

        if (order == null) {
            WS.error(ws, `Game ${message.gameId}: the order is null`);
            return;
        }

        if (order.price == null) {
            WS.sendEvent(
                ws,
                'order-refused',
                {
                    "message": `Order price was not present`,
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

        if (order.type === GoodsMarketOrderType.ASK) {
            //There can be only one ask at a time
            const activeAsks = phase.orders.filter((o: GoodsMarketOrder) => o.sender === player.number && o.type === GoodsMarketOrderType.ASK);

            if (activeAsks.length >= 1) {
                return WS.sendEvent(
                    ws,
                    'order-refused',
                    {
                        "message": `You shouldn't have more than one active ask order at a time, but you have ${activeAsks.length}`,
                        "placeholder": "phase-illegal-state",
                        "parameters": [activeAsks.length]
                    }
                );
            }

            if (player.wallet.goods.length <= 0) {
                return WS.sendEvent(
                    ws,
                    'order-refused',
                    {
                        "message": `You don't have any goods you can sell`,
                        "placeholder": "no-goods-available",
                        "parameters": [player.wallet.goods.length]
                    }
                );
            }
        } else if (order.type === GoodsMarketOrderType.BID) {
            //There can be only one bid at a time
            const activeBids = phase.orders.filter((o: GoodsMarketOrder) => o.sender === player.number && o.type === GoodsMarketOrderType.BID);

            if (activeBids.length >= 1) {
                return WS.sendEvent(
                    ws,
                    'order-refused',
                    {
                        "message": `You shouldn't have more than one active bid order at a time, but you have ${activeBids.length}`,
                        "placeholder": "phase-illegal-state",
                        "parameters": [activeBids.length]
                    }
                );
            }

            if (player.wallet.cash < order.price + phase.getBuyerFee()) {
                return WS.sendEvent(
                    ws,
                    'order-refused',
                    {
                        "message": `You don't have enough cash to place this bid (consider also the transaction cost of ${phase.getBuyerFee()} per unit)`,
                        "placeholder": "insufficient-funds",
                        "parameters": [order.price + phase.getBuyerFee()]
                    }
                );
            }
        }

        const nextOrder = new GoodsMarketOrder(player.number, order.type, order.price);

        phase.orderList.push(nextOrder);

        phase.results.log.push({
            "id": nextOrder.id,
            "time": Date.now(),
            "round": phase.game.currentRound.number,
            "phase": 6,
            "actor": {
                "number": player.number,
                "role": player.role
            },
            "action": (order.type === 'ask' ? 'added Sell' : 'added Buy'),
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
                const newOrder = new GoodsMarketOrder(player.number, order.type, order.price);

                phase.orders.push(newOrder);

                phase.wss.broadcastEvent(
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