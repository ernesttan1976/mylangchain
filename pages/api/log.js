"use server"
import {connect} from "../../config/database";
import Log from "../../models/Log"

export default async function handler(req, res) {

    if (req.method === 'POST') {

        connect();

        const obj = req.body;
    
        console.info("req.body", req.body)
        
        const log = await Log.create(obj)
    
        res.status(200).json({message: "ok"})
    } else if (req.method === 'GET') {
        connect();
        const logs = await Log.find({}).sort({created_at:-1}).limit(10)
        res.status(200).json({logs: logs})
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
        return;
    }
}