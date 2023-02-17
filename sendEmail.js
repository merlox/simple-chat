require('dotenv-safe').config()

const { MAILGUN_SENDING_API_KEY, MAILGUN_DOMAIN } = process.env
const mailgun = require('mailgun-js')
const mg = mailgun({
	apiKey: MAILGUN_SENDING_API_KEY,
	domain: MAILGUN_DOMAIN,
	host: 'api.eu.mailgun.net',
})

function sendEmail(to, subject, message) {
	const data = {
		from: 'Email notification <chat@postmaster.com>',
		to,
		subject,
		html: message,
	}

	return new Promise((resolve, reject) => {
		mg.messages().send(data, (err, info) => {
			if(err) return reject(err)
			resolve(info)
		})
	})
}

module.exports = sendEmail