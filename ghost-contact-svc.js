'use strict';
var express    = require('express');
var cors       = require('cors');
var bodyParser = require("body-parser");
var dotenv     = require('dotenv').config();
var nodemailer = require('nodemailer');
var smtpTrans  = require('nodemailer-smtp-transport');
var validator  = require("email-validator");
var sanitize   = require('sanitize-html');
var smtp  = { "auth": {}, "port": 465, "secure": true, "tls": {"rejectUnauthorized": false}, "debug": false};
smtp.host      = process.env.SMTP_HOST;
smtp.auth.user = process.env.SMTP_USER;
smtp.auth.pass = process.env.SMTP_PASS;
const allowUrl = process.env.ALLOW_ORIGIN;
var transporter = nodemailer.createTransport(smtpTrans(smtp));

const shouldLog = !process.env.NODE_ENV || process.env.DEBUG === 'true';
const DEBUGLOG = shouldLog ? console.log : (() => {});

var app = express();
app.disable('x-powered-by');
app.use(bodyParser.urlencoded({limit: '1mb', extended: false}));
app.use(bodyParser.json({limit: '1mb'}));
app.use(cors({origin: process.env.ALLOW_ORIGIN, 
    allowedHeaders: ['Content-Type', 'application/json; charset=utf-8', 'text/html; charset=utf-8']}));

app.use((req, res, next) => {
  DEBUGLOG(`Request headers:`, req.headers);
  const clientIp = req.headers['x-forwarded-for'] 
                  ? req.headers['x-forwarded-for'].split(',')[0].trim() 
                  : req.connection.remoteAddress;
  req.clientIp = clientIp;
  next();
});

app.use('/v1/assets', express.static(__dirname + '/assets'));
app.use('/v1/form-constraints', express.static(__dirname + '/form-constraints.json'));

app.post('/v1/contact', function(req, res) {
    console.log(`Sending mail from clientIp: ${req.clientIp}`);
    if(validator.validate(req.body.email)) return sendEmail(req.body, res);  
    res.status(403).json({"validation": "no email"});
});

app.listen(process.env.PORT || 7000, process.env.LOCALBIND || 'localhost', function(){
	console.log('Listening on http://' + (process.env.LOCALBIND || 'localhost') + (':') + (process.env.PORT || 7000));
});

function sendEmail(data, res) {
    const email = {
        from: process.env.EMAIL_FROM,
        to: process.env.EMAIL_TO
    };
    
    email.subject = (process.env.EMAIL_SUBJHEAD || 'My Site\'s Form') + ' - ' + (data.subject && data.subject.toUpperCase());

    const formDetails = Object.keys(data)
        .filter(key => typeof data[key] === 'string' && key !== 'message' && data[key].trim())
        .map(key => `<li>${key}: ${sanitize(data[key])}</li>`);

    const emailContent = `
        <p>Hello,<p>
        <p>Someone filled out a form on your site.</p>
        <h3>Form Details</h3>
        <ul>${formDetails.join('')}</ul>
        <h3>Message:</h3>
        <p>${sanitize(data.message || '')}</p>
    `;

    email.html = sanitize(emailContent, {
        allowedTags: sanitize.defaults.allowedTags.concat(['img'])
    });

    transporter.sendMail(email, function(error, info) {
        if (error) return res.json({ sendEmail: "failed" });
        res.json({ sendEmail: "ok" });
    });
}
