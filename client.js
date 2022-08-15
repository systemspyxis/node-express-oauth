const express = require("express")
const bodyParser = require("body-parser")
const axios = require("axios").default
const { randomString, timeout } = require("./utils")
const url = require('url');

const config = {
	port: 9000,

	clientId: "my-client",
	clientSecret: "zETqHgl0d7ThysUqPnaFuLOmG1E=",
	redirectUri: "http://localhost:9000/callback",

	authorizationEndpoint: "http://localhost:9001/authorize",
	tokenEndpoint: "http://localhost:9001/token",
	userInfoEndpoint: "http://localhost:9002/user-info",
}
let state = ""

const app = express()
app.set("view engine", "ejs")
app.set("views", "assets/client")
app.use(timeout)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/authorize', (req, res) => {
	state = randomString()
	let urlred = new URL(config.authorizationEndpoint)
	urlred.searchParams.append('response_type', 'code')
	urlred.searchParams.append('client_id', config.clientId)
	urlred.searchParams.append('redirect_uri', config.redirectUri)
	urlred.searchParams.append('scope', 'permission:name permission:date_of_birth')
	urlred.searchParams.append('state', state)
	res.redirect(urlred.href)
})

app.get('/callback', (req, res) => {
	if (req.query.state === state) {
		axios({
			method: 'post',
			url: config.tokenEndpoint,
			auth: { username: config.clientId, password: config.clientSecret },
			data:{code:req.query.code}
		})
			.then(function (response) {
				axios({
					method: 'get',
					url: config.userInfoEndpoint,
					headers:{authorization:"bearer "+response.data.access_token}
				  })
					.then(function (response) {
						res.render("welcome",{user:response.data})
					});
			});
	} else {
		res.status(403).end()
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
	getState() {
		return state
	},
	setState(s) {
		state = s
	},
}
