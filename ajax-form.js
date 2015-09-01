(function() {
    var arrayOf = function(pseudoArray) {
            return Array.prototype.slice.call(pseudoArray);
        },

        // Note that _currentScript is a polyfill-specific convention
        currentScript = document._currentScript || document.currentScript,

        fire = function (node, type, _detail_) {
            var detail = _detail_ === null || _detail_ === undefined ? {} : _detail_,
                event = new CustomEvent(type, {
                    bubbles: true,
                    cancelable: true,
                    detail: detail
                });

            // hack to ensure preventDefault() in IE10+ actually sets the defaultPrevented property
            if (customPreventDefaultIgnored) {
                event.preventDefault = function () {
                    Object.defineProperty(this, 'defaultPrevented', {
                        get: function () {
                            return true;
                        }
                    });
                };
            }

            node.dispatchEvent(event);
            return event;
        },

        customPreventDefaultIgnored = (function () {
            var tempElement = document.createElement('div'),
                event = fire(tempElement, 'foobar');

            event.preventDefault();
            return !event.defaultPrevented;
        }()),

        getEnctype = function(ajaxForm) {
            var enctype = ajaxForm.getAttribute('enctype');

            return enctype || 'application/x-www-form-urlencoded';
        },

        getValidMethod = function(method) {
            if (method) {
                var proposedMethod = method.toUpperCase();

                if (['GET', 'POST', 'PUT', 'PATCH'].indexOf(proposedMethod) >= 0) {
                    return proposedMethod;
                }
            }
        },

        importDoc = currentScript.ownerDocument,

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
                ajaxForm._preventValidityCheck = false;
                if (ajaxForm.checkValidity()) {
                    fire(ajaxForm, 'submit');
                }
                else {
                    ajaxForm._preventValidityCheck = true;
                    fakeSubmitEl.click();
                }
            };
        },

        isCheckboxOrRadioButton = function(element) {
            var elementType = element.type,
                role = element.getAttribute('role');

            return elementType === 'checkbox' ||
                role === 'checkbox' ||
                elementType === 'radio' ||
                role === 'radio';
        },

        maybeParseCoreDropdownMenu = function(customElement, data) {
            if (customElement.tagName.toLowerCase() === 'core-dropdown-menu' ||
                customElement.tagName.toLowerCase() === 'paper-dropdown-menu') {
                var coreMenu = customElement.querySelector('core-menu'),
                    selectedItem = coreMenu && coreMenu.selectedItem;

                if (selectedItem) {
                    processFormValue(customElement.getAttribute('name'), selectedItem.label || selectedItem.textContent, data);
                }

                return true;
            }
        },

        maybeParseCustomElementOrFileInput = function(spec) {
            var name = spec.customElement.getAttribute('name');
            spec.name = name;

            if (spec.customElement.tagName.indexOf('-') >= 0 ) {
                if (isCheckboxOrRadioButton(spec.customElement)) {
                    var radioValue = parseRadioElementValue(spec.customElement);
                    if (radioValue) {
                        processFormValue(name, radioValue, spec.data);
                        return true;
                    }
                }
                else if (spec.customElement.files) {
                    maybeParseFileInput(spec);
                    return true;
                }
                else if (!spec.customElement.files) {
                    processFormValue(name, spec.customElement.value, spec.data);
                    return true;
                }
            }
            else if (spec.customElement.files) {
                maybeParseFileInput(spec);
                return true;
            }
        },

        maybeParseFileInput = function(spec) {
            if (spec.parseFileInputs) {
                processFormValue(spec.name, arrayOf(spec.customElement.files), spec.data);
                spec.form._fileInputFieldNames.push(spec.name);
            }
        },

        parseCustomElements = function(form, parseFileInputs) {
            var data = {};

            form._fileInputFieldNames = [];

            arrayOf(form.querySelectorAll('*[name]')).forEach(function(el) {
                maybeParseCoreDropdownMenu(el, data) ||
                maybeParseCustomElementOrFileInput({
                    customElement: el,
                    data: data,
                    form: form,
                    parseFileInputs: parseFileInputs
                });
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

            if (elementTag === 'input' && element.type !== 'file') {
                elementValue = parseInputElementValue(element);
            }
            else if (elementTag === 'textarea') {
                elementValue = element.value || '';
            }
            else if (elementTag === 'select') {
                elementValue = parseSelectElementValues(element);
            }

            return elementValue;
        },

        parseForm = function(form, parseFileInputs) {
            var formObj = {},
                formElements = form.querySelectorAll('input'),
                customElementsData = parseCustomElements(form, parseFileInputs);

            formElements = arrayOf(formElements);
            formElements = formElements.concat(arrayOf(form.querySelectorAll('select')));
            formElements = formElements.concat(arrayOf(form.querySelectorAll('textarea')));

            formElements.forEach(function(formElement) {
                var key = formElement.name,
                    val = parseElementValue(formElement);

                if (key && val != null) {
                    processFormValue(key, val, formObj);
                }
            });

            Object.keys(customElementsData).forEach(function(fieldName) {
                processFormValue(fieldName, customElementsData[fieldName], formObj);
            });

            return formObj;
        },

        parseInputElementValue = function(element){
            var elementValue,
                elementType = element.type;

            if (element.disabled === true ||
                ['submit', 'reset', 'button', 'image'].indexOf(elementType) !== -1) {
                // do nothing for these button types
            }
            // support checkboxes, radio buttons or elements that behave as such
            else if (isCheckboxOrRadioButton(element)) {
                elementValue = parseRadioElementValue(element);
            }
            else {
                elementValue = element.value || '';
            }

            return elementValue;
        },

        parseRadioElementValue = function(element) {
            var value;
            if (element.checked === true) {
                value = element.value;
            }
            return value;
        },

        parseSelectOptionElementValue = function(element) {
            var elementValue;
            if (element.selected === true){
                elementValue = element.value;
            }
            return elementValue;
        },

        parseSelectElementValues = function(element) {
            var elementValues = [];

            arrayOf(element.options).forEach(function(optionElement){
                var tempElementValue = parseSelectOptionElementValue(optionElement);
                tempElementValue && elementValues.push(tempElementValue);
            });

            return elementValues;
        },

        processFormValue = function(key, value, store) {
            if (store[key]) {
                if (Array.isArray(store[key]) &&
                    store[key].length > 1 &&
                    Array.isArray(store[key][1])) {

                    store[key].push([value]);
                }
                else {
                    store[key] = [[store[key]]];
                    store[key].push([value]);
                }
            }
            else {
                store[key] = value;
            }
        },

        sendFormData = function(ajaxForm) {
            var enctype = getEnctype(ajaxForm),
                formData = parseForm(ajaxForm, enctype === 'multipart/form-data'),
                submittingEvent = fire(ajaxForm, 'submitting', {formData: formData});

            if (!submittingEvent.defaultPrevented) {
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
                    // If this is a file input field value, and there are no
                    // selected files, ensure this is accounted for in the
                    // request as an empty filename w/ an empty application/octet-stream
                    // boundary body. This is how a native form submit accounts for an
                    // empty file input.
                    if (fieldValue.length === 0 &&
                        ajaxForm._fileInputFieldNames.indexOf(fieldName) >= 0) {

                        formData.append(fieldName,
                            new Blob([], {type : 'application/octet-stream'}), '');
                    }
                    else {
                        fieldValue.forEach(function(file) {
                            formData.append(fieldName, file);
                        });
                    }
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
                customHeaders = options.form.getAttribute('headers');

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
                    fire(options.form, 'submitted', xhr);
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
                    url: ajaxForm.action + (ajaxForm.action.indexOf('?') > 0 ? '&' : '?') + data
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

        watchForInvalidFields = function (ajaxForm) {
            var config = {attributes: true, childList: true, characterData: false},
                initialFields = arrayOf(ajaxForm.querySelectorAll(':invalid, :valid')),
                invalidFields = [],

                listenForInvalidEvent = function (field) {
                    field.willValidate && field.addEventListener('invalid', function () {
                        if (ajaxForm._preventValidityCheck) {
                            return;
                        }

                        invalidFields.push(field.customElementRef || field);

                        // In case another element is invalid and the event
                        // hasn't been triggered yet, hold off on firing the
                        // invalid event on the custom el.
                        clearTimeout(timer);
                        timer = setTimeout(function () {
                            fire(ajaxForm, 'invalid', invalidFields);
                            invalidFields = [];
                            console.error('Form submission blocked - constraints violation.');
                        }, 10);
                    });
                },

                // Be sure to observe any validatable form fields added in the future
                mutationHandler = new window.MutationObserver(function (records) {
                    records.forEach(function (record) {
                        if (record.addedNodes.length) {
                            arrayOf(record.addedNodes).forEach(function (addedNode) {
                                addedNode.willValidate && listenForInvalidEvent(addedNode);
                            });
                        }
                    });
                }),

                timer = null;

            initialFields.forEach(function (field) {
                listenForInvalidEvent(field);
            });

            // pass in the target node, as well as the observer options
            mutationHandler.observe(ajaxForm, config);

        };

    document.registerElement('ajax-form', {
        extends: 'form',
        prototype: Object.create(HTMLFormElement.prototype, {
            createdCallback: {
                value: function () {
                    var templates = importDoc.querySelectorAll('.ajax-form-template'),
                        template = templates[templates.length - 1],
                        clone = document.importNode(template.content, true);

                    this.appendChild(clone);

                    var ajaxForm = this;

                    // The method attribute set on the light-DOM `<form>`
                    // can't seem to be accessed as a property of this element,
                    // unlike other attributes.  Perhaps due to the fact that
                    // we are extending a form and a "natural" form also has a
                    // method attr?  Perhaps something special about this attr?
                    // Need to look into this further.
                    ajaxForm.acceptableMethod = getValidMethod(ajaxForm.getAttribute('method'));

                    // default method is GET
                    ajaxForm.acceptableMethod = ajaxForm.acceptableMethod || 'GET';

                    watchForInvalidFields(ajaxForm);
                    interceptSubmit(ajaxForm);
                    fire(ajaxForm, 'ready');
                }
            }
        })
    });
}());
