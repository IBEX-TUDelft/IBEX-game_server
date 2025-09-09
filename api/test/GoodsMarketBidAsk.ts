import assert from "assert";
import MarketPhase from "../logics/goods_market/phases/MarketPhase.ts";
import GoodsMarketGood from "../logics/goods_market/model/GoodsMarketGood.ts";
import { GoodsMarketGoodQuality } from "../logics/goods_market/model/GoodsMarketTypes.ts";

/*describe("Array", function () {
    describe("#indexOf()", function () {
        it("should return -1 when the value is not present", function () {
            assert.equal([1, 2, 3].indexOf(4), -1);
        });
    });

    buyer_transaction_cost = 1;
    seller_transaction_cost = 1;
});*/

const wss = {
    broadcastEvent: function () { },
    sendEvent: function () { }
}


describe("GoodsMarket bids and asks", function () {
    it("should not create a bid", async function () {
        const data = {
            id: 0,
            practice_round: false,
            round_count: 1,
            parameters: {},
            currentRound: {
                phase: 1,
                round: 1
            },
            players: [
                { number: 0, name: "Admin", wallet: { cash: 100, goods: [] } },
                { number: 1, name: "Seller 1", wallet: { cash: 0, goods: [new GoodsMarketGood(GoodsMarketGoodQuality.GOOD)] } },
                { number: 2, name: "Player 2", wallet: { cash: 100, goods: [] } }
            ]
        }

        const mf: MarketPhase = new MarketPhase(data, wss, 1);

        let response;

        await mf.onMessage({
            "send": function (message) {
                response = JSON.parse(message);
            },
            "player": {
                "number": 1
            }
        }, {
            "order": {
                "price": 60,
                "quantity": 1,
                "type": "bid",
                "now": false
            },
            "gameId": 0,
            "type": "post-order"
        });

        assert.equal(mf.orders.length, 0, "Order was created");

        console.log('Response:', response);

        assert.equal(response.data.placeholder, "insufficient-funds", "Wrong response");
    });

    it("should not create a ask", async function () {
        const data = {
            id: 0,
            practice_round: false,
            round_count: 1,
            parameters: {},
            currentRound: {
                phase: 1,
                round: 1
            },
            players: [
                { number: 0, name: "Admin", wallet: { cash: 100, goods: [] } },
                { number: 1, name: "Seller 1", wallet: { cash: 0, goods: [new GoodsMarketGood(GoodsMarketGoodQuality.GOOD)] } },
                { number: 2, name: "Player 2", wallet: { cash: 100, goods: [] } }
            ]
        }

        const mf: MarketPhase = new MarketPhase(data, wss, 1);

        let response;

        await mf.onMessage({
            "send": function (message) {
                response = JSON.parse(message);
            },
            "player": {
                "number": 2
            }
        }, {
            "order": {
                "price": 60,
                "quantity": 1,
                "type": "ask",
                "now": false
            },
            "gameId": 0,
            "type": "post-order"
        });

        assert.equal(mf.orders.length, 0, "Order was created");

        console.log('Response:', response);

        assert.equal(response.data.placeholder, "no-goods-available", "Wrong response");
    });


    it("should create a bid", async function () {
        const data = {
            id: 0,
            practice_round: false,
            round_count: 1,
            parameters: {},
            currentRound: {
                phase: 1,
                round: 1
            },
            players: [
                { number: 0, name: "Admin", wallet: { cash: 100, goods: [] } },
                { number: 1, name: "Seller 1", wallet: { cash: 0, goods: [new GoodsMarketGood(GoodsMarketGoodQuality.GOOD)] } },
                { number: 2, name: "Player 2", wallet: { cash: 100, goods: [] } }
            ]
        }

        const mf: MarketPhase = new MarketPhase(data, wss, 1);

        let response;

        await mf.onMessage({
            "send": function (message) {
                response = JSON.parse(message);
            },
            "player": {
                "number": 2
            }
        }, {
            "order": {
                "price": 60,
                "quantity": 1,
                "type": "bid",
                "now": false
            },
            "gameId": 0,
            "type": "post-order"
        });

        assert.equal(mf.orders.length, 1, "Order was not created");

        const order = mf.orders.find(o => o.sender === 2 && o.type === 'bid' && o.price === 60);

        assert.notEqual(order == undefined || order == null, true, "Order was not created");
    });

    it("should create a ask", async function () {
        const data = {
            id: 0,
            practice_round: false,
            round_count: 1,
            parameters: {},
            currentRound: {
                phase: 1,
                round: 1
            },
            players: [
                { number: 0, name: "Admin", wallet: { cash: 100, goods: [] } },
                { number: 1, name: "Seller 1", wallet: { cash: 0, goods: [new GoodsMarketGood(GoodsMarketGoodQuality.GOOD)] } },
                { number: 2, name: "Player 2", wallet: { cash: 100, goods: [] } }
            ]
        }

        const mf: MarketPhase = new MarketPhase(data, wss, 1);

        let response;

        await mf.onMessage({
            "send": function (message) {
                response = JSON.parse(message);
            },
            "player": {
                "number": 1
            }
        }, {
            "order": {
                "price": 60,
                "quantity": 1,
                "type": "ask",
                "now": false
            },
            "gameId": 0,
            "type": "post-order"
        });

        assert.equal(mf.orders.length, 1, "Order was not created");

        const order = mf.orders.find(o => o.sender === 1 && o.type === 'ask' && o.price === 60);

        assert.notEqual(order == undefined || order == null, true, "Order was not created");
    });

    it("should not match a ask and a bid", async function () {
        const data = {
            id: 0,
            practice_round: false,
            round_count: 1,
            parameters: {},
            currentRound: {
                phase: 1,
                round: 1
            },
            players: [
                { number: 0, name: "Admin", wallet: { cash: 100, goods: [] } },
                { number: 1, name: "Seller 1", wallet: { cash: 0, goods: [new GoodsMarketGood(GoodsMarketGoodQuality.GOOD)] } },
                { number: 2, name: "Player 2", wallet: { cash: 100, goods: [] } }
            ]
        }

        const mf: MarketPhase = new MarketPhase(data, wss, 1);

        let response;

        await mf.onMessage({
            "send": function (message) {
                response = JSON.parse(message);
            },
            "player": {
                "number": 2
            }
        }, {
            "order": {
                "price": 60,
                "quantity": 1,
                "type": "bid",
                "now": false
            },
            "gameId": 0,
            "type": "post-order"
        });

        await mf.onMessage({
            "send": function (message) {
                response = JSON.parse(message);
            },
            "player": {
                "number": 1
            }
        }, {
            "order": {
                "price": 65,
                "quantity": 1,
                "type": "ask",
                "now": false
            },
            "gameId": 0,
            "type": "post-order"
        });

        assert.equal(mf.orders.length, 2, "Match was made?");

        let order = mf.orders.find(o => o.sender === 2 && o.type === 'bid' && o.price === 60);

        assert.notEqual(order == undefined || order == null, true, "Order was matched");

        order = mf.orders.find(o => o.sender === 1 && o.type === 'ask' && o.price === 65);

        assert.notEqual(order == undefined || order == null, true, "Order was matched");
    });

    it("should match, bid then ask", async function () {
        const data = {
            id: 0,
            practice_round: false,
            round_count: 1,
            parameters: {},
            currentRound: {
                phase: 1,
                round: 1
            },
            players: [
                { number: 0, name: "Admin", wallet: { cash: 100, goods: [] } },
                { number: 1, name: "Seller 1", wallet: { cash: 0, goods: [new GoodsMarketGood(GoodsMarketGoodQuality.GOOD)] } },
                { number: 2, name: "Player 2", wallet: { cash: 100, goods: [] } }
            ]
        }

        const mf: MarketPhase = new MarketPhase(data, wss, 1);

        let response;

        await mf.onMessage({
            "send": function (message) {
                response = JSON.parse(message);
            },
            "player": {
                "number": 2
            }
        }, {
            "order": {
                "price": 60,
                "quantity": 1,
                "type": "bid",
                "now": false
            },
            "gameId": 0,
            "type": "post-order"
        });

        await mf.onMessage({
            "send": function (message) {
                response = JSON.parse(message);
            },
            "player": {
                "number": 1
            }
        }, {
            "order": {
                "price": 55,
                "quantity": 1,
                "type": "ask",
                "now": false
            },
            "gameId": 0,
            "type": "post-order"
        });

        assert.equal(mf.orders.length, 0, "Match was made?");

        assert.equal(data.players[1].wallet.cash, 60, "Seller cash not updated");
        assert.equal(data.players[1].wallet.goods.length, 0, "Seller goods not updated");

        assert.equal(data.players[2].wallet.cash, 40, "Buyer cash not updated");
        assert.equal(data.players[2].wallet.goods.length, 1, "Buyer goods not updated");
    });

    it("should match, ask then bid", async function () {
        const data = {
            id: 0,
            practice_round: false,
            round_count: 1,
            parameters: {},
            currentRound: {
                phase: 1,
                round: 1
            },
            players: [
                { number: 0, name: "Admin", wallet: { cash: 100, goods: [] } },
                { number: 1, name: "Seller 1", wallet: { cash: 0, goods: [new GoodsMarketGood(GoodsMarketGoodQuality.GOOD)] } },
                { number: 2, name: "Player 2", wallet: { cash: 100, goods: [] } }
            ]
        }

        const mf: MarketPhase = new MarketPhase(data, wss, 1);

        let response;

        await mf.onMessage({
            "send": function (message) {
                response = JSON.parse(message);
            },
            "player": {
                "number": 1
            }
        }, {
            "order": {
                "price": 55,
                "quantity": 1,
                "type": "ask",
                "now": false
            },
            "gameId": 0,
            "type": "post-order"
        });

        await mf.onMessage({
            "send": function (message) {
                response = JSON.parse(message);
            },
            "player": {
                "number": 2
            }
        }, {
            "order": {
                "price": 60,
                "quantity": 1,
                "type": "bid",
                "now": false
            },
            "gameId": 0,
            "type": "post-order"
        });

        assert.equal(mf.orders.length, 0, "Match was made?");

        assert.equal(data.players[1].wallet.cash, 55, "Seller cash not updated");
        assert.equal(data.players[1].wallet.goods.length, 0, "Seller goods not updated");

        assert.equal(data.players[2].wallet.cash, 45, "Buyer cash not updated");
        assert.equal(data.players[2].wallet.goods.length, 1, "Buyer goods not updated");
    });

    it("Buyer seller tx cost", async function () {
        const data = {
            id: 0,
            practice_round: false,
            round_count: 1,
            parameters: {
                buyer_transaction_cost: 1,
                seller_transaction_cost: 2
            },
            currentRound: {
                phase: 1,
                round: 1
            },
            players: [
                { number: 0, name: "Admin", wallet: { cash: 100, goods: [] } },
                { number: 1, name: "Seller 1", wallet: { cash: 0, goods: [new GoodsMarketGood(GoodsMarketGoodQuality.GOOD)] } },
                { number: 2, name: "Player 2", wallet: { cash: 100, goods: [] } }
            ]
        }

        const mf: MarketPhase = new MarketPhase(data, wss, 1);

        let response;

        await mf.onMessage({
            "send": function (message) {
                response = JSON.parse(message);
            },
            "player": {
                "number": 1
            }
        }, {
            "order": {
                "price": 55,
                "quantity": 1,
                "type": "ask",
                "now": false
            },
            "gameId": 0,
            "type": "post-order"
        });

        await mf.onMessage({
            "send": function (message) {
                response = JSON.parse(message);
            },
            "player": {
                "number": 2
            }
        }, {
            "order": {
                "price": 60,
                "quantity": 1,
                "type": "bid",
                "now": false
            },
            "gameId": 0,
            "type": "post-order"
        });

        assert.equal(mf.orders.length, 0, "Match was made?");

        assert.equal(data.players[1].wallet.cash, 53, "Seller cash not updated");
        assert.equal(data.players[1].wallet.goods.length, 0, "Seller goods not updated");

        assert.equal(data.players[2].wallet.cash, 44, "Buyer cash not updated");
        assert.equal(data.players[2].wallet.goods.length, 1, "Buyer goods not updated");
    });

    it("Buyer tx cost blocks", async function () {
        const data = {
            id: 0,
            practice_round: false,
            round_count: 1,
            parameters: {
                buyer_transaction_cost: 10,
                seller_transaction_cost: 2
            },
            currentRound: {
                phase: 1,
                round: 1
            },
            players: [
                { number: 0, name: "Admin", wallet: { cash: 100, goods: [] } },
                { number: 1, name: "Seller 1", wallet: { cash: 0, goods: [new GoodsMarketGood(GoodsMarketGoodQuality.GOOD)] } },
                { number: 2, name: "Player 2", wallet: { cash: 64, goods: [] } }
            ]
        }

        const mf: MarketPhase = new MarketPhase(data, wss, 1);

        let response: any;

        await mf.onMessage({
            "send": function (message) {
                response = JSON.parse(message);
            },
            "player": {
                "number": 1
            }
        }, {
            "order": {
                "price": 55,
                "quantity": 1,
                "type": "ask",
                "now": false
            },
            "gameId": 0,
            "type": "post-order"
        });

        await mf.onMessage({
            "send": function (message) {
                response = JSON.parse(message);
            },
            "player": {
                "number": 2
            }
        }, {
            "order": {
                "price": 60,
                "quantity": 1,
                "type": "bid",
                "now": false
            },
            "gameId": 0,
            "type": "post-order"
        });

        assert.equal(mf.orders.length, 1, "Match was made?");

        const order = mf.orders.find(o => o.sender === 1 && o.type === 'ask' && o.price === 55);

        assert.notEqual(order == undefined || order == null, true, "Order was matched");

        console.log(response);

        assert.equal(response.data.placeholder, "insufficient-funds", "Wrong response");
    });

});