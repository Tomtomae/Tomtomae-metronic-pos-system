import { Router } from "express";
import { getCompetitors } from "../controllers/CompetitorsController.js";

const router : Router= Router()

router.get('/Competitors',getCompetitors)