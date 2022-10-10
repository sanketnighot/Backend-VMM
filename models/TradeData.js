const mongoose = require("mongoose");

const TradeData =new mongoose.Schema(
    {
        Date:{
            type:Date,
        },
        Open:{
            type:Number,

        },
        High:{
            type:Number,
        },
        Low:{
            type:Number,
        },
        Close:{
            type:Number,
        }
    }
)

module.exports
=mongoose.model("tradedata", TradeData);