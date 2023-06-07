// cors.js

export default function cors(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin,Content-Type');
  
    // Allow preflight requests to bypass the actual request
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
  
    next();
  }
  