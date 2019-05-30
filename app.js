const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const graphqlHTTP = require('express-graphql');
const graphqlSchema = require('./graphql/schema');
const graphqlResolvers = require('./graphql/resolvers');
const app = express();

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

/**
|--------------------------------------------------
| Graphql config
|--------------------------------------------------
*/

app.use(
	'/graphql',
	graphqlHTTP({
		schema: graphqlSchema,
		rootValue: graphqlResolvers,
		graphiql: true
	})
);

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
