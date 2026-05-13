import mongoose, { Schema } from "mongoose";

const Trends  = new mongoose.Schema({
    title:{type:String,require:true},
    subscribe:{
        type:String
    },
    valueChange:{
        type:String,require:true
    },
    category:{
        type:String,
        enum:['author','user','theme','app'],
        require:true
    }
},{timestamps:true})

export const trends =mongoose.model('Trend',Trends)