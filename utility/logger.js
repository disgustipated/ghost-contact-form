//logger.js
//=========
//containers logger functions to store data 
module.exports ={
	DEBUGLOG : function () {
		shouldLog ? console.log : (() => {});
	},
	storeData : function (sender, content) {
		inboundRequest = {};
		inboundRequest.sender = sender;
		inboundRequest.content = content;
		log(inboundRequest);
	}
}

const path     = require('path');
const fs = require('fs');
const shouldLog = !process.env.NODE_ENV || process.env.DEBUG === 'true';

// Configure log file
const logFilePath = path.join('./log/app.log');

// Create directory if needed
const dirPath = path.dirname(logFilePath);
if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
}

const log = (message) => {
  const now = new Date();
  const timeString = now.toLocaleTimeString();
  const dateString = now.toLocaleDateString();
  const logLine = `
${dateString} ${timeString} - Sending request from ${message.sender}\n
Message From: ${message.content.from}\n
Message Subject: ${message.content.subject}\n
Message Body: ${message.content.html}\n
`;
  
  // Write to file
  fs.appendFileSync(logFilePath, logLine);
};