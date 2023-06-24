import {connect,disconnect} from "../../config/database";
import { Tool } from "../../models/toolsModel"

export default async function handler(req, res) {

    if (req.method === 'GET') {
        connect();

        const url = req.query.install_plugin;
        //fetch json from url
        const response = await fetch(url);
        const json = await response.json();

        if (json.auth.type === 'none'){
            const newTool = {
                label: json.name_for_human,
                value: json.name_for_human,
                url: url,
                description: json.description_for_human,
            }
            const toolExists = await Tool.findOne({label: newTool.label});
            if (toolExists) {
                res.status(404).json({message: "Tool already exists"})
                return;
            }
            const tool = await Tool.create(newTool);

            console.log("Tool created:",tool)
            console.log("redirect to /?page=4")
            res.redirect('/?page=4')
            return;
        } else {
            res.status(404).json({message: 'Plugin is not "no auth", failed to add.'})
        }
    }
}

// {
//     "schema_version": "v1",
//         "name_for_human": "Stories",
//             "name_for_model": "storybird_stories",
//                 "description_for_human": "Create beautiful, illustrated stories easily.",
//                     "description_for_model": "Generate stories from a prompt. Submit the query to API with 'prompt' as JSON input and render the story based on information received in the response.",
//                         "auth": {
//         "type": "none"
//     },
//     "api": {
//         "type": "openapi",
//             "url": "https://api.storybird.ai/.well-known/openapi.yaml",
//                 "is_user_authenticated": false
//     },
//     "logo_url": "https://api.storybird.ai/.well-known/logo.png",
//         "contact_email": "steven@storybird.ai",
//             "legal_info_url": "https://storybird.ai/"
// }