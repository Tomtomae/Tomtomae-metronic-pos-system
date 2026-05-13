import { Router } from "express";
import {
    getTrends
} from "../controllers/Trends.js"

const router:Router = Router()

router.get('/Trend',getTrends)