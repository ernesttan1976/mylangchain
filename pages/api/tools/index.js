import { getTools} from "../../../models/toolsModel";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const tools = await getTools();
    res.status(200).json({tools})
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}