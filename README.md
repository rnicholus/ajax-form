ajax-form
=========

HTML forms on performance-enhancing drugs

[![Build Status](https://travis-ci.org/garstasio/ajax-form.svg?branch=master)](https://travis-ci.org/garstasio/ajax-form)

### What's wrong with a traditional `<form>`?

1. Form submission changes/reloads the page, and it's not trivial to properly prevent this.
2. You can't send custom headers with a submitted form.
3. You can't (easily) parse the server response after a form is submitted.
4. Programmatically tracking invalid forms/fields is frustrating.

**`ajax-form` augments a traditional `<form>` to provide additonal features and solve the problems listed above.**


### Simple (but powerful) Example
```html
<!DOCTYPE html>
<html>
    <head>
        <script src="../bower_components/platform/platform.js"></script>
        <link rel="import" href="/element/ajax-form.html">
        
        <style>
            .hidden {
                display: none;
            }
    
            @-webkit-keyframes fadein {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @-moz-keyframes fadein {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes fadein {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            #pleaseWait {
                text-align: center;
                -webkit-animation: fadein 1s ease-in alternate infinite;
                -moz-animation: fadein 1s ease-in alternate infinite;
                animation: fadein 1s ease-in alternate infinite;
            }
        </style>
    </head>

    <body>
        <h1 id="pleaseWait" class="hidden">Sending your data...</h1>
        
        <form is="ajax-form" action="my/form/handler" method="post">
            <div>
                <label>Full Name: <input type="text" name="name" required></label>
            </div>
            
            <div>
                <label>Address: <input type="text" name="address" required></label>
            </div>
            
            <div>
                <label>Favorie color: <input type="text" name="color"></label>
            </div>

            <div>
                <b>Receive periodic email updates from us?</b>
                <input type="radio" name="emailCommunication" value="yes" checked>yes
                <input type="radio" name="emailCommunication" value="no">no
            </div>
            
            <input type="submit">
        </form>
    </body>
    
    <script>
        var form = document.getElementsByTagName('form')[0];
        
        form.addEventListener('invalid', function() {
            alert('Some form fields are invalid!');
        });
        
        form.addEventListener('submitting', function() {
            document.getElementById('pleaseWait').className = '';
            this.className = 'hidden';
        });
        
        form.addEventListener('submitted', function(event) {
            document.getElementById('pleaseWait').className = 'hidden';
            this.className = '';
            
            if (event.detail.status > 299) {
                alert('Submission failed!  Please try again later.')
            }
            else {
                form.innerHTML = 'Thanks!  Your choices have been submitted!';
            }
        });
    </script>

</html>
```

The above code includes a simple HTML form that identifies itself as an `ajax-form`.
As you can see, there are some standard form elements included that collect the user's
name, address, favorite color, and ask them if they'd like to be added to a mailing list.
The name and address fields are required for submission.

The form will be submitted as a multipart encoded POST request to the "my/form/handler" endpoint.

If required fields are not filled out when the user clicks "submit", an "invalid" event will
be triggered on the form (passing the invalid elements as event detail), and an alert will be
displayed to the user.  Some browsers (not Safari) will also outline the offending fields in red.

If the form is able to be submitted and passes validation checks, a "submitted" event
will be triggered on the form, the form will be hidden, and a large "Sending your data..."
message will appear and fade in and out conitnuously until the form has been submitted.

Once the server has processed and responded to the form submit, a "submitted" event
will be triggered on the form and the "Sending your data..." message will disapper.
If submission was successful, a message will replace the form.  If a problem
occurred, the form will re-appear and an alert will be displayed to the user.
In each case, the underlying `XMLHttpRequest` instance will be passed to the
"submitted" event handler as event detail.


### Integation with `<file-input>` custom element
Want a better `<input type="file">` element that can be easily styled, has built-in,
customizable validation, and provides an improved API?  Check out the [`<file-input>` custom element][file-input].
`ajax-form` allows `<file-input>` custom element to be submitted along with other standard
form fields.  Just include your `<file-input>` element as a child of your `<form is="ajax-form">`.  
That's it!

As an added benefit, ONLY valid files (not those that have failed any validation rules setup in your `<file-input>` element) 
will be sent along with the request!

### Handling the request server-side
All forms will be sent as multipart encoded requests.  If you include a `<file-input>`
field, files will be sent with a name according to the `name` attribute on the `<file-input>`.
If more than one file has been selected, the `name` attribute for each file in the request
will include a "[]" at the end of the name string.

### Cross-origin form submits (CORS)
Please note that all forms are actually "submitted" using `XMLHttpRequest`.  This means that 
your server must include appropriate CORS headers in the response if you want access to the
response data **if the request is a cross-origin request**.  Also, requests with custom headers
will be preflighted as well, so your server must handle these correctly.  [Read more about
CORS on Mozilla Developer Network][cors].

### Attributes

#### `action` (required)
Same as the `action` attribute of a non-`ajax-form` `<form>`.  This will hold the
path to your server that is set to handle the multipart encoded request.  

```html
<form is="ajax-form" method="POST" action="form/handler">
    ...
</form>
```

The above form will be submitted to the "form/handler" endpoint server on the current domain.  

#### `cookies`
Only applicable for cross-origin form submits.  If included, cookies
will be included with any cross-origin form submit request.  If not included,
cookies will NOT be sent with any cross-origin form submit request.

```html
<form is="ajax-form" method="POST" action="http://someotherdomain.com/form/handler" cookies>
    ...
</form>
```

The above example will ensure that cookies are included with the request that is
sent when the form is submitted to the origin reference in the `action` attribute
(which presumably is a domain different than the one hosting the form).

#### `headers`
Custom headers to be sent with the form submit request.  The value must be a JSON
Object containing header names and values.

```html
<form is="ajax-form" action="form/handler" method="POST" headers='{"X-Requested-With": "XMLHttpRequest"}'>
    ...
</form>
```

The above form will be submitted with an "X-Requested-With" header that contains a value of
"XMLHttpRequest".

#### `method` (required)
The method to use when sending the request.  Currently, only POST and PUT are allowed.

```html
<form is="ajax-form" method="put" action="form/handler">
    ...
</form>
```

The above form will be submitted as a PUT request.

### Events

#### `invalid`
If your form has one or more fields with an [HTML5 validation attribute][validation] (such as `required`),
this event will be triggered once after a submit attempt if any of the fields
do not pass validation checks.  All invalid field elements will be passed in an array
represented by the `detail` property of the event passed to your handler.

```javascript
form.addEventListener('invalid', function(event) {
    event.detail.forEach(function(invalidElement) {
        // do something with each invalid element (display a message, etc)...
    });
});
```

#### `submitted`
Invoked after the form has been submitted and a response has been received from
the server.  The associated [`XMLHttpRequest` instance][xhr] used to send the request 
will be passed to your event handler on the event's `detail` property. 

```javascript
form.addEventListener('submitted', function(event) {
    if (event.detail.status > 299) {
        // the submit has failed - let the user know
    }
});
```

#### `submitting`
Invoked after the form has passed all validation checks, and just before the reuqest is sent.

```javascript
form.addEventListener('submitting', function() {
    // let the user know the submit is in progress...
});
```

### Browser Support
All [browsers supported by Polymer][polymer-browsers] are currently supported by `ajax-form`.  Polymer is a hard dependency.

[cors]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS
[file-input]: https://github.com/garstasio/file-input
[polymer-browsers]: http://www.polymer-project.org/resources/compatibility.html
[validation]: https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5/Constraint_validation
[xhr]: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest