const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const dotenv = require("dotenv")
const socket = require('socket.io')
const cors = require('cors');
const axios = require('axios')
const { TradeDataHour, TradeDataDay, TradeDataMinute } = require("./models/TradeData");
const PositionHistory = require('./models/PositionHistory')
const TokenIssue = require('./models/TokensAddress')
const { validateAddress } = require("@taquito/utils")
const signalR = require("@microsoft/signalr");
const { TezosToolkit } = require("@taquito/taquito");
const { InMemorySigner } = require("@taquito/signer");

const PRECISION = 1000000000000000000;


dotenv.config();

const Tezos = new TezosToolkit("https://rpc.ghostnet.teztnets.xyz/");

Tezos.setProvider({
  signer: new InMemorySigner(process.env.PVT_KEY)
})
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => { console.log("connected to db") }).catch((err) => { console.log(err) });

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.use(bodyParser.raw());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))
const server = app.listen(process.env.PORT || 5000, () => {
  console.log('Started in 8000 PORT')
})

const iO = require('socket.io')(server, {
  cors: {
    origin: '*',
  }
});


const senddata = async () => {
  var x = await TradeDataMinute.find().limit(1).sort({ $natural: -1 }).limit(1)
    .then((results) => {
      return results
    })
  return x;
}

iO.on('connection', (client) => {


  client.on("message", async (data) => {
    if (data == "history") {
      TradeDataMinute.find({}, function (err, result) {
        if (err) throw err;

        client.emit("data1", result);
      });
    }
    else if (data == "upDate") {
      var x = await senddata();
      client.emit("data2", x);
    }
  })
  TradeDataMinute.watch([{ $match: { operationType: { $in: ['insert'] } } }]).
    on('change', data => {
      console.log('Insert action triggered'); //getting triggered thrice
      client.emit("data3", data.fullDocument.Close);
    });
  TradeDataMinute.watch([{ $match: { operationType: { $in: ['update'] } } }]).
    on('change', data => {
      console.log('UpDate action triggered'); //getting triggered thrice
      client.emit("data4", data.updateDescription.updatedFields.Close);
    });
});
console.log('A user connected');

// LEADERBOARD DATA -------------------------------------------------------------------------------------------------------------------

app.get('/leaderboard', async (req, res) => {
  try{
    const result = await PositionHistory.find({}).then(function (data) {
      return data
    }).catch(err => console.log(err))
    result.sort(function (a, b) {
      return parseFloat(a.Totalpnl) - parseFloat(b.Totalpnl);
    });

    res.send(result)
  }catch(err){
    console.log(err)
  }
})

// POSITION History-------------------------------------------------------------------------------------------------------------------
app.post('/positionshistory', async (req, res) => {
  let address = req.body.address;
  const result = await PositionHistory.findOne({ Address: address }).select("Address").lean();
  if (result) {
    let data = await PositionHistory.findOne({ Address: address }).then(res => {
      return res
    }).catch(err => {
      return false
    })
    res.send(data.CompletedPosition)
  }
  else {
    res.send(false)
  }
})


// SEND CANDLE DATA -------------------------------------------------------------------------------------------------------------------
const getData = async () => {

  const result = await TradeDataMinute.find({}).sort({ _id: -1 }).limit(864, function (data) {
    return data.reverse()
  }).catch(err => console.log(err))

  return result
}

app.get('/granularity/', async (req, res) => {
  console.log(req.query.candle)
  if (req.query.candle == "5minute") {
    const result = await getData();
    res.send(result.reverse())
  }
  else if (req.query.candle == "15minute") {
    var newdate_Minute = new Date().getMinutes();
    let x = 0
    if(newdate_Minute%15>=5 && newdate_Minute%15<10){
      x=2;
    }
    if(newdate_Minute%15>0 && newdate_Minute%15<5){
      x=1;
    }
    const result = await TradeDataMinute.find({}).sort({ _id: -1 }).limit(864+x, function (data) {
      return data
    }).catch(err => console.log(err))

    result.reverse()

    let newarr = []
    for (let i = 0; i < result.length; i = i + 3) {
      let Open = result[i].Open;
      let High = result[i].High;
      let Low = result[i].Low;
      let Close = result[i].Close;
      for (let j = i; j < i + 3; j++) {
        if (j + 1 > result.length) {
          break
        }
        if (High < result[j].High) {
          High = result[j].High
        }
        if (Low > result[j].Low) {
          Low = result[j].Low
        }
        Close = result[j].Close
      }
      let data = {
        Date: result[i].Date,
        Open: Open,
        High: High,
        Low: Low,
        Close: Close,
      }
      newarr.push(data)
    }
    res.send(newarr)
  }
  else if (req.query.candle == "hour") {
    const result = await TradeDataHour.find({}).then(function (data) {
      return data
    }).catch(err => console.log(err))
    res.send(result)
  }
  else if (req.query.candle == "day") {
    const result = await TradeDataDay.find({}).then(function (data) {
      return data
    }).catch(err => console.log(err))
    res.send(result)
  }
})


// SendTestToken-------------------------------------------------------------------------------------------------------------------

app.post("/getToken", async (req, res) => {
  try {
    const address = req.body.address;
    const valid = validateAddress(address)
    const result = await TokenIssue.findOne({ Address: address })
    Tezos.setProvider({
      signer: new InMemorySigner(process.env.PVT_KEY),
      });
    if (valid == 3) {
      if (!result) {
        await Tezos.contract
		.at("KT1D5xQy9x7YSgrzTzLJx9tEQ6qK9pSW2vfz") 
		.then(async(contract) => {
			contract.methods.mint(address, 1000*PRECISION).send().then(async()=>{
        await TokenIssue.create({Address: address, TokenIssue: 1000})
      });
		})
        res.send("Issued")
      } else {
        res.send("Already Issued")
      }
      
    }
    else {
      res.send("false")
    }
  }
  catch (err) {
    res.status(404).send(false)
  }

})