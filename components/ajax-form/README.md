ajax-form
=========

HTML forms on performance-enhancing drugs

[![Build Status](https://travis-ci.org/rnicholus/ajax-form.svg?branch=master)](https://travis-ci.org/rnicholus/ajax-form)

## What's wrong with a traditional `<form>`?
1. Form submission changes/reloads the page, and it's not trivial to properly prevent this.
2. You can't send custom headers with a submitted form.
3. You can't (easily) parse the server response after a form is submitted.
4. Programmatically tracking invalid forms/fields is frustrating.
5. You can't send form data as JSON.
6. You have no opportunity to programmatically augment user-entered data before it is sent to the server.
7. Custom form elements (such as those created using the web components spec) cannot be submitted using a traditional unadulterated `<form>`.

The `ajax-form` custom element augments a traditional `<form>` to provide additional features and solve the problems listed above. See the [API documentation page](http://ajax-form.raynicholus.com) for complete documentation and demos.

## Installation

`npm install ajax-form`

## Use

Use ajax-form just like you would use a traditional form, with the exception of the required `is="ajax-form"` attribute that you _must_ include in your `<form>` element markup. Since ajax-form is a web component, you may need to include a web component polyfill, such as [webcomponents.js](http://webcomponents.org/) to ensure browsers
that do not implement the WC spec are able to make use of ajax-form. Ajax-form has *no* hard
dependencies.

A very simple use of `ajax-form` looks just like a normal `<form>`, with the addition of an `is` attribute:

```html
<form is="ajax-form" action="my/form/handler" method="post">
    <label>Enter your name: <input type="text" name="full_name"></label>
    ...
</form>
```

See the [API documentation page](http://ajax-form.raynicholus.com) for complete documentation and demos.


## Integration
Are you developing a form field web component?  Read the instructions below to ensure
your field integrates properly with ajax-form.

### Submitting
Your component will integrate nicely into ajax form provided your custom element
exposes a `value` property that contains the current value of the field.  If this
is not true, then your custom field must ensure a native HTML form field is part of
the light DOM.  In either case, the element with the `value` property must also
contain a `name` attribute.  Your user/integrator will need to include an
appropriate value for this field.

### Validation
If your custom field exposes a native HTML form field in the light DOM, then there
is nothing more to do - ajax-form will respect any validation that your user/integrator
adds to the field.  The constrain attribute(s) MUST be placed on the native HTML form
field.

If your custom field does NOT expose a native HTML form field in the light DOM by
default, and you want ajax-form to respect validation constraints, then you will
need to include a little code to account for this.  Here are the steps to follow:

1. Add an opaque, 0x0 `<input type="text">` field to the light DOM, just before your field.
2. Add a `customElementRef` property to the input, with a value equal to your field.
3. Ensure the validity of the input always matches the validity of your field.  You can
do this via the `setCustomValidity` method present on an `HTMLInputElement`.

See the [`setValidationTarget` method in the `<file-input>` custom element source code](https://github.com/rnicholus/file-input/blob/1.1.4/file-input.js#L104)
for an example.


## Testing
```
npm install
npm install -g grunt-cli
grunt
```

- Running `grunt` without any parameters will test against a few locally installed browsers (see the codebase for details).

- Running `grunt shell:wctSauce` will run tests against a number of browsers in SauceLabs.  Ensure you have your SauceLabs username and key attached to the proper environment variables first.
