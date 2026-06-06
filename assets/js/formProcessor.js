var formProcessor = (function(){

  "use strict";

  var constraints = {
      name: {
          presence: true,
          length: {
              minimum: 2,
              maximum: 30,
              message: "must be longer."
            }
        },
      email: {
        presence: true,
        email: true,
      },
      subject: {
        presence: true,
        length: {
          minimum: 1,
            message: "must be selected."
          }
      },
      message: {
        presence: true,
          length: {
               minimum: 10,
               maxumum: 4000,
               message: "must be longer."
            }
      },
      robot: {
        presence: {
          allowEmpty: true
        },
        length: {
            is: 0,
            message: "must be filled out."
        }
      }
  };

  function formAlert(text) {
      document.getElementById("responsemsg").innerHTML = "<br><p><em>" + text + "</em></p>";
    };
  function responseAlert(text) {
     document.getElementById("serverresponse").innerHTML = "<br><p><em>" + text + "</em></p>";
  };

  function sendData(data, url) {
    formAlert("One second...");
    var postURL = (url);
    var http = new XMLHttpRequest();
    http.open("POST", postURL, true);
    http.setRequestHeader("Content-Type", "application/json");
    data.source_url = window.location.href;
    http.send(JSON.stringify(data));
    http.onload = function() {
        formAlert("Thank you, your message has been sent!");
        document.getElementById("contact-form").reset();
    }
  };

  return ({
    process: function(url, formId = "contact-form") {
      const form = document.getElementById(formId);
      const attributes = {};

      // Dynamically collect all fields we care about
      const fields = form.querySelectorAll('input:not([type="submit"]):not([type="reset"]):not([type="button"]):not([type="file"]):not([type="image"]), select, textarea');
      fields.forEach(field => {
          if (field.id) {
            attributes[field.id] = field.value;
          }
      });
      
      validate.async(attributes, constraints)
        .then(function(success) {
          sendData(success, url);
      })
      .catch(function(error) {
        formAlert(Object.values(error)[0][0]);
      })  
    }
  });

}());
