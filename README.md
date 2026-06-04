# ghost-contact-form
Add a beautiful, fully functional contact form to your Ghost blog or website without paying for external services.

*Not running on Ghost?* This solution also works with Gatsby, Hugo, Hexo, Nuxt and any other static site generator.

## Prerequisites
- A supported version of Node.js
- npm to manage packages

## Quickstart Install

```
$ git clone https://github.com/disgustipated/ghost-contact-form.git
$ cd ghost-contact-form
$ sh install.sh
```
TODO: update install.sh - install sh doesnt work, need to manually add dependencies to a package.json, then run npm install. Mail and app listener service should work after that

## Configure

Adapt the `.env` file to your needs. The following variables must be defined.

```
SMTP_HOST = mail.server.com
SMTP_USER = user@server.com
SMTP_PASS = strong password
ALLOW_ORIGIN = https://your-blog.com
EMAIL_FROM = noreply@your-blog.com
EMAIL_TO = your@email.com
```
### Optional
```
PORT=7000
LOCALBIND=123.12.12.1
```
`PORT = ` - if you want to change the default port `7000` to something else.  
`LOCALBIND=` - sets the bind ip for nodemailer and app listener, if not set then uses localhost  

## Usage

### Deploy web service
#### To run from command line execute
```
$ node ghost-contact-svc.js
```
You should see the message `Listening on http://localhost:7000`. 
#### To run as systemd
Configure .env with desired parameters  
Configure .service file with proper values ofr path to js, .env, and user  
Run  
```
systemd link /path/to/your/ghost-contact.service
systemd status ghost-contact.service
```
To remove run  
```
systemd disable ghost-contact.service
```
### Deploy Ghost config - wip
Add footer injection  
    header injection  
    assets - css and js  
    contact form html to desired location  

## Test Locally
### Testing the mailer service
From a system with curl, set your contact form var, run:  
`contact="http://your.internal.ip:7000/v1/contact"`  
Then run  
```
curl -v -X POST ${contact} -H "Content-Type: application/json" \
-d '{"email": "destination@email.addr", \
"name": "test email", \
"subject": "feedback", \
"message": "Production Light!"}'
```

### Demo form
Add the below to the ghost-contact-svc.js below the app.post('/v1/contact'
```
app.get('/v1/demo', function(req, res) {
    res.sendFile(__dirname + '/demo.html');
});
```
This will enable a get call to load the demo.html to see how this application can be used. This existed in the upstream project but removed to prevent demo components loaded in code in prod.

## Deploy (More detailed info in the tutorial)
TODO: update this  
- copy the work folder `ghost-contact-form` to your server  
- use `ghost-contact.service` as a starting point for running `ghost-contact-svc.js` as a systemd daemon  
- configure your web-server to map endpoint `http://localhost:7000/` to a public endpoint, e.g. `https://api.your-blog.com/`  
- Use the files in folder `ghost-admin` to configure your Ghost front-end  
- Other front-end configuration files upon request!  
