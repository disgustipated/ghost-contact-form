const formProcessor = (function() {
  "use strict";

  let constraints = null;
  let constraintsLoaded = false;

  const loadConstraints = async () => {
    if (constraintsLoaded) return;
    
    try {
      const response = await fetch('/v1/form-constraints');
      if (!response.ok) throw new Error(`Failed to load constraints: ${response.status}`);
      
      constraints = await response.json();
      constraintsLoaded = true;
      return constraints;
    } catch (error) {
      console.error("Failed to load constraints:", error);
      throw error;
    }
  };

  // Form alert function
  const formAlert = (text) => {
    document.getElementById("responsemsg").innerHTML = `<br><p><em>${text}</em></p>`;
  };

  // Server response alert
  const responseAlert = (text) => {
    document.getElementById("serverresponse").innerHTML = `<br><p><em>${text}</em></p>`;
  };

  // Send data to server
  const sendData = (data, url, formId) => {
    formAlert("Sending, one second...");
    const postURL = url;
    const http = new XMLHttpRequest();
    
    http.open("POST", postURL, true);
    http.setRequestHeader("Content-Type", "application/json");
    data.source_url = window.location.href;
    
    http.send(JSON.stringify(data));
    
    http.onload = () => {
      formAlert("Thank you, your message has been sent!");
      document.getElementById(formId).reset();
    };
  };

  // Process form submission
  const processForm = (url, formId = "contact-form") => {
    const form = document.getElementById(formId);
    const attributes = {};
    const fields = form.querySelectorAll(
      'input:not([type="submit"]):not([type="reset"]):not([type="button"]):not([type="file"]):not([type="image"]), select, textarea'
    );

    fields.forEach(field => {
      if (field.id) {
        attributes[field.id] = field.value;
      }
    });

    // Load constraints and validate
    loadConstraints()
      .then(() => {
        validate.async(attributes, constraints)
          .then(success => {
            sendData(success, url, formId);
          })
          .catch(error => {
            formAlert(Object.values(error)[0][0]);
          });
      })
      .catch(error => {
        console.error("Validation failed:", error);
        formAlert("An error occurred while processing your form");
      });
  };

  return {
    process: (url, formId = "contact-form") => {
      processForm(url, formId);
    }
  };
}());