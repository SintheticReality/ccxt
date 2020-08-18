'use strict';

// ---------------------------------------------------------------------------

const Exchange = require ('./base/Exchange');
const { BadSymbol, PermissionDenied, ExchangeError, ExchangeNotAvailable, OrderNotFound, InsufficientFunds, InvalidOrder, RequestTimeout, AuthenticationError } = require ('./base/errors');
const { TRUNCATE, DECIMAL_PLACES, TICK_SIZE } = require ('./base/functions/number');

// ---------------------------------------------------------------------------

module.exports = class hitbtc extends Exchange {
    describe () {
        return this.deepExtend (super.describe (), {
            'id': 'hitbtc',
            'name': 'HitBTC',
            'countries': [ 'HK' ],
            'rateLimit': 1500,
            'version': '2',
            'pro': true,
            'has': {
                'createDepositAddress': true,
                'fetchDepositAddress': true,
                'CORS': false,
                'editOrder': true,
                'fetchCurrencies': true,
                'fetchOHLCV': true,
                'fetchTickers': true,
                'fetchOrder': true,
                'fetchOrders': false,
                'fetchOpenOrders': true,
                'fetchClosedOrders': true,
                'fetchMyTrades': true,
                'withdraw': true,
                'fetchOrderTrades': false, // not implemented yet
                'fetchDeposits': false,
                'fetchWithdrawals': false,
                'fetchTransactions': true,
                'fetchTradingFee': true,
            },
            'timeframes': {
                '1m': 'M1',
                '3m': 'M3',
                '5m': 'M5',
                '15m': 'M15',
                '30m': 'M30', // default
                '1h': 'H1',
                '4h': 'H4',
                '1d': 'D1',
                '1w': 'D7',
                '1M': '1M',
            },
            'urls': {
                'logo': 'https://user-images.githubusercontent.com/1294454/27766555-8eaec20e-5edc-11e7-9c5b-6dc69fc42f5e.jpg',
                'api': {
                    'public': 'https://api.hitbtc.com',
                    'private': 'https://api.hitbtc.com',
                },
                'www': 'https://hitbtc.com',
                'referral': 'https://hitbtc.com/?ref_id=5a5d39a65d466',
                'doc': [
                    'https://api.hitbtc.com',
                    'https://github.com/hitbtc-com/hitbtc-api/blob/master/APIv2.md',
                ],
                'fees': [
                    'https://hitbtc.com/fees-and-limits',
                    'https://support.hitbtc.com/hc/en-us/articles/115005148605-Fees-and-limits',
                ],
            },
            'api': {
                'public': {
                    'get': [
                        'symbol', // Available Currency Symbols
                        'symbol/{symbol}', // Get symbol info
                        'currency', // Available Currencies
                        'currency/{currency}', // Get currency info
                        'ticker', // Ticker list for all symbols
                        'ticker/{symbol}', // Ticker for symbol
                        'trades',
                        'trades/{symbol}', // Trades
                        'orderbook',
                        'orderbook/{symbol}', // Orderbook
                        'candles',
                        'candles/{symbol}', // Candles
                    ],
                },
                'private': {
                    'get': [
                        'trading/balance', // Get trading balance
                        'order', // List your current open orders
                        'order/{clientOrderId}', // Get a single order by clientOrderId
                        'trading/fee/all', // Get trading fee rate
                        'trading/fee/{symbol}', // Get trading fee rate
                        'history/order', // Get historical orders
                        'history/trades', // Get historical trades
                        'history/order/{orderId}/trades', // Get historical trades by specified order
                        'account/balance', // Get main acccount balance
                        'account/crypto/address/{currency}', // Get deposit crypro address
                        'account/crypto/is-mine/{address}',
                        'account/transactions', // Get account transactions
                        'account/transactions/{id}', // Get account transaction by id
                        'sub-acc',
                        'sub-acc/acl',
                        'sub-acc/balance/{subAccountUserID}',
                        'sub-acc/deposit-address/{subAccountUserId}/{currency}',
                    ],
                    'post': [
                        'order', // Create new order
                        'account/crypto/address/{currency}', // Create new deposit crypro address
                        'account/crypto/withdraw', // Withdraw crypro
                        'account/crypto/transfer-convert',
                        'account/transfer', // Transfer amount to trading
                        'sub-acc/freeze',
                        'sub-acc/activate',
                        'sub-acc/transfer',
                    ],
                    'put': [
                        'order/{clientOrderId}', // Create new order
                        'account/crypto/withdraw/{id}', // Commit withdraw crypro
                        'sub-acc/acl/{subAccountUserId}',
                    ],
                    'delete': [
                        'order', // Cancel all open orders
                        'order/{clientOrderId}', // Cancel order
                        'account/crypto/withdraw/{id}', // Rollback withdraw crypro
                    ],
                    // outdated?
                    'patch': [
                        'order/{clientOrderId}', // Cancel Replace order
                    ],
                },
            },
            'precisionMode': TICK_SIZE,
            'fees': {
                'trading': {
                    'tierBased': false,
                    'percentage': true,
                    'maker': 0.1 / 100,
                    'taker': 0.2 / 100,
                },
            },
            'options': {
                'defaultTimeInForce': 'FOK',
            },
            'commonCurrencies': {
                'BET': 'DAO.Casino',
                'CAT': 'BitClave',
                'CPT': 'Cryptaur', // conflict with CPT = Contents Protocol https://github.com/ccxt/ccxt/issues/4920 and https://github.com/ccxt/ccxt/issues/6081
                'DRK': 'DASH',
                'EMGO': 'MGO',
                'GET': 'Themis',
                'HSR': 'HC',
                'LNC': 'LinkerCoin',
                'PLA': 'PlayChip',
                'UNC': 'Unigame',
                'USD': 'USDT',
                'XBT': 'BTC',
            },
            'exceptions': {
                '504': RequestTimeout, // {"error":{"code":504,"message":"Gateway Timeout"}}
                '1002': AuthenticationError, // {"error":{"code":1002,"message":"Authorization failed","description":""}}
                '1003': PermissionDenied, // "Action is forbidden for this API key"
                '2010': InvalidOrder, // "Quantity not a valid number"
                '2001': BadSymbol, // "Symbol not found"
                '2011': InvalidOrder, // "Quantity too low"
                '2020': InvalidOrder, // "Price not a valid number"
                '20002': OrderNotFound, // canceling non-existent order
                '20001': InsufficientFunds, // {"error":{"code":20001,"message":"Insufficient funds","description":"Check that the funds are sufficient, given commissions"}}
            },
        });
    }

    feeToPrecision (symbol, fee) {
        return this.decimalToPrecision (fee, TRUNCATE, 8, DECIMAL_PLACES);
    }

    async fetchMarkets (params = {}) {
        const response = await this.publicGetSymbol (params);
        //
        //     [
        //         {
        //             "id":"BCNBTC",
        //             "baseCurrency":"BCN",
        //             "quoteCurrency":"BTC",
        //             "quantityIncrement":"100",
        //             "tickSize":"0.00000000001",
        //             "takeLiquidityRate":"0.002",
        //             "provideLiquidityRate":"0.001",
        //             "feeCurrency":"BTC"
        //         }
        //     ]
        //
        const result = [];
        for (let i = 0; i < response.length; i++) {
            const market = response[i];
            const id = this.safeString (market, 'id');
            const baseId = this.safeString (market, 'baseCurrency');
            const quoteId = this.safeString (market, 'quoteCurrency');
            const base = this.safeCurrencyCode (baseId);
            const quote = this.safeCurrencyCode (quoteId);
            const symbol = base + '/' + quote;
            const lot = this.safeFloat (market, 'quantityIncrement');
            const step = this.safeFloat (market, 'tickSize');
            const precision = {
                'price': step,
                'amount': lot,
            };
            const taker = this.safeFloat (market, 'takeLiquidityRate');
            const maker = this.safeFloat (market, 'provideLiquidityRate');
            const feeCurrencyId = this.safeString (market, 'feeCurrency');
            const feeCurrencyCode = this.safeCurrencyCode (feeCurrencyId);
            result.push (this.extend (this.fees['trading'], {
                'info': market,
                'id': id,
                'symbol': symbol,
                'base': base,
                'quote': quote,
                'baseId': baseId,
                'quoteId': quoteId,
                'active': true,
                'taker': taker,
                'maker': maker,
                'precision': precision,
                'feeCurrency': feeCurrencyCode,
                'limits': {
                    'amount': {
                        'min': lot,
                        'max': undefined,
                    },
                    'price': {
                        'min': step,
                        'max': undefined,
                    },
                    'cost': {
                        'min': lot * step,
                        'max': undefined,
                    },
                },
            }));
        }
        return result;
    }

    async fetchCurrencies (params = {}) {
        const response = await this.publicGetCurrency (params);
        //
        //     [
        //         {
        //             "id":"DDF",
        //             "fullName":"DDF",
        //             "crypto":true,
        //             "payinEnabled":false,
        //             "payinPaymentId":false,
        //             "payinConfirmations":20,
        //             "payoutEnabled":true,
        //             "payoutIsPaymentId":false,
        //             "transferEnabled":true,
        //             "delisted":false,
        //             "payoutFee":"646.000000000000"
        //         }
        //     ]
        //
        const result = {};
        for (let i = 0; i < response.length; i++) {
            const currency = response[i];
            const id = this.safeString (currency, 'id');
            // todo: will need to rethink the fees
            // to add support for multiple withdrawal/deposit methods and
            // differentiated fees for each particular method
            const precision = 8; // default precision, todo: fix "magic constants"
            const code = this.safeCurrencyCode (id);
            const payin = this.safeValue (currency, 'payinEnabled');
            const payout = this.safeValue (currency, 'payoutEnabled');
            const transfer = this.safeValue (currency, 'transferEnabled');
            let active = payin && payout && transfer;
            if ('disabled' in currency) {
                if (currency['disabled']) {
                    active = false;
                }
            }
            let type = 'fiat';
            if (('crypto' in currency) && currency['crypto']) {
                type = 'crypto';
            }
            const name = this.safeString (currency, 'fullName');
            result[code] = {
                'id': id,
                'code': code,
                'type': type,
                'payin': payin,
                'payout': payout,
                'transfer': transfer,
                'info': currency,
                'name': name,
                'active': active,
                'fee': this.safeFloat (currency, 'payoutFee'), // todo: redesign
                'precision': precision,
                'limits': {
                    'amount': {
                        'min': Math.pow (10, -precision),
                        'max': Math.pow (10, precision),
                    },
                    'price': {
                        'min': Math.pow (10, -precision),
                        'max': Math.pow (10, precision),
                    },
                    'cost': {
                        'min': undefined,
                        'max': undefined,
                    },
                    'withdraw': {
                        'min': undefined,
                        'max': Math.pow (10, precision),
                    },
                },
            };
        }
        return result;
    }

    async fetchTradingFee (symbol, params = {}) {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = this.extend ({
            'symbol': market['id'],
        }, this.omit (params, 'symbol'));
        const response = await this.privateGetTradingFeeSymbol (request);
        //
        //     {
        //         takeLiquidityRate: '0.001',
        //         provideLiquidityRate: '-0.0001'
        //     }
        //
        return {
            'info': response,
            'maker': this.safeFloat (response, 'provideLiquidityRate'),
            'taker': this.safeFloat (response, 'takeLiquidityRate'),
        };
    }

    async fetchBalance (params = {}) {
        await this.loadMarkets ();
        const type = this.safeString (params, 'type', 'trading');
        const method = 'privateGet' + this.capitalize (type) + 'Balance';
        const query = this.omit (params, 'type');
        const response = await this[method] (query);
        const result = { 'info': response };
        for (let i = 0; i < response.length; i++) {
            const balance = response[i];
            const currencyId = this.safeString (balance, 'currency');
            const code = this.safeCurrencyCode (currencyId);
            const account = this.account ();
            account['free'] = this.safeFloat (balance, 'available');
            account['used'] = this.safeFloat (balance, 'reserved');
            result[code] = account;
        }
        return this.parseBalance (result);
    }

    parseOHLCV (ohlcv, market = undefined, timeframe = '1d', since = undefined, limit = undefined) {
        //
        //     {
        //         "timestamp":"2015-08-20T19:01:00.000Z",
        //         "open":"0.006",
        //         "close":"0.006",
        //         "min":"0.006",
        //         "max":"0.006",
        //         "volume":"0.003",
        //         "volumeQuote":"0.000018"
        //     }
        //
        return [
            this.parse8601 (this.safeString (ohlcv, 'timestamp')),
            this.safeFloat (ohlcv, 'open'),
            this.safeFloat (ohlcv, 'max'),
            this.safeFloat (ohlcv, 'min'),
            this.safeFloat (ohlcv, 'close'),
            this.safeFloat (ohlcv, 'volume'),
        ];
    }

    async fetchOHLCV (symbol, timeframe = '1m', since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
            'period': this.timeframes[timeframe],
        };
        if (since !== undefined) {
            request['from'] = this.iso8601 (since);
        }
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        const response = await this.publicGetCandlesSymbol (this.extend (request, params));
        //
        //     [
        //         {"timestamp":"2015-08-20T19:01:00.000Z","open":"0.006","close":"0.006","min":"0.006","max":"0.006","volume":"0.003","volumeQuote":"0.000018"},
        //         {"timestamp":"2015-08-20T19:03:00.000Z","open":"0.006","close":"0.006","min":"0.006","max":"0.006","volume":"0.013","volumeQuote":"0.000078"},
        //         {"timestamp":"2015-08-20T19:06:00.000Z","open":"0.0055","close":"0.005","min":"0.005","max":"0.0055","volume":"0.003","volumeQuote":"0.0000155"},
        //     ]
        //
        return this.parseOHLCVs (response, market);
    }

    async fetchOrderBook (symbol, limit = undefined, params = {}) {
        await this.loadMarkets ();
        const request = {
            'symbol': this.marketId (symbol),
        };
        if (limit !== undefined) {
            request['limit'] = limit; // default = 100, 0 = unlimited
        }
        const response = await this.publicGetOrderbookSymbol (this.extend (request, params));
        return this.parseOrderBook (response, undefined, 'bid', 'ask', 'price', 'size');
    }

    parseTicker (ticker, market = undefined) {
        const timestamp = this.parse8601 (ticker['timestamp']);
        let symbol = undefined;
        if (market !== undefined) {
            symbol = market['symbol'];
        }
        const baseVolume = this.safeFloat (ticker, 'volume');
        const quoteVolume = this.safeFloat (ticker, 'volumeQuote');
        const open = this.safeFloat (ticker, 'open');
        const last = this.safeFloat (ticker, 'last');
        let change = undefined;
        let percentage = undefined;
        let average = undefined;
        if (last !== undefined && open !== undefined) {
            change = last - open;
            average = this.sum (last, open) / 2;
            if (open > 0) {
                percentage = change / open * 100;
            }
        }
        let vwap = undefined;
        if (quoteVolume !== undefined) {
            if (baseVolume !== undefined) {
                if (baseVolume > 0) {
                    vwap = quoteVolume / baseVolume;
                }
            }
        }
        return {
            'symbol': symbol,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'high': this.safeFloat (ticker, 'high'),
            'low': this.safeFloat (ticker, 'low'),
            'bid': this.safeFloat (ticker, 'bid'),
            'bidVolume': undefined,
            'ask': this.safeFloat (ticker, 'ask'),
            'askVolume': undefined,
            'vwap': vwap,
            'open': open,
            'close': last,
            'last': last,
            'previousClose': undefined,
            'change': change,
            'percentage': percentage,
            'average': average,
            'baseVolume': baseVolume,
            'quoteVolume': quoteVolume,
            'info': ticker,
        };
    }

    async fetchTickers (symbols = undefined, params = {}) {
        await this.loadMarkets ();
        const response = await this.publicGetTicker (params);
        const result = {};
        for (let i = 0; i < response.length; i++) {
            const ticker = response[i];
            const marketId = this.safeString (ticker, 'symbol');
            if (marketId !== undefined) {
                if (marketId in this.markets_by_id) {
                    const market = this.markets_by_id[marketId];
                    const symbol = market['symbol'];
                    result[symbol] = this.parseTicker (ticker, market);
                } else {
                    result[marketId] = this.parseTicker (ticker);
                }
            }
        }
        return result;
    }

    async fetchTicker (symbol, params = {}) {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
        };
        const response = await this.publicGetTickerSymbol (this.extend (request, params));
        if ('message' in response) {
            throw new ExchangeError (this.id + ' ' + response['message']);
        }
        return this.parseTicker (response, market);
    }

    parseTrade (trade, market = undefined) {
        //
        // createMarketOrder
        //
        //  {       fee: "0.0004644",
        //           id:  386394956,
        //        price: "0.4644",
        //     quantity: "1",
        //    timestamp: "2018-10-25T16:41:44.780Z" }
        //
        // fetchTrades ...
        //
        // fetchMyTrades ...
        //
        const timestamp = this.parse8601 (trade['timestamp']);
        let symbol = undefined;
        const marketId = this.safeString (trade, 'symbol');
        if (marketId !== undefined) {
            if (marketId in this.markets_by_id) {
                market = this.markets_by_id[marketId];
            } else {
                symbol = marketId;
            }
        }
        if ((symbol === undefined) && (market !== undefined)) {
            symbol = market['symbol'];
        }
        let fee = undefined;
        const feeCost = this.safeFloat (trade, 'fee');
        if (feeCost !== undefined) {
            const feeCurrencyCode = market ? market['feeCurrency'] : undefined;
            fee = {
                'cost': feeCost,
                'currency': feeCurrencyCode,
            };
        }
        // we use clientOrderId as the order id with this exchange intentionally
        // because most of their endpoints will require clientOrderId
        // explained here: https://github.com/ccxt/ccxt/issues/5674
        const orderId = this.safeString (trade, 'clientOrderId');
        const price = this.safeFloat (trade, 'price');
        const amount = this.safeFloat (trade, 'quantity');
        const cost = price * amount;
        const side = this.safeString (trade, 'side');
        const id = this.safeString (trade, 'id');
        return {
            'info': trade,
            'id': id,
            'order': orderId,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'symbol': symbol,
            'type': undefined,
            'side': side,
            'takerOrMaker': undefined,
            'price': price,
            'amount': amount,
            'cost': cost,
            'fee': fee,
        };
    }

    async fetchTransactions (code = undefined, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        let currency = undefined;
        const request = {};
        if (code !== undefined) {
            currency = this.currency (code);
            request['asset'] = currency['id'];
        }
        if (since !== undefined) {
            request['startTime'] = since;
        }
        const response = await this.privateGetAccountTransactions (this.extend (request, params));
        return this.parseTransactions (response, currency, since, limit);
    }

    parseTransaction (transaction, currency = undefined) {
        //
        //     {
        //         id: 'd53ee9df-89bf-4d09-886e-849f8be64647',
        //         index: 1044718371,
        //         type: 'payout',
        //         status: 'success',
        //         currency: 'ETH',
        //         amount: '4.522683200000000000000000',
        //         createdAt: '2018-06-07T00:43:32.426Z',
        //         updatedAt: '2018-06-07T00:45:36.447Z',
        //         hash: '0x973e5683dfdf80a1fb1e0b96e19085b6489221d2ddf864daa46903c5ec283a0f',
        //         address: '0xC5a59b21948C1d230c8C54f05590000Eb3e1252c',
        //         fee: '0.00958',
        //     },
        //     {
        //         id: 'e6c63331-467e-4922-9edc-019e75d20ba3',
        //         index: 1044714672,
        //         type: 'exchangeToBank',
        //         status: 'success',
        //         currency: 'ETH',
        //         amount: '4.532263200000000000',
        //         createdAt: '2018-06-07T00:42:39.543Z',
        //         updatedAt: '2018-06-07T00:42:39.683Z',
        //     },
        //     {
        //         id: '3b052faa-bf97-4636-a95c-3b5260015a10',
        //         index: 1009280164,
        //         type: 'bankToExchange',
        //         status: 'success',
        //         currency: 'CAS',
        //         amount: '104797.875800000000000000',
        //         createdAt: '2018-05-19T02:34:36.750Z',
        //         updatedAt: '2018-05-19T02:34:36.857Z',
        //     },
        //     {
        //         id: 'd525249f-7498-4c81-ba7b-b6ae2037dc08',
        //         index: 1009279948,
        //         type: 'payin',
        //         status: 'success',
        //         currency: 'CAS',
        //         amount: '104797.875800000000000000',
        //         createdAt: '2018-05-19T02:30:16.698Z',
        //         updatedAt: '2018-05-19T02:34:28.159Z',
        //         hash: '0xa6530e1231de409cf1f282196ed66533b103eac1df2aa4a7739d56b02c5f0388',
        //         address: '0xd53ed559a6d963af7cb3f3fcd0e7ca499054db8b',
        //     }
        //
        //     {
        //         "id": "4f351f4f-a8ee-4984-a468-189ed590ddbd",
        //         "index": 3112719565,
        //         "type": "withdraw",
        //         "status": "success",
        //         "currency": "BCHOLD",
        //         "amount": "0.02423133",
        //         "createdAt": "2019-07-16T16:52:04.494Z",
        //         "updatedAt": "2019-07-16T16:54:07.753Z"
        //     }
        const id = this.safeString (transaction, 'id');
        const timestamp = this.parse8601 (this.safeString (transaction, 'createdAt'));
        const updated = this.parse8601 (this.safeString (transaction, 'updatedAt'));
        const currencyId = this.safeString (transaction, 'currency');
        const code = this.safeCurrencyCode (currencyId, currency);
        const status = this.parseTransactionStatus (this.safeString (transaction, 'status'));
        const amount = this.safeFloat (transaction, 'amount');
        const address = this.safeString (transaction, 'address');
        const txid = this.safeString (transaction, 'hash');
        let fee = undefined;
        const feeCost = this.safeFloat (transaction, 'fee');
        if (feeCost !== undefined) {
            fee = {
                'cost': feeCost,
                'currency': code,
            };
        }
        const type = this.parseTransactionType (this.safeString (transaction, 'type'));
        return {
            'info': transaction,
            'id': id,
            'txid': txid,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'address': address,
            'tag': undefined,
            'type': type,
            'amount': amount,
            'currency': code,
            'status': status,
            'updated': updated,
            'fee': fee,
        };
    }

    parseTransactionStatus (status) {
        const statuses = {
            'pending': 'pending',
            'failed': 'failed',
            'success': 'ok',
        };
        return this.safeString (statuses, status, status);
    }

    parseTransactionType (type) {
        const types = {
            'payin': 'deposit',
            'payout': 'withdrawal',
            'withdraw': 'withdrawal',
        };
        return this.safeString (types, type, type);
    }

    async fetchTrades (symbol, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
        };
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        if (since !== undefined) {
            request['sort'] = 'ASC';
            request['from'] = this.iso8601 (since);
        }
        const response = await this.publicGetTradesSymbol (this.extend (request, params));
        return this.parseTrades (response, market, since, limit);
    }

    async createOrder (symbol, type, side, amount, price = undefined, params = {}) {
        await this.loadMarkets ();
        const market = this.market (symbol);
        // we use clientOrderId as the order id with this exchange intentionally
        // because most of their endpoints will require clientOrderId
        // explained here: https://github.com/ccxt/ccxt/issues/5674
        // their max accepted length is 32 characters
        const uuid = this.uuid ();
        const parts = uuid.split ('-');
        let clientOrderId = parts.join ('');
        clientOrderId = clientOrderId.slice (0, 32);
        amount = parseFloat (amount);
        const request = {
            'clientOrderId': clientOrderId,
            'symbol': market['id'],
            'side': side,
            'quantity': this.amountToPrecision (symbol, amount),
            'type': type,
        };
        if (type === 'limit') {
            request['price'] = this.priceToPrecision (symbol, price);
        } else {
            request['timeInForce'] = this.options['defaultTimeInForce'];
        }
        const response = await this.privatePostOrder (this.extend (request, params));
        const order = this.parseOrder (response);
        if (order['status'] === 'rejected') {
            throw new InvalidOrder (this.id + ' order was rejected by the exchange ' + this.json (order));
        }
        const id = order['id'];
        this.orders[id] = order;
        return order;
    }

    async editOrder (id, symbol, type, side, amount = undefined, price = undefined, params = {}) {
        await this.loadMarkets ();
        // we use clientOrderId as the order id with this exchange intentionally
        // because most of their endpoints will require clientOrderId
        // explained here: https://github.com/ccxt/ccxt/issues/5674
        // their max accepted length is 32 characters
        const uuid = this.uuid ();
        const parts = uuid.split ('-');
        let requestClientId = parts.join ('');
        requestClientId = requestClientId.slice (0, 32);
        const request = {
            'clientOrderId': id,
            'requestClientId': requestClientId,
        };
        if (amount !== undefined) {
            request['quantity'] = this.amountToPrecision (symbol, amount);
        }
        if (price !== undefined) {
            request['price'] = this.priceToPrecision (symbol, price);
        }
        const response = await this.privatePatchOrderClientOrderId (this.extend (request, params));
        const order = this.parseOrder (response);
        this.orders[order['id']] = order;
        return order;
    }

    async cancelOrder (id, symbol = undefined, params = {}) {
        await this.loadMarkets ();
        // we use clientOrderId as the order id with this exchange intentionally
        // because most of their endpoints will require clientOrderId
        // explained here: https://github.com/ccxt/ccxt/issues/5674
        const request = {
            'clientOrderId': id,
        };
        const response = await this.privateDeleteOrderClientOrderId (this.extend (request, params));
        return this.parseOrder (response);
    }

    parseOrderStatus (status) {
        const statuses = {
            'new': 'open',
            'suspended': 'open',
            'partiallyFilled': 'open',
            'filled': 'closed',
            'canceled': 'canceled',
            'expired': 'failed',
        };
        return this.safeString (statuses, status, status);
    }

    parseOrder (order, market = undefined) {
        //
        // createMarketOrder
        //
        //   { clientOrderId:   "fe36aa5e190149bf9985fb673bbb2ea0",
        //         createdAt:   "2018-10-25T16:41:44.780Z",
        //       cumQuantity:   "1",
        //                id:   "66799540063",
        //          quantity:   "1",
        //              side:   "sell",
        //            status:   "filled",
        //            symbol:   "XRPUSDT",
        //       timeInForce:   "FOK",
        //      tradesReport: [ {       fee: "0.0004644",
        //                               id:  386394956,
        //                            price: "0.4644",
        //                         quantity: "1",
        //                        timestamp: "2018-10-25T16:41:44.780Z" } ],
        //              type:   "market",
        //         updatedAt:   "2018-10-25T16:41:44.780Z"                   }
        //
        const created = this.parse8601 (this.safeString (order, 'createdAt'));
        const updated = this.parse8601 (this.safeString (order, 'updatedAt'));
        const marketId = this.safeString (order, 'symbol');
        let symbol = undefined;
        if (marketId !== undefined) {
            if (marketId in this.markets_by_id) {
                market = this.markets_by_id[marketId];
                symbol = market['symbol'];
            } else {
                symbol = marketId;
            }
        }
        if (symbol === undefined) {
            if (market !== undefined) {
                symbol = market['id'];
            }
        }
        const amount = this.safeFloat (order, 'quantity');
        const filled = this.safeFloat (order, 'cumQuantity');
        const status = this.parseOrderStatus (this.safeString (order, 'status'));
        // we use clientOrderId as the order id with this exchange intentionally
        // because most of their endpoints will require clientOrderId
        // explained here: https://github.com/ccxt/ccxt/issues/5674
        const id = this.safeString (order, 'clientOrderId');
        const clientOrderId = id;
        let price = this.safeFloat (order, 'price');
        if (price === undefined) {
            if (id in this.orders) {
                price = this.orders[id]['price'];
            }
        }
        let remaining = undefined;
        let cost = undefined;
        if (amount !== undefined) {
            if (filled !== undefined) {
                remaining = amount - filled;
                if (price !== undefined) {
                    cost = filled * price;
                }
            }
        }
        const type = this.safeString (order, 'type');
        const side = this.safeString (order, 'side');
        let trades = this.safeValue (order, 'tradesReport');
        let fee = undefined;
        let average = undefined;
        if (trades !== undefined) {
            trades = this.parseTrades (trades, market);
            let feeCost = undefined;
            const numTrades = trades.length;
            let tradesCost = 0;
            for (let i = 0; i < numTrades; i++) {
                if (feeCost === undefined) {
                    feeCost = 0;
                }
                tradesCost = this.sum (tradesCost, trades[i]['cost']);
                const tradeFee = this.safeValue (trades[i], 'fee', {});
                const tradeFeeCost = this.safeFloat (tradeFee, 'cost');
                if (tradeFeeCost !== undefined) {
                    feeCost = this.sum (feeCost, tradeFeeCost);
                }
            }
            cost = tradesCost;
            if ((filled !== undefined) && (filled > 0)) {
                average = cost / filled;
                if (type === 'market') {
                    if (price === undefined) {
                        price = average;
                    }
                }
            }
            if (feeCost !== undefined) {
                fee = {
                    'cost': feeCost,
                    'currency': market['quote'],
                };
            }
        }
        return {
            'id': id,
            'clientOrderId': clientOrderId, // https://github.com/ccxt/ccxt/issues/5674
            'timestamp': created,
            'datetime': this.iso8601 (created),
            'lastTradeTimestamp': updated,
            'status': status,
            'symbol': symbol,
            'type': type,
            'side': side,
            'price': price,
            'average': average,
            'amount': amount,
            'cost': cost,
            'filled': filled,
            'remaining': remaining,
            'fee': fee,
            'trades': trades,
            'info': order,
        };
    }

    async fetchOrder (id, symbol = undefined, params = {}) {
        await this.loadMarkets ();
        // we use clientOrderId as the order id with this exchange intentionally
        // because most of their endpoints will require clientOrderId
        // explained here: https://github.com/ccxt/ccxt/issues/5674
        const request = {
            'clientOrderId': id,
        };
        const response = await this.privateGetHistoryOrder (this.extend (request, params));
        const numOrders = response.length;
        if (numOrders > 0) {
            return this.parseOrder (response[0]);
        }
        throw new OrderNotFound (this.id + ' order ' + id + ' not found');
    }

    async fetchOpenOrder (id, symbol = undefined, params = {}) {
        await this.loadMarkets ();
        // we use clientOrderId as the order id with this exchange intentionally
        // because most of their endpoints will require clientOrderId
        // explained here: https://github.com/ccxt/ccxt/issues/5674
        const request = {
            'clientOrderId': id,
        };
        const response = await this.privateGetOrderClientOrderId (this.extend (request, params));
        return this.parseOrder (response);
    }

    async fetchOpenOrders (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        let market = undefined;
        const request = {};
        if (symbol !== undefined) {
            market = this.market (symbol);
            request['symbol'] = market['id'];
        }
        const response = await this.privateGetOrder (this.extend (request, params));
        return this.parseOrders (response, market, since, limit);
    }

    async fetchClosedOrders (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        let market = undefined;
        const request = {};
        if (symbol !== undefined) {
            market = this.market (symbol);
            request['symbol'] = market['id'];
        }
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        if (since !== undefined) {
            request['from'] = this.iso8601 (since);
        }
        const response = await this.privateGetHistoryOrder (this.extend (request, params));
        const parsedOrders = this.parseOrders (response, market);
        const orders = [];
        for (let i = 0; i < parsedOrders.length; i++) {
            const order = parsedOrders[i];
            const status = order['status'];
            if ((status === 'closed') || (status === 'canceled')) {
                orders.push (order);
            }
        }
        return this.filterBySinceLimit (orders, since, limit);
    }

    async fetchMyTrades (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        const request = {
            // 'symbol': 'BTC/USD', // optional
            // 'sort':   'DESC', // or 'ASC'
            // 'by':     'timestamp', // or 'id' String timestamp by default, or id
            // 'from':   'Datetime or Number', // ISO 8601
            // 'till':   'Datetime or Number',
            // 'limit':  100,
            // 'offset': 0,
        };
        let market = undefined;
        if (symbol !== undefined) {
            market = this.market (symbol);
            request['symbol'] = market['id'];
        }
        if (since !== undefined) {
            request['from'] = this.iso8601 (since);
        }
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        const response = await this.privateGetHistoryTrades (this.extend (request, params));
        //
        //     [
        //         {
        //         "id": 9535486,
        //         "clientOrderId": "f8dbaab336d44d5ba3ff578098a68454",
        //         "orderId": 816088377,
        //         "symbol": "ETHBTC",
        //         "side": "sell",
        //         "quantity": "0.061",
        //         "price": "0.045487",
        //         "fee": "0.000002775",
        //         "timestamp": "2017-05-17T12:32:57.848Z"
        //         },
        //         {
        //         "id": 9535437,
        //         "clientOrderId": "27b9bfc068b44194b1f453c7af511ed6",
        //         "orderId": 816088021,
        //         "symbol": "ETHBTC",
        //         "side": "buy",
        //         "quantity": "0.038",
        //         "price": "0.046000",
        //         "fee": "-0.000000174",
        //         "timestamp": "2017-05-17T12:30:57.848Z"
        //         }
        //     ]
        //
        return this.parseTrades (response, market, since, limit);
    }

    async fetchOrderTrades (id, symbol = undefined, since = undefined, limit = undefined, params = {}) {
        // The id needed here is the exchange's id, and not the clientOrderID,
        // which is the id that is stored in the unified order id
        // To get the exchange's id you need to grab it from order['info']['id']
        await this.loadMarkets ();
        let market = undefined;
        if (symbol !== undefined) {
            market = this.market (symbol);
        }
        const request = {
            'orderId': id,
        };
        const response = await this.privateGetHistoryOrderOrderIdTrades (this.extend (request, params));
        const numOrders = response.length;
        if (numOrders > 0) {
            return this.parseTrades (response, market, since, limit);
        }
        throw new OrderNotFound (this.id + ' order ' + id + ' not found, ' + this.id + '.fetchOrderTrades() requires an exchange-specific order id, you need to grab it from order["info"]["id"]');
    }

    async createDepositAddress (code, params = {}) {
        await this.loadMarkets ();
        const currency = this.currency (code);
        const request = {
            'currency': currency['id'],
        };
        const response = await this.privatePostAccountCryptoAddressCurrency (this.extend (request, params));
        const address = this.safeString (response, 'address');
        this.checkAddress (address);
        const tag = this.safeString (response, 'paymentId');
        return {
            'currency': currency,
            'address': address,
            'tag': tag,
            'info': response,
        };
    }

    async fetchDepositAddress (code, params = {}) {
        await this.loadMarkets ();
        const currency = this.currency (code);
        const request = {
            'currency': currency['id'],
        };
        const response = await this.privateGetAccountCryptoAddressCurrency (this.extend (request, params));
        const address = this.safeString (response, 'address');
        this.checkAddress (address);
        const tag = this.safeString (response, 'paymentId');
        return {
            'currency': currency['code'],
            'address': address,
            'tag': tag,
            'info': response,
        };
    }

    async withdraw (code, amount, address, tag = undefined, params = {}) {
        await this.loadMarkets ();
        this.checkAddress (address);
        const currency = this.currency (code);
        const request = {
            'currency': currency['id'],
            'amount': parseFloat (amount),
            'address': address,
        };
        if (tag) {
            request['paymentId'] = tag;
        }
        const response = await this.privatePostAccountCryptoWithdraw (this.extend (request, params));
        return {
            'info': response,
            'id': response['id'],
        };
    }

    nonce () {
        return this.milliseconds ();
    }

    sign (path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
        let url = '/api/' + this.version + '/';
        const query = this.omit (params, this.extractParams (path));
        if (api === 'public') {
            url += api + '/' + this.implodeParams (path, params);
            if (Object.keys (query).length) {
                url += '?' + this.urlencode (query);
            }
        } else {
            this.checkRequiredCredentials ();
            url += this.implodeParams (path, params);
            if (method === 'GET') {
                if (Object.keys (query).length) {
                    url += '?' + this.urlencode (query);
                }
            } else if (Object.keys (query).length) {
                body = this.json (query);
            }
            const payload = this.encode (this.apiKey + ':' + this.secret);
            const auth = this.stringToBase64 (payload);
            headers = {
                'Authorization': 'Basic ' + this.decode (auth),
                'Content-Type': 'application/json',
            };
        }
        url = this.urls['api'][api] + url;
        return { 'url': url, 'method': method, 'body': body, 'headers': headers };
    }

    handleErrors (code, reason, url, method, headers, body, response, requestHeaders, requestBody) {
        if (response === undefined) {
            return;
        }
        if (code >= 400) {
            const feedback = this.id + ' ' + body;
            // {"code":504,"message":"Gateway Timeout","description":""}
            if ((code === 503) || (code === 504)) {
                throw new ExchangeNotAvailable (feedback);
            }
            // fallback to default error handler on rate limit errors
            // {"code":429,"message":"Too many requests","description":"Too many requests"}
            if (code === 429) {
                return;
            }
            // {"error":{"code":20002,"message":"Order not found","description":""}}
            if (body[0] === '{') {
                if ('error' in response) {
                    const errorCode = this.safeString (response['error'], 'code');
                    this.throwExactlyMatchedException (this.exceptions, errorCode, feedback);
                    const message = this.safeString (response['error'], 'message');
                    if (message === 'Duplicate clientOrderId') {
                        throw new InvalidOrder (feedback);
                    }
                }
            }
            throw new ExchangeError (feedback);
        }
    }
};
