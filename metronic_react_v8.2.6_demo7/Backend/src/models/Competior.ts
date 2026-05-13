
import mongoose, { mongo } from "mongoose";

const CompetitorSchema = new mongoose.Schema({
    name:{type:String,require:true},
    description:{type:String,require:true},
    author:{type:String},
    sales:{
        type:Number,
        require:true
    },
    logo:{
        type:String
    }
},{timestamps:true})

export const Competitors = mongoose.model('Competitor',CompetitorSchema)