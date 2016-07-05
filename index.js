//'use strict';

var MongoClient = require('mongodb');
var assert = require('assert');
//var Storage = require('./storage');
//var storage = new Storage();
var http = require('http');
var fs = require('fs');
var async = require('async');
const apiKey = "0906e06af2380213c811ceb6aabdb618";
const domain = "http://api.reimaginebanking.com/";
const accID = "5751e1d50733d0184021f4c1";
var mongourl = "mongodb://localhost:27017/dummytest";

function getPercentage(){
  var content = fs.readFileSync("./dummyfile/dummyfile.json");
  content = JSON.parse(content);
  //console.log(content);
  var food = 0;
  var clothes = 0;
  var other = 0;
  var bills = 0;
  var entertainment = 0;
  var total = 0;

  (content.purchases).forEach(function(element){
    if (element.type=="food"){
      food += element.amount;
    }else if (element.type=="clothes"){
      clothes += element.amount;
    }else if (element.type=="entertainment"){
      entertainment += element.amount;
    }else if (element.type=="bills"){
      bills += element.amount;
    }else{
      other += element.amount;
    }

    total += element.amount;
  });

  var retval = {};
  retval.food = food/total;
  retval.clothes = clothes/total;
  retval.entertainment = entertainment/total;
  retval.bills = bills/total;
  retval.other = other/total;

  return retval;
}

function getMerchant(merchantID, purchaseID, date, amount, description) {
  var url = domain + "merchants/" + merchantID + "?key=" + apiKey;
  var writeStuff = "";
  //console.log(url);
  var req = http.request(url,
    function (res) {
      //console.log('statusCode: ', res.statusCode);
      //console.log('headers: ', res.headers);

      res.on('data', function (d) {
        //process.stdout.write(d);
        //var jsonContent = d //JSON.parse(d);
        var jsonContent = JSON.parse(d);
        console.log(jsonContent);
        MongoClient.connect(mongourl, function(err, db){
          assert.equal(null, err);
          console.log("Successfully connected to server");

          db.collection('testdb').insert({"_id": purchaseID, "merchant_id": merchantID, "merchant_name:": jsonContent.name, "merchant_type": jsonContent.category, "date": date, "amount": amount, "description": description});

          db.close();
        });
        /*                fs.writeFile('message.txt', writeStuff , function(err) {
        if (err) throw err;
        console.log('It saved mang');
      });
      // process.stdout.write(jsonContent);
      */
      });
    });

    req.end();
    //return writeStuff;
    req.on('error', function (e) {
      console.error(e);
    });
    //return writeStuff;
  }

  function printPurchases(data) {
    console.log("Purchase Date: " + data.purchase_date + "\n" +
    "Amount: $" + data.amount + "\n" +
    "Description: " + data.description + "\n");
  }

  function storePurchase(info){
    async.series([
      function(callback){
        console.log(info);
        callback(null, 'one');
      },
      function(callback){
        getMerchant(info.merchant_id, function(data){
          console.log(data);
        });
        callback(null, 'two');
      }
    ]);
  }
/*
  function getTotalAmountSpent(date){
    var url= domain + "accounts/" + accID + "/purchases?key=" + apiKey;
    console.log(url);

    var amount = 0;
    var req = http.request(url,
      function (res) {
        //console.log('statusCode: ', res.statusCode);
        //console.log('headers: ', res.headers);

        res.on('data', function (d) {

          var jsonContent = JSON.parse(d);

          jsonContent.forEach(function(element, index){
            amount+= element.amount;
          });

          storage.storeTotalAmount(amount);
      });
    });

    req.end();

    req.on('error', function (e) {
      console.error(e);
    });
  }*/

  function getAllPurchases(){
    var url= domain + "accounts/" + accID + "/purchases?key=" + apiKey;
    console.log(url);

    var req = http.request(url,
      function (res) {
        //console.log('statusCode: ', res.statusCode);
        //console.log('headers: ', res.headers);

        res.on('data', function (d) {

          var jsonContent = JSON.parse(d);


          for (var x in jsonContent) {
            var obj = jsonContent[x];
            //console.log(obj);
            console.log("outerloop: " + x);
            console.log(obj);
            getMerchant(obj.merchant_id, obj._id, obj.purchase_date, obj.amount, obj.description);
          }
          /*MongoClient.connect(mongourl, function(err, db){
            assert.equal(null, err);
            console.log("Successfully connected to server");

            jsonContent.forEach(function(element, index){
              console.log(element);
              console.log(typeof element);
              db.collection('testdb').insert(element);
            });

            db.close();
          });*/

      });
    });

    req.end();

    req.on('error', function (e) {
      console.error(e);
    });
  }

getAllPurchases();

module.exports.getPercentage = getPercentage;
