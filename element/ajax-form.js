(function() {
    var getValidMethod = function(method) {
        if (method) {
            var proposedMethod = method.toLowerCase();

            // PUT & POST are the only acceptable methods for now.  
            // GET requires us to be able to convert form fields into a URL-encoded string.
            if (['put', 'post'].indexOf(proposedMethod) >= 0) {
                return proposedMethod;
            }
        }
    },

    interceptSubmit = function() {
        this.addEventListener('submit', function(event) {
            // Stop form submission.  Believe it or not, 
            // both of these are required for some reason, 
            // and returning false doesn't seem to reliably work.
            event.preventDefault();
            event.stopPropagation();

            // respect any field validation attributes
            // NOTE: Safari doesn't have any visual indications when submit is blocked
            if (this.checkValidity()) {
                sendForm.call(this, this);
            }
        }.bind(this));
    },    

    listenForAjaxComplete = function() {
        var sender = this.shadowRoot.querySelector('core-ajax');
        
        sender.addEventListener('core-complete', function(event) {
             this.fire('submitted', event.detail.xhr);
        }.bind(this));
    },
    
    sendForm = function(form) {
        var sender = this.shadowRoot.querySelector('core-ajax'),
            formData = new FormData(window.unwrap(form)),
            fileInput = form.querySelector('file-input');

        if (fileInput) {
            var fileInputName = fileInput.getAttribute('name') || 'files';
            
            if (fileInput.files.length > 1) {
                fileInputName += '[]';
            }
            
            fileInput.files.forEach(function(file) {
                formData.append(fileInputName, file);    
            });
        }

        // make sure Polymer/core-ajax doesn't touch the Content-Type.
        // The browser must set this with the proper multipart boundary ID.
        sender.contentType = null;

        if (this.cookies) {
            sender.withCredentials = true;            
        }

        sender.body = formData;
        sender.go();
    },
    
    watchForInvalidFields = function(form) {
        var customEl = this,
            fields = form.children,
            invalidFields = [],
            timer = null;
        
        for (var i = 0; i < fields.length; i++) {
            /* jshint loopfunc:true */
            fields[i].addEventListener('invalid', function() {
                invalidFields.push(this);

                // In case another element is invalid and the event 
                // hasn't been triggered yet, hold off on firing the 
                // invalid event on the custom el.
                clearTimeout(timer);
                timer = setTimeout(function() {
                    customEl.fire('invalid', invalidFields);
                    invalidFields = [];
                    console.error('Form submission blocked - constraints violation.');
                }, 10);
            });
        }
        
    };

    /* globals Polymer */
    /* jshint newcap: false */
    Polymer('ajax-form', {
        acceptableMethod: 'post',
    
        cookies: false,

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
            
            watchForInvalidFields.call(this, this);

            interceptSubmit.call(this);
            
            listenForAjaxComplete.call(this);
        }
    });
}());