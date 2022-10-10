const mongoose = require("mongoose");

const TokenIssue =new mongoose.Schema(
    {
        Address:{
            type:String,
        },
        TokenIssue:{
            type:String,
        }

    }
)

module.exports
=mongoose.model("TokenIssue", TokenIssue);