### Ripple meta parser
This parser processes the result of Ripple meta parser https://www.npmjs.com/package/ripple-lib-transactionparser for the UI purpose of mr.exchange

```
balanceChanges(text, myAddress, isDataApi)
orderChanges(text, myAddress, isDataApi)
balanceToTrade(text, myAddress, isDataApi)
```
*balanceChanges*

Parses changes in balance using ripple-lib-transactionparser's parseBalanceChanges.

*orderChanges*

Parses executed orders from ripple-lib-transactionparser's parseOrderbookChanges.
Do NOT use this function. It cannot handle autobridge.

*balanceToTrade*

Parses executed orders from balanceChanges.

*Params*

text : the raw response from DataApi's transactions or Websocket's account_tx

myAddress : address the response belongs to

isDataApi (boolean) : true if response comes from DataApi (/transactions), false if from RippleApi web socket (tx, account_tx, ...)

#### Make module from Browserify
Transform the module to js library for browser

```
npm install -g browserify

browserify main.js --s metaparser > metaparser.js
```

Then in html
```

<script>metaparser.orderChanges(text, myRippleAddress, true);</script>
```
