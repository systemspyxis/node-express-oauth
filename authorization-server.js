const fs = require("fs")
const express = require("express")
const bodyParser = require("body-parser")
const jwt = require("jsonwebtoken")
const url = require('url');
const {
	randomString,
	containsAll,
	decodeAuthCredentials,
	timeout,
} = require("./utils")

const config = {
	port: 9001,
	privateKey: fs.readFileSync("assets/private_key.pem"),

	clientId: "my-client",
	clientSecret: "zETqHgl0d7ThysUqPnaFuLOmG1E=",
	redirectUri: "http://localhost:9000/callback",

	authorizationEndpoint: "http://localhost:9001/authorize",
}

const clients = {
	"my-client": {
		name: "Sample Client",
		clientSecret: "zETqHgl0d7ThysUqPnaFuLOmG1E=",
		scopes: ["permission:name", "permission:date_of_birth"],
	},
	"test-client": {
		name: "Test Client",
		clientSecret: "TestSecret",
		scopes: ["permission:name"],
	},
}

const users = {
	user1: "password1",
	john: "appleseed",
}

const requests = {}
const authorizationCodes = {}

let state = ""
let rndStr = randomString()

const app = express()
app.set("view engine", "ejs")
app.set("views", "assets/authorization-server")
app.use(timeout)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/authorize', (req, res) => {
	requests[rndStr] = req.query
	if (clients[req.query.client_id]) {
		if (containsAll(clients[req.query.client_id].scopes, req.query.scope.split(" "))) {
			res.render("login", { client: clients[req.query.client_id], scope: req.query.scope, requestId: rndStr })
			
			//res.end()
		} else {
			res.status(401).end()
		}

	} else {
		res.status(401).end()
	}
})
let request = null
let authcodeid = randomString()
app.post('/approve', (req, res) => {
	if (users[req.body.userName] === req.body.password) {
		if (requests[req.body.requestId]) {
			request = requests[req.body.requestId]
			delete requests[req.body.requestId]

			authorizationCodes[authcodeid] = { clientReq: request, userName: req.body.userName }
			const myrul = new URL(request.redirect_uri)
			myrul.searchParams.append('code', authcodeid)
			myrul.searchParams.append('state', request.state)
			res.redirect(myrul.href)
		} else {
			res.status(401).end()
		}

	} else {
		res.status(401).end()
	}
})
let objCode=null
app.post('/token', (req, res) => {
	if (!req.headers.authorization) {
		res.status(401).end()
	}
	else {
		const { clientId, clientSecret } = decodeAuthCredentials(req.headers.authorization)
		if (clients[clientId] && clients[clientId].clientSecret === clientSecret) {
			if (authorizationCodes[req.body.code]) {
				objCode=authorizationCodes[req.body.code]
				delete authorizationCodes[req.body.code]
				var privateKey = fs.readFileSync('assets/private_key.pem');
				var token = jwt.sign({ userName: objCode.userName, scope: objCode.clientReq.scope }, privateKey, { algorithm: 'RS256' });
				res.json({access_token:token,token_type:'Bearer'})
			} else {
				res.status(401).end()
			}
		}
		else {
			res.status(401).end()
		}
	}

})

const server = app.listen(config.port, "localhost", function () {
	var host = server.address().address
	var port = server.address().port
})

// for testing purposes

module.exports = { app, requests, authorizationCodes, server }
