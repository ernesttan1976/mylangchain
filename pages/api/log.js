"use server"
import {connect} from "../../config/database";
import Log from "../../models/Log"

export default async function handler(req, res) {

    if (req.method === 'POST') {

        connect();

        const obj = req.body;
    
        // console.info("req.body", req.body)
        // console.info("req", req)

        const newHistory = obj.history.map(h=>{
            console.log("h type:", typeof h)
            return JSON.stringify(h)
        })

        const newObj = {
            ...obj, ...newHistory
        }

        const log = await Log.create(newObj)
    
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