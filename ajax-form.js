(function() {
    var arrayOf = function(pseudoArray) {
            return Array.prototype.slice.call(pseudoArray);
        },

        getEnctype = function(ajaxForm) {
            var enctype = ajaxForm.getAttribute('enctype');

            return enctype || 'application/x-www-form-urlencoded';
        },

        getValidMethod = function(method) {
            if (method) {
                var proposedMethod = method.toUpperCase();

                if (['GET', 'POST', 'PUT'].indexOf(proposedMethod) >= 0) {
                    return proposedMethod;
                }
            }
        },

        // NOTE: Safari doesn't have any visual indications when submit is blocked
        interceptSubmit = function(ajaxForm) {
            // Intercept submit event
            ajaxForm.addEventListener('submit', function(event) {
                // Stop form submission.  Believe it or not,
                // both of these are required for some reason,
                // and returning false doesn't seem to reliably work.
                event.preventDefault();
                event.stopPropagation();

                // respect any field validation attributes
                if (ajaxForm.checkValidity()) {
                    sendFormData(ajaxForm);
                }
            });

            // Intercept native form submit function.
            // In order to force the browser to highlight the invalid fields,
            // we need to create a hidden submit button and click it if the form is invalid.
            var fakeSubmitEl = document.createElement('input');
            fakeSubmitEl.setAttribute('type', 'submit');
            fakeSubmitEl.style.display = 'none';
            ajaxForm.appendChild(fakeSubmitEl);
            ajaxForm.submit = function() {
                if (ajaxForm.checkValidity()) {
                    ajaxForm.fire('submit');
                }
                else {
                    fakeSubmitEl.click();
                }
            };
        },

        maybeParseCoreDropdownMenu = function(customElement, data) {
            if (customElement.tagName.toLowerCase() === 'core-dropdown-menu' ||
                customElement.tagName.toLowerCase() === 'paper-dropdown-menu') {
                var coreMenu = customElement.querySelector('core-menu'),
                    selectedItem = coreMenu && coreMenu.selectedItem;

                if (selectedItem) {
                    data[customElement.getAttribute('name')] = selectedItem.label || selectedItem.textContent;
                    return true;
                }

                return true;
            }
        },

        maybeParseFileInput = function(element, data) {
            if (element.tagName.toLowerCase() === 'file-input' ||
                (element.tagName.toLowerCase() === 'input' && element.getAttribute('type') === 'file')) {

                var fileInputName = element.getAttribute('name');

                if (element.files.length) {
                    data[fileInputName] = arrayOf(element.files);
                }

                return true;
            }
        },

        maybeParseGenericCustomElement = function(customElement, data) {
            if (customElement.tagName.indexOf('-') >= 0 && customElement.value != null) {
                data[customElement.getAttribute('name')] = customElement.value;
                return true;
            }
        },

        parseCustomElements = function(form, parseFileInputs) {
            var data = {};

            arrayOf(form.querySelectorAll('*[name]')).forEach(function(el) {
                (parseFileInputs && maybeParseFileInput(el, data)) ||
                maybeParseCoreDropdownMenu(el, data) ||
                maybeParseGenericCustomElement(el, data);
            });

            return data;
        },

        /**
         * Return the value of some `HTMLElement`s  value attribute if possible.
         * @param HTMLElement element
         * @return mixed The element's value attribute
         */
        parseElementValue = function(element){
            var elementValue,
                elementTag = element.tagName.toLowerCase();

            if (elementTag === 'input') {
                elementValue = parseInputElementValue(element);
            }
            else if (elementTag === 'textarea'){
                elementValue = element.value;
            }
            else if (elementTag === 'select') {
                elementValue = parseSelectElementValues(element);
            }

            return elementValue;
        },

        /**
         * Parse an `HTMLFormElement` into key value pairs
         * @param HTMLFormElement form
         * @return Object key, value pairs representing the html form
         */
        parseForm = function(form, parseFileInputs) {
            var formObj = {},
                formElements = form.querySelectorAll('input'),
                customElementsData = parseCustomElements(form, parseFileInputs);

            formElements = arrayOf(formElements);
            formElements = formElements.concat(arrayOf(form.querySelectorAll('select')));
            formElements = formElements.concat(arrayOf(form.querySelectorAll('textarea')));

            formElements.forEach(function(formElement) {
                if (formElement.getAttribute('type') === 'file') {
                    parseFileInputs && maybeParseFileInput(formElement, formObj);
                }
                else {
                    var key = formElement.name,
                        val = parseElementValue(formElement);

                    if (key && val) {
                        formObj[key] = val;
                    }
                }
            });

            Object.keys(customElementsData).forEach(function(fieldName) {
                formObj[fieldName] = customElementsData[fieldName];
            });

            return formObj;
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
         * Parse an `HTMLRadioElement`'s value, returning the value iff
         * the element has a present `checked` attribute.
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
         * Parse an `HTMLSelectElement`'s value.
         *
         * @param HTMLSelectElement element
         * @return mixed The element's selected values
         */
        parseSelectElementValues = function(element) {
            var elementValues = [];

            arrayOf(element.options).forEach(function(optionElement){
                var tempElementValue = parseSelectOptionElementValue(optionElement);
                tempElementValue && elementValues.push(tempElementValue);
            });

            return elementValues;
        },

        sendFormData = function(ajaxForm) {
            var enctype = getEnctype(ajaxForm),
                formData = parseForm(ajaxForm, enctype === 'multipart/form-data'),
                submittingEvent = ajaxForm.fire('submitting', {formData: formData});

            formData = submittingEvent.detail.formData;

            if ('multipart/form-data' !== enctype &&
                'application/json' !== enctype) {

                sendUrlencodedForm(ajaxForm, formData);
            }
            else {
                if ('GET' === ajaxForm.acceptableMethod) {
                    sendUrlencodedForm(ajaxForm, formData);
                }
                else if ('multipart/form-data' === enctype) {
                    sendMultipartForm(ajaxForm, formData);
                }
                else if ('application/json' === enctype) {
                    sendJsonEncodedForm(ajaxForm, formData);
                }
            }
        },

        sendJsonEncodedForm = function(ajaxForm, data) {
            sendRequest({
                body: JSON.stringify(data),
                contentType: getEnctype(ajaxForm),
                form: ajaxForm
            });
        },

        sendMultipartForm = function(ajaxForm, data) {
            var formData = new FormData();

            Object.keys(data).forEach(function(fieldName) {
                var fieldValue = data[fieldName];

                if (Array.isArray(fieldValue)) {
                    if (fieldValue.length > 1) {
                        fieldName += '[]';
                    }

                    fieldValue.forEach(function(file) {
                        formData.append(fieldName, file);
                    });
                }
                else {
                    formData.append(fieldName, data[fieldName]);
                }
            });

            sendRequest({
                body: formData,
                form: ajaxForm
            });
        },

        sendRequest = function(options) {
            var xhr = new XMLHttpRequest(),
                customHeaders = options.form.headers;

            xhr.open(options.form.acceptableMethod, options.url || options.form.action);

            xhr.withCredentials = !!options.form.cookies;

            if (customHeaders) {
                if (typeof(customHeaders) === 'string') {
                    customHeaders = JSON.parse(customHeaders);
                }

                Object.keys(customHeaders).forEach(function(headerName) {
                    xhr.setRequestHeader(headerName, customHeaders[headerName]);
                });
            }

            options.contentType && xhr.setRequestHeader('Content-Type', options.contentType);

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    options.form.fire('submitted', xhr);
                }
            };

            xhr.send(options.body);
        },

        sendUrlencodedForm = function(ajaxForm, formData) {
            var data = toQueryString(formData);

            if (ajaxForm.acceptableMethod === 'POST') {
                sendRequest({
                    body: data,
                    contentType: getEnctype(ajaxForm),
                    form: ajaxForm
                });
            }
            else {
                sendRequest({
                    contentType: getEnctype(ajaxForm),
                    form: ajaxForm,
                    url: ajaxForm.action + (ajaxForm.action.indexOf('?') > 0 ? '&' : '?') + data,
                });
            }
        },

        toQueryString = function(params) {
            var queryParams = [];

            Object.keys(params).forEach(function(key) {
                var val = params[key];
                key = encodeURIComponent(key);

                if (val && Object.prototype.toString.call(val) === '[object Array]') {
                    val.forEach(function(valInArray) {
                        queryParams.push(key + '=' + encodeURIComponent(valInArray));
                    });
                }
                else {
                    queryParams.push(val == null ? key : (key + '=' + encodeURIComponent(val)));
                }
            });

            return queryParams.join('&');
          },

        watchForInvalidFields = function(ajaxForm, existingEventListeners) {
            var initialFields = arrayOf(ajaxForm.querySelectorAll(':invalid, :valid')),
                invalidFields = [],

                listenForInvalidEvent = function(field) {
                    field.willValidate && field.addEventListener('invalid', function() {
                        invalidFields.push(field.customElementRef || field);

                        // In case another element is invalid and the event
                        // hasn't been triggered yet, hold off on firing the
                        // invalid event on the custom el.
                        clearTimeout(timer);
                        timer = setTimeout(function() {
                            ajaxForm.fire('invalid', invalidFields);
                            invalidFields = [];
                            console.error('Form submission blocked - constraints violation.');
                        }, 10);
                    });
                },

                // Be sure to observe any validatable form fields added in the future
                mutationHandler = function(observer, records) {
                    records.forEach(function(record) {
                        if (record.addedNodes.length) {
                            arrayOf(record.addedNodes).forEach(function(addedNode) {
                                addedNode.willValidate && listenForInvalidEvent(addedNode);
                            });
                        }
                    });

                    ajaxForm.onMutation(ajaxForm, mutationHandler);
                },

                timer = null;

            initialFields.forEach(function(field) {
                listenForInvalidEvent(field);
            });

            ajaxForm.onMutation(ajaxForm, mutationHandler);
        };

    this.ajaxForm = {
       /**
        * Fired when a response is received.
        *
        * @event core-response
        */
        cookies: false,

        domReady: function() {
            var ajaxForm = this;

            // The method attribute set on the light-DOM `<form>`
            // can't seem to be accessed as a property of this element,
            // unlike other attributes.  Perhaps due to the fact that
            // we are extending a form and a "natural" form also has a
            // method attr?  Perhaps something special about this attr?
            // Need to look into this further.
            ajaxForm.acceptableMethod = getValidMethod(ajaxForm.getAttribute('method'));

            if (!ajaxForm.acceptableMethod) {
                throw new Error('Invalid method!');
            }

            watchForInvalidFields(ajaxForm);
            interceptSubmit(ajaxForm);
        }
    };
}());
