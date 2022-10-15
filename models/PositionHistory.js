const mongoose = require("mongoose");

const PositionHistory =new mongoose.Schema(
    {
        Address:{
            type:String,
        },
        CompletedPosition:{
            type:[Object],

        },
        LivePosition:{
            type:Object
        },
        Totalpnl:{
            type:Number,
            default:0
        },
        LiquidationCount:{
            type:Number,
            default:0
        }

    }
)

module.exports=mongoose.model("positionHistory", PositionHistory);