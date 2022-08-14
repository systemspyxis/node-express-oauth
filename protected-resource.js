const express = require("express")
const bodyParser = require("body-parser")
const fs = require("fs")
const { timeout } = require("./utils")
const jwt = require("jsonwebtoken")

const config = {
	port: 9002,
	publicKey: fs.readFileSync("assets/public_key.pem"),
}

const users = {
	user1: {
		username: "user1",
		name: "User 1",
		date_of_birth: "7th October 1990",
		weight: 57,
	},
	john: {
		username: "john",
		name: "John Appleseed",
		date_of_birth: "12th September 1998",
		weight: 87,
	},
}

const app = express()
app.use(timeout)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/user-info', (req, res) => {
	if (req.headers.authorization) {

		try {
			var decoded = jwt.verify(req.headers.authorization.slice(7), config.publicKey, { algorithms: ['RS256'] });
			let perms = decoded.scope.split(" ")
			let user = users[decoded.userName]
			var obj = {}

			for (const element of perms) {
				obj[element.slice(11)] = user[element.slice(11)]
			}
			res.json(obj)
		} catch (err) {
			res.status(401).end()
		}

	} else {
		res.status(401).end()
	}
})

const server = app.listen(config.port, "localhost", function () {
	var host = server.address().address
	var port = server.address().port
})

// for testing purposes
module.exports = {
	app,
	server,
}
