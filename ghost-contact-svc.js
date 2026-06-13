'use strict';
var express    = require('express');
var cors       = require('cors');
var bodyParser = require("body-parser");
var dotenv     = require('dotenv').config();
var nodemailer = require('nodemailer');
var smtpTrans  = require('nodemailer-smtp-transport');
var validator  = require("email-validator");
var sanitize   = require('sanitize-html');
var logger     = require('./utility/logger.js');
const { ReadStream } = require('fs');
const path     = require('path');
var smtp       = { "auth": {}, "port": 465, "secure": true, "tls": {"rejectUnauthorized": false}, "debug": false};
smtp.host      = process.env.SMTP_HOST;
smtp.auth.user = process.env.SMTP_USER;
smtp.auth.pass = process.env.SMTP_PASS;
const allowUrl = process.env.ALLOW_ORIGIN;
var transporter = nodemailer.createTransport(smtpTrans(smtp));

var app = express();
app.disable('x-powered-by');
app.use(bodyParser.urlencoded({limit: '1mb', extended: false}));
app.use(bodyParser.json({limit: '1mb'}));
app.use(cors({origin: process.env.ALLOW_ORIGIN, 
    allowedHeaders: ['Content-Type', 'application/json; charset=utf-8', 'text/html; charset=utf-8']}));

app.use((req, res, next) => {
  const clientIp = req.headers['x-forwarded-for'] 
                  ? req.headers['x-forwarded-for'].split(',')[0].trim() 
                  : req.connection.remoteAddress;
  req.clientIp = clientIp;
  logger.DEBUGLOG(`Url requested: ${req.originalUrl} from ${clientIp}`);
  logger.DEBUGLOG(`Request headers: ${JSON.stringify(req.headers, null, 2)}`);
  next();
});

app.use('/formhandler/assets', express.static(__dirname + '/assets'));

app.get('/formhandler/form-constraints', async (req, res) => {
  const { form_id } = req.query;
  try {
    const filePath = form_id 
      ? path.join(__dirname, 'validators', `form-${encodeURIComponent(form_id)}.json`)
      : path.join(__dirname, 'validators', 'form-constraints.json');
    logger.DEBUGLOG('Loading constraints - ' + filePath);
    const fileContents = await new Promise((resolve, reject) => {
      const stream = new ReadStream(filePath);
      stream.on('data', (chunk) => {
        resolve(chunk.toString());
      });
      stream.on('error', (err) => {
        reject(err);
      });
      stream.on('end', () => {
        stream.destroy();
      });
    });
    res.json(JSON.parse(fileContents));
  } catch (err) {
    res.status(404).send('Form constraints not found');
  }
});

app.post('/formhandler/contact', function(req, res) {
    console.log(`Sending mail from clientIp: ${req.clientIp}`);
    if(validator.validate(req.body.email)) return sendEmail(req.clientIp, req.body, res);  
    res.status(403).json({"validation": "no email"});
});

app.listen(process.env.PORT || 7000, process.env.LOCALBIND || 'localhost', function(){
  console.log('Listening on http://' + (process.env.LOCALBIND || 'localhost') + (':') + (process.env.PORT || 7000));
});

function sendEmail(sender, data, res) {
    const email = {
        from: process.env.EMAIL_FROM,
        to: process.env.EMAIL_TO
    };
    
    email.subject = (process.env.EMAIL_SUBJHEAD || 'My Site\'s Form') + ' - ' + (data.formid && data.formid.toUpperCase());

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

    logger.storeData(sender, email);
    transporter.sendMail(email, function(error, info) {
        if (error) return res.json({ 
          sendEmail: "failed" 
        });
        res.json({ sendEmail: "ok" });
    });
}