import {connect, disconnect} from "../../../config/database";
import {Tool} from "../../../models/toolsModel"

export default async function handler(req, res) {

  if (req.method === 'GET') {
    connect();

    const tools = await Tool.find({})

    res.status(200).json({ tools });
  }
}