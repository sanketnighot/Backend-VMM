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
            type:Number
        }

    }
)

module.exports
=mongoose.model("positionHistory", PositionHistory);