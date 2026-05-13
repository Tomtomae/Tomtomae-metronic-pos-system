
import { type Request,type Response } from "express";
import  {trends} from './../models/Trends.js'

export const  getTrends = async (req:Request,res:Response) =>{
    try{
        const Trend = await trends.find()
        res.status(200).json(Trend)
    }catch(error:any){
        res.status(500).json({message: "Error fetching Competitors", error: error.message })
    }
}   