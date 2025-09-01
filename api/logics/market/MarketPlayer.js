const MARKET_ADMIN = 'admin';
const MARKET_PLAYER = 'player';

const MARKET_GAME_ADMIN = 0;
const MARKET_GAME_KNOWS_ALL = 1;
const MARKET_GAME_PRIV_SIG_ONLY = 2;
const MARKET_GAME_PUB_SIG_ONLY = 3;
const MARKET_GAME_KNOWS_NOTHING = 4;

class MarketPlayer {
    authority = '';
    number = -1;
    recovery = '';
    shares = -1;
    cash = -1;
    gameId = -1;
    role = -1;
    wallet = null;
    signal = null;
}

export {
    MarketPlayer,
    MARKET_ADMIN,
    MARKET_PLAYER,
    MARKET_GAME_ADMIN,
    MARKET_GAME_KNOWS_ALL,
    MARKET_GAME_PUB_SIG_ONLY,
    MARKET_GAME_PRIV_SIG_ONLY,
    MARKET_GAME_KNOWS_NOTHING
}