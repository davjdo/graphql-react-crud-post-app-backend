const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const graphqlHTTP = require('express-graphql');
const graphqlSchema = require('./graphql/schema');
const graphqlResolvers = require('./graphql/resolvers');
const auth = require('./middleware/auth');
const { clearImage } = require('./utils/file');
const app = express();

/**
|--------------------------------------------------
| Add Multer configuration
|--------------------------------------------------
*/

const fileStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'images');
	},
	filename: (req, file, cb) => {
		cb(null, new Date().toISOString() + '-' + file.originalname);
	}
});

const fileFilter = (req, file, cb) => {
	if (
		file.mimetype === 'image/png' ||
		file.mimetype === 'image/jpg' ||
		file.mimetype === 'image/jpeg'
	) {
		cb(null, true);
	} else {
		cb(null, false);
	}
};

/**
 |--------------------------------------------------
 | Middleware
 |--------------------------------------------------
 */

// JSON bodyParser - application/json
app.use(express.json());

// CORS fixed headers
app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader(
		'Access-Control-Allow-Methods',
		'OPTIONS, GET, POST, PUT, PATCH, DELETE'
	);
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	if (req.method === 'OPTIONS') {
		return res.sendStatus(200);
	}
	next();
});

app.use(cors());

// Add multer middleware
app.use(
	multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);

// Serve statically images folder with express static middleware
app.use('/images', express.static(path.join(__dirname, 'images')));

// Add auth middleware
app.use(auth);

// Graphql config
app.use(
	'/graphql',
	graphqlHTTP({
		schema: graphqlSchema,
		rootValue: graphqlResolvers,
		graphiql: true,
		customFormatErrorFn(err) {
			if (!err.originalError) {
				return err;
			}
			const data = err.originalError.data;
			const message = err.message || 'An error occured.';
			const code = err.originalError.code || 500;
			return { message: message, status: code, data: data };
		}
	})
);

// PUT route to get image
app.put('/post-image', (req, res, next) => {
	if (!req.isAuth) {
		throw new Error('Not authenticated!');
	}
	if (!req.file) {
		return res.status(200).json({ message: 'No file provided!' });
	}
	if (req.body.oldPath) {
		clearImage(req.body.oldPath);
	}
	return res
		.status(201)
		.json({ message: 'File stored.', filePath: req.file.path });
});

/**
|--------------------------------------------------
| Connect to Mongoose
|--------------------------------------------------
*/

mongoose
	.connect(
		`mongodb+srv://${process.env.MONGO_USER}:${
			process.env.MONGO_PASSWORD
		}@ddcluster-rzhoj.mongodb.net/${process.env.MONGO_DB}?retryWrites=true`,
		{
			useNewUrlParser: true,
			useCreateIndex: true
		}
	)
	.then(() => {
		const port = process.env.PORT || 3002;
		app.listen(port, () => console.log(`Server is running on port ${port}`));
	})
	.catch(err => {
		console.log(err);
	});
