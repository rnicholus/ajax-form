ajax-form
=========

HTML forms on performance-enhancing drugs

[![Build Status](https://travis-ci.org/garstasio/ajax-form.svg?branch=master)](https://travis-ci.org/garstasio/ajax-form)

## Installation

`bower install ajax-form`

...or if you have a bower.json file with an entry for ajax-form:

`bower update`

See the [component page](http://garstasio.github.io/ajax-form/components/ajax-form/) for complete documentation and demos.


## Testing
```
npm install
npm install -g grunt-cli
grunt
```

- Running `grunt` without any parameters will test against a few locally installed browsers (see the codebase for details).  

- Running `grunt wct-test:remote` will run tests against a number of browsers in SauceLabs.  Ensure you have your SauceLabs username and key attached to the proper environment variables first.

See [documentation](https://github.com/Polymer/web-component-tester) for more details.
