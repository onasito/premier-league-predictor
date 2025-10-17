import jwt from 'jsonwebtoken';

const verifyToken = (req, res, next) => {
    // Get token from authorization header
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(403).send({ message: 'No token provided' });
    }

    // Verify token
    jwt.verify(token, process.env.jwt_SECRET, (err, decoded) => {
        // if there is an error verifying the token
        if (err) {
            return res.status(401).send({ message: 'Unauthorized token' });
        }
            // if token is valid, save user id for future use
        req.userId = decoded.id;
        next();
    })
}

