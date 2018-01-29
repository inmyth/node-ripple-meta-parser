"use strict";

const inspect = require('util').inspect;
const parseOrderbookChanges = require('ripple-lib-transactionparser').parseOrderbookChanges;
const parseBalanceChanges = require('ripple-lib-transactionparser').parseBalanceChanges;

function show(object){
  return inspect(object, false, null);
}

function orderChanges(raw, myAddress, isDataAPI){
  let json = JSON.parse(raw)
  let transactions = isDataAPI ? json.transactions : json.result.transactions;

 return transactions
  .map(r => {
    let orderbookChanges =  parseOrderbookChanges(r.meta);
     console.log(r.hash);
    console.log(show(orderbookChanges));
    return [{hash: r.hash, ledger_index: r.ledger_index, date: r.date}, orderbookChanges];
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

function balanceChanges(raw, myAddress, isDataAPI){
  let json = JSON.parse(raw)
  let transactions = isDataAPI ? json.transactions : json.result.transactions;
  return transactions
  .map(r => {
    let balanceChanges = parseBalanceChanges(r.meta);
    let myBalanceChanges = balanceChanges[myAddress];
    return {hash: r.hash, ledger_index: r.ledger_index, date: r.date, data : myBalanceChanges};
  })
  .filter(r => r.data !== undefined);
}

module.exports = {
  balanceChanges : balanceChanges,
  orderChanges  : orderChanges
}
