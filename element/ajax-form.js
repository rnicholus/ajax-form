(function() {
    var getValidMethod = function(method) {
        if (method) {
            var proposedMethod = method.toLowerCase();

            if (['put', 'post'].indexOf(proposedMethod) >= 0) {
                return proposedMethod;
            }
        }
    },

    sendForm = function() {
        var sender = this.shadowRoot.querySelector('core-ajax');

        // make sure Polymer/core-ajax doesn't touch the Content-Type.
        // The browser must set this with the proper multipart boundary ID.
        sender.contentType = null;

        sender.body = new FormData(window.unwrap(this));
        sender.go();
    };

    /* globals Polymer */
    /* jshint newcap: false */
    Polymer('ajax-form', {
        acceptableMethod: 'post', //just a default value
        
        domReady: function() {
            // The method attribute set on the light-DOM `<form>` 
            // can't seem to be access as a property of this element, 
            // unlike other attributes.  Perhaps due to the fact that 
            // we are extending a form and a "natural" form also has a 
            // method attr?  Need to look into this further.
            this.acceptableMethod = getValidMethod(this.getAttribute('method'));
            
            if (!this.acceptableMethod) {
                throw new Error('Invalid method!');
            }

            this.addEventListener('submit', function(event) {
                // stop form submission
                event.preventDefault();
                event.stopPropagation();

                sendForm.call(this);
            }.bind(this));
        }
    });
}());