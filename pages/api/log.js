"use server"
import {connect} from "../../config/database";
import Log from "../../models/Log"

export default async function handler(req, res) {

    if (req.method !== 'POST') {
        res.status(405).json({ message: 'Method Not Allowed' });
        return;
    }

    connect();

    const obj = req.body;

    console.info("req.body", req.body)
    
    const log = await Log.create(obj)

    res.status(200).json({message: "ok"})
}