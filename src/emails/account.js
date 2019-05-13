const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'regis@zaleman.com',
        subject: 'Thanks for joining in!',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
    })
}

const sendCancelEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'regis@zaleman.com',
        subject: 'Goodbye!',
        text: `Sorry to see you go ${name}! Your account has been cancelled. Feel free to come back at any time!`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelEmail
}