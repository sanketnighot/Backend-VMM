const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const dotenv = require("dotenv")
const cors = require('cors');
const axios = require('axios')
const TradeData = require("./models/TradeData");
const PositionHistory = require('./models/PositionHistory')
const TokenIssue = require('./models/TokensAddress')
const { validateAddress } = require("@taquito/utils")
const { TezosToolkit } = require("@taquito/taquito");
const { InMemorySigner } = require("@taquito/signer");

const PRECISION = 1000000000000000000;


dotenv.config();

const Tezos = new TezosToolkit("https://rpc.ghostnet.teztnets.xyz/");


mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => { console.log("connected to db") }).catch((err) => { console.log(err) });

app.use(cors({ origin: '*' }));

app.use(bodyParser.raw());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log('server listening at');
});


app.get('/', async (req, res) => {
  res.send("Root path Zenith API")
})

const iO = require('socket.io')(server, {
  cors: {
    origin: '*',
  }
});


iO.on('connection', (client) => {


  client.on("message", async (data) => {
    if (data == "history") {
      TradeData.find({}, function (err, result) {
        if (err) throw err;

        client.emit("data1", result);
      });
    }
    else if (data == "upDate") {
      var x = await senddata();
      client.emit("data2", x);
    }
  })
  TradeData.watch([{ $match: { operationType: { $in: ['insert'] } } }]).
    on('change', data => {
      console.log('Insert action triggered'); //getting triggered thrice
      client.emit("data3", data.fullDocument.Close);
    });
  TradeData.watch([{ $match: { operationType: { $in: ['update'] } } }]).
    on('change', data => {
      console.log('UpDate action triggered'); //getting triggered thrice
      client.emit("data4", data.updateDescription.updatedFields.Close);
    });
});

const senddata = async () => {
  var x = await TradeData.find().limit(1).sort({ $natural: -1 }).limit(1)
    .then((results) => {
      return results
    })
  return x;
}
// LEADERBOARD DATA -------------------------------------------------------------------------------------------------------------------

app.get('/leaderboard', async (req, res) => {
  const result = await PositionHistory.find({}).then(function (data) {
    return data
  }).catch(err => console.log(err))
  result.sort(function (a, b) {
    return parseFloat(a.Totalpnl) - parseFloat(b.Totalpnl);
  });
  res.send(result)
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


const getData = async () => {
  
  const result = TradeDataMinute.find({}).sort({_id: -1}).limit(900,function (data) {
    return data
  }).catch(err => console.log(err))
  return result
}


// SEND CANDLE DATA -------------------------------------------------------------------------------------------------------------------

app.post('/granularity', async (req, res) => {

  if (req.body.granularity == "5minute") {
    const result = await getData();
    res.send(result)
  }
  else if (req.body.granularity == "15minute") {
    const result = await getData();

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
  else if (req.body.granularity == "hour") {
    const result = await TradeDataHour.find({}).then(function (data) {
      return data
    }).catch(err => console.log(err))




    // let newarr = []
    // for (let i = 0; i < result.length; i = i + 12) {
    //   let Open = result[i].Open;
    //   let High = result[i].High;
    //   let Low = result[i].Low;
    //   let Close = result[i].Close;
    //   for (let j = i; j < i + 12; j++) {
    //     if (j + 1 > result.length) {
    //       break
    //     }
    //     if (High < result[j].High) {
    //       High = result[j].High
    //     }
    //     if (Low > result[j].Low) {
    //       Low = result[j].Low
    //     }
    //     Close = result[j].Close
    //   }
    //   let data = {
    //     Date: result[i].Date,
    //     Open: Open,
    //     High: High,
    //     Low: Low,
    //     Close: Close,
    //   }
    //   newarr.push(data)
    // }


    res.send(result)
  }
  else if (req.body.granularity == "day") {
    const result = await TradeDataDay.find({}).then(function (data) {
      return data
    }).catch(err => console.log(err))

    // let newarr = []
    // for (let i = 0; i < result.length; i = i + 288) {
    //   let Open = result[i].Open;
    //   let High = result[i].High;
    //   let Low = result[i].Low;
    //   let Close = result[i].Close;
    //   for (let j = i; j < i + 288; j++) {
    //     if (j + 1 > result.length) {
    //       break
    //     }
    //     if (High < result[j].High) {
    //       High = result[j].High
    //     }
    //     if (Low > result[j].Low) {
    //       Low = result[j].Low
    //     }
    //     Close = result[j].Close
    //   }
    //   let data = {
    //     Date: result[i].Date,
    //     Open: Open,
    //     High: High,
    //     Low: Low,
    //     Close: Close,
    //   }
    //   newarr.push(data)
    // }
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