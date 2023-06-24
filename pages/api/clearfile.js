import {connect, disconnect} from '../../config/database'
import File from "../../models/Files";

export default async function handler(req, res) {
    connect();
    await File.deleteMany({});
    res.status(200).json({
        message: 'Ready to receive file'});
}
