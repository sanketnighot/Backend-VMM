const mongoose = require("mongoose");

const MinuteSchema =new mongoose.Schema(
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
const HourSchema =new mongoose.Schema(
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
const DaySchema =new mongoose.Schema(
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
const TradeDataMinute = mongoose.model('minute', MinuteSchema);
const TradeDataHour = mongoose.model('hour', HourSchema);
const TradeDataDay= mongoose.model('day', DaySchema);
module.exports = {
    TradeDataMinute, TradeDataHour, TradeDataDay
}