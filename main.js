"use strict";

const inspect = require('util').inspect;
var Big = require('./big.min.js');
const parseOrderbookChanges = require('ripple-lib-transactionparser').parseOrderbookChanges;
const parseBalanceChanges = require('ripple-lib-transactionparser').parseBalanceChanges;
const zero = Big('0.0');
const million = Big('1000000')

function show(object){
  return inspect(object, false, null);
}

function orderChanges(raw, myAddress, isDataAPI){
  let json = JSON.parse(raw)
  let transactions = isDataAPI ? json.transactions : json.result.transactions;

 return transactions
  .map(r => {
    let orderbookChanges =  parseOrderbookChanges(r.meta);
    let basics = getBasics(isDataAPI ? r : r.tx, isDataAPI);
    return [{hash: basics.hash, ledger_index: basics.ledger_index, date: basics.date}, orderbookChanges];
  })
  .map(z => {
    let r = z[1];
    let myOrders = [];
    // if key == myaddress, then order is returned as is
    // if not reverse the direction
    let myStuff= r[myAddress];
    if (myStuff === undefined){
      let orders = Object.keys(r)
      .map(key => r[key])
      .reduce((a, b) => a.concat(b), [])
      .map(order => {
        order.direction = order.direction === 'buy' ? 'sell' : 'buy';
        return order;
      });
      myOrders = myOrders.concat(orders);
    }
    else {
      let orders = myStuff
      .filter(order => order.status === 'filled' || order.status === 'partially-filled')
      .reduce((a, b) => a.concat(b), []);
      myOrders = myOrders.concat(orders);
    }
    return [z[0], myOrders];
  })
  .filter(z => z[1].length > 0)
  .map(z => {
    let orders = z[1].map(o =>{
      if (o.direction === 'sell'){
          o.direction = 'buy';
          let temp = o.quantity;
          o.quantity = o.totalPrice;
          o.totalPrice = temp;
      }
      return o;
    })
    return {hash: z[0].hash, ledger_index: z[0].ledger_index, date: z[0].date, data : orders};
  })
}

function getBasics(root, isDataAPI){
  let res = {
    date : undefined,
    hash : undefined,
    ledger_index : undefined
    }

  res.date = isDataAPI ? new Date(root.date).toISOString() : new Date((parseInt(root.date) + 946684800) * 1000).toISOString();
  res.hash = root.hash;
  res.ledger_index = root.ledger_index;
  return res;
}

function balanceChanges(raw, myAddress, isDataAPI){
  let json = JSON.parse(raw)
  let transactions = isDataAPI ? json.transactions : json.result.transactions;

  return transactions
  .map(r => {
    let balanceChanges = parseBalanceChanges(r.meta);
    let myBalanceChanges = balanceChanges[myAddress];
    let basics = getBasics(isDataAPI ? r : r.tx, isDataAPI);
    let feeXRP = r.tx.Account === myAddress ? (Big(r.tx.Fee).div(million)) : zero;
    return {hash: basics.hash, ledger_index: basics.ledger_index, date: basics.date, feeXRP : feeXRP, data : myBalanceChanges};
  })
  .filter(r => r.data !== undefined);
}


function balanceToTrade(raw, myAddress, isDataAPI){
  return balanceChanges(raw, myAddress, isDataAPI)
  .filter(r => r.data.length > 1) // length 1 = payment or fees
  .map(r => {
    let get  = [];
    let pay  = [];
    let feeXRP  = r.feeXRP;

    r.data.forEach(d => balanceToTradePusher(d, get, pay))
    if (feeXRP.gt(zero)){
      pay = pay
      .map(z => {
        if(z.currency === "XRP"){
          z.value = toFixed(Big(z.value).plus(feeXRP).toFixed(6));
        }
        return z;
      })
      .filter(z => !Big(z.value).eq(zero))
    }
    return {hash: r.hash, ledger_index: r.ledger_index, date: r.date, get : get, pay : pay, fee : toFixed(feeXRP)};
  })
  // exchange has only get or pay filled
  .filter(r => r.get.length > 0 && r.pay.length > 0);
}

function balanceToTradePusher(data, get, pay){
  let bigValue = Big(data.value);
  data.value = toFixed(data.value);
  if (bigValue.lt(zero)){
    pay.push(data);
  } else {
    get.push(data);
  }
}

function toFixed(num) {
  let numStr = String(num);

  if (Math.abs(num) < 1.0)
  {
      let e = parseInt(num.toString().split('e-')[1]);
      if (e)
      {
          let negative = num < 0;
          if (negative) num *= -1
          num *= Math.pow(10, e - 1);
          numStr = '0.' + (new Array(e)).join('0') + num.toString().substring(2);
          if (negative) numStr = "-" + numStr;
      }
  }
  else
  {
      let e = parseInt(num.toString().split('+')[1]);
      if (e > 20)
      {
          e -= 20;
          num /= Math.pow(10, e);
          numStr = num.toString() + (new Array(e + 1)).join('0');
      }
  }

  return numStr;
}


module.exports = {
  balanceChanges : balanceChanges,
  orderChanges  : orderChanges,
  balanceToTrade : balanceToTrade
}
