(function() {
    var getValidMethod = function() {
        if (this.method) {
            var proposedMethod = this.method.toLowerCase();

            if (proposedMethod === 'put' || 'post') {
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
        domReady: function() {
            this.acceptableMethod = getValidMethod.call(this);
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