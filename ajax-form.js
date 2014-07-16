(function() {
    var getValidMethod = function(method) {
        if (method) {
            var proposedMethod = method.toLowerCase();

            // PUT & POST are the only acceptable methods for now.
            // GET requires us to be able to convert form fields into a URL-encoded string.
            if (['put', 'post', 'get'].indexOf(proposedMethod) >= 0) {
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
                this.fire('submitting');
                if ('post' === this.acceptableMethod) {
                    sendMultipartForm.call(this, this);
                }
                if ('get' === this.acceptableMethod) {
                    sendUrlencodedForm.call(this, this);
                }
            }
        }.bind(this));
    },

    listenForAjaxComplete = function() {
        var sender = this.shadowRoot.getElementsByTagName('core-ajax')[0];

        sender.addEventListener('core-complete', function(event) {
             this.fire('submitted', event.detail.xhr);
        }.bind(this));
    },

    // @TODO: should these FormData parse methods be exposed as events
    // if, say, someone wanted to filter or transform the data in a form
    // (i.e., radio from yes/no to true/false, or textarea from markdown to
    // html)?
    parseFormData = function(form) {
        var formData = new FormData(window.unwrap(form)),
            fileInput = form.getElementsByTagName('file-input')[0];

        if (fileInput) {
            var fileInputName = fileInput.getAttribute('name') || 'files';

            if (fileInput.files.length > 1) {
                fileInputName += '[]';
            }

            fileInput.files.forEach(function(file) {
                formData.append(fileInputName, file);
            });
        }

        return formData;

    },

    /**
     * Parse an `HTMLRadioElement`'s value, returning the value iff
     * the element has a present `checked` attribute.
     *
     * @TODO: Grouped radio elements?
     *
     * @param HTMLRadioElement element
     * @return mixed The element's value
     */
    parseRadioElementValue = function(element) {
        var value;
        if (element.checked === true) {
            value = element.value;
        }
        return value;

    },

    /**
     * Parse an `HTMLOptionElement`'s value, returning the value iff
     * the element has a present `selected` attribute.
     * @param HTMLOptionElement element
     * @return mixed The element's value
     */
    parseSelectOptionElementValue = function(element) {
        var elementValue;
        if (element.selected === true){
            elementValue = element.value;
        }
        return elementValue;
    },

    /**
     * Parse an `HTMLOptGroupElement` return the `HTMLOptionElement` that
     * has a `checked` attribute.
     * @param HTMLOptGroupElement element
     * @return mixed The element's value
     */
    parseSelectOptgroupElementValue = function(element) {
        var elementValue;
        Array.prototype.forEach.call(element.options, function(optionElement){
            var tempElementValue = parseSelectOptionElementValue(optionElement);
            if (tempElementValue){
                elementValue = tempElementValue;
            }
        });
        return elementValue;
    },

    /**
     * Parse an `HTMLSelectElement`'s value.
     *
     * @TODO loop through <option> elements and find a true one
     * @TODO: ensure 'multiple' attribute is obeyed
     *
     * @param HTMLSelectElement element
     * @return mixed The element's value
     */
    parseSelectElementValue = function(element) {
        var elementValue;

        // @TODO: not exactly cross browser
        Array.prototype.forEach.call(element.options, function(optionElement){
            var tempElementValue;
            if (element.tagName.toLowerCase() === 'optgroup') {
                tempElementValue = parseSelectOptionElementValue(optionElement);
                tempElementValue = parseSelectOptionElementValue(optionElement);
                if (tempElementValue){
                    elementValue = tempElementValue;
                }
            } else {
                tempElementValue = parseSelectOptionElementValue(optionElement);
                if (tempElementValue){
                    elementValue = tempElementValue;
                }
            }
        });

        return elementValue;
    },

    /**
     * Parse an `HTMLInputElement`'s value.
     * @param HTMLInputElement element
     * @return mixed The element's value
     */
    parseInputElementValue = function(element){
        var elementValue,
            elementType = element.type;

        if (element.disabled === true ||
            ['submit', 'reset', 'button', 'image'].indexOf(elementType) !== -1) {
             // do nothing for these button types
        }
        else if (elementType === 'radio') {
            elementValue = parseRadioElementValue(element);
        } else {
            elementValue = element.value;
        }

        return elementValue;
    },

    /**
     * Return the value of some `HTMLElement`s  value attribute if possible.
     * @param HTMLElement element
     * @return mixed The element's value attribute
     */
    parseElementValue = function(element){

        // @TODO: validate in the 'other' browsers
        var elementValue,
            elementTag = element.tagName.toLowerCase();

        if (elementTag === 'input') {
            elementValue = parseInputElementValue(element);
        }
        else if (elementTag === 'textarea'){
            elementValue = element.value;
        }
        //else if(/select*/.exec(elementTag)) {
        else if (elementTag === 'select') {
             elementValue = parseSelectElementValue(element);
        }

        return elementValue;

    },

    /**
     * Return an `HTMLElement`'s `name` attribute
     * @param HTMLElement element
     * @return String The element's name attribute
     */
    parseElementName = function(element) {
        // @TODO: is this needed? look into ways browsers parse input
        // element names
        var name;
        name = element.name;
        return name;
    },

    /**
     * Parse an `HTMLFormElement` into key value pairs
     * @param HTMLFormElement form
     * @return Object key, value pairs representing the html form
     */
    parseForm = function(form) {
        var formObj = {},
            formElements = form.getElementsByTagName('input');

        formElements = Array.prototype.slice.call(formElements);
        formElements = formElements.concat(Array.prototype.slice.call(form.getElementsByTagName('select')));
        formElements = formElements.concat(Array.prototype.slice.call(form.getElementsByTagName('textarea')));

        formElements.forEach(function(formElement){
            var key = parseElementName(formElement),
                val = parseElementValue(formElement);

            if (key && val) {
                formObj[key] = val;
            }

        });

        return formObj;
    },

    sendUrlencodedForm = function(form){
        var sender = this.shadowRoot.getElementsByTagName('core-ajax')[0],
            data = parseForm(form);

        //sender.contentType = 'application/x-www-form-urlencoded';
        if (this.cookies) {
            sender.withCredentials = true;
        }

        sender.method = 'GET';
        // @TODO: does core-ajax urlencode our form for us?
        sender.params = data;
        sender.go();
    },

    sendMultipartForm = function(form) {
        var sender = this.shadowRoot.getElementsByTagName('core-ajax')[0],
            data = parseFormData(form);

        // make sure Polymer/core-ajax doesn't touch the Content-Type.
        // The browser must set this with the proper multipart boundary ID.
        sender.contentType = null;

        if (this.cookies) {
            sender.withCredentials = true;
        }

        sender.body = data;
        sender.go();
    },

    watchForInvalidFields = function(form) {
        var customEl = this,
            fields = form.getElementsByTagName('input'),
            invalidFields = [],
            timer = null;

        fields = Array.prototype.slice.call(fields);
        fields = fields.concat(Array.prototype.slice.call(form.getElementsByTagName('select')));
        fields = fields.concat(Array.prototype.slice.call(form.getElementsByTagName('textarea')));

        fields.forEach(function(field) {
            field.addEventListener('invalid', function() {
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
        });
    };

    this.ajaxForm = {
       /**
        * Fired when a response is received.
        *
        * @event core-response
        */
        cookies: false,

        domReady: function() {
            // The method attribute set on the light-DOM `<form>`
            // can't seem to be accessed as a property of this element,
            // unlike other attributes.  Perhaps due to the fact that
            // we are extending a form and a "natural" form also has a
            // method attr?  Perhaps something special about this attr?
            // Need to look into this further.
            this.acceptableMethod = getValidMethod(this.getAttribute('method'));

            if (!this.acceptableMethod) {
                throw new Error('Invalid method!');
            }

            watchForInvalidFields.call(this, this);

            interceptSubmit.call(this);

            listenForAjaxComplete.call(this);
        }
    };
}());