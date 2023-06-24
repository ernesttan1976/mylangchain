import {connect, disconnect} from "../../../config/database";
import {Tool} from "../../../models/toolsModel"

export default async function handler(req, res) {

  const { id } = req.query;
  console.log(id)
  connect();

  if (req.method === "PUT"){
    const tool = req.body;
    console.log(req.body)
    const foundTool = await Tool.findById(id);
    const output = await foundTool.updateOne(tool);
    res.status(200).json({message: "Updated"});
    return;   
  } else if (req.method === 'DELETE') {
    await Tool.findByIdAndDelete(id);
    res.status(200).json({message: "Deleted"});
    return;
  }
}