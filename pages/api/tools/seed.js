import {connect, disconnect} from "../../../config/database";
import {Tool, toolsSeedData} from "../../../models/toolsModel"

export default async function handler(req, res) {
  connect();

  if (req.method === 'GET') {
    await Tool.deleteMany({});

    toolsSeedData.forEach(async(tool)=>{
      await Tool.create({
        ...tool
      });
    })

    
    const tools = await Tool.find({});
    res.status(200).json({tools});
  }
}