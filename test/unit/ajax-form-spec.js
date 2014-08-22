/* globals Event, jasmine, ajaxForm */
describe('ajax-form custom element tests', function() {
    beforeEach(function() {
        this.form = document.createElement('form');
    });

    describe('method normalization', function() {
        beforeEach(function() {
            var ajaxContainer = document.createElement('div');
            ajaxContainer.appendChild(document.createElement('core-ajax'));
            this.form.shadowRoot = ajaxContainer;
        });

        it('throws an error if the method is not "get", "post" or "put"', function() {
            expect(ajaxForm.domReady.bind(this.form)).toThrow();

            this.form.setAttribute('method', 'head');
            expect(ajaxForm.domReady.bind(this.form)).toThrow();
        });

        it('adds a listener to squelch submit events if the method is "post"', function() {
            spyOn(this.form, 'addEventListener');

            this.form.setAttribute('method', 'post');
            ajaxForm.domReady.call(this.form);
            expect(this.form.addEventListener.calls.mostRecent().args[0]).toBe('submit');
        });

        it('adds a listener to squelch submit events if the method is "put"', function() {
            spyOn(this.form, 'addEventListener');

            this.form.setAttribute('method', 'put');
            ajaxForm.domReady.call(this.form);
            expect(this.form.addEventListener.calls.mostRecent().args[0]).toBe('submit');
        });

        it('adds a listener to squelch submit events if the method is "get"', function() {
            spyOn(this.form, 'addEventListener');

            this.form.setAttribute('method', 'get');
            ajaxForm.domReady.call(this.form);
            expect(this.form.addEventListener.calls.mostRecent().args[0]).toBe('submit');
        });
    });

    describe('form validation', function() {
        beforeEach(function() {
            jasmine.clock().install();

            this.form.setAttribute('method', 'post');
            this.form.fire = jasmine.createSpy('fire');

            var ajaxContainer = document.createElement('div');
            ajaxContainer.appendChild(document.createElement('core-ajax'));
            this.form.shadowRoot = ajaxContainer;
        });

        afterEach(function() {
            jasmine.clock().uninstall();
        });

        it('ensures invalid fields are idenitified and presented via a single event', function() {
            var textInput1 = document.createElement('input'),
                textInput2 = document.createElement('input'),
                textInput3 = document.createElement('input');

            textInput1.setAttribute('name', 'test1');
            textInput2.setAttribute('name', 'test2');
            textInput3.setAttribute('name', 'test3');

            this.form.appendChild(textInput1);
            this.form.appendChild(textInput2);
            this.form.appendChild(textInput3);

           ajaxForm.domReady.call(this.form);

            var inputInvalidEvent = document.createEvent('Event');
            inputInvalidEvent.initEvent('invalid', true, true);

            textInput1.dispatchEvent(inputInvalidEvent);
            jasmine.clock().tick(5);

            textInput3.dispatchEvent(inputInvalidEvent);
            jasmine.clock().tick(10);

            expect(this.form.fire).toHaveBeenCalledWith('invalid', [textInput1, textInput3]);
        });
    });

    describe('submit interception', function() {
        beforeEach(function() {
            jasmine.clock().install();

            this.coreAjax = document.createElement('core-ajax');
            this.form.setAttribute('method', 'post');
            this.form.fire = jasmine.createSpy('submit');

            var ajaxContainer = document.createElement('div');
            ajaxContainer.appendChild(this.coreAjax);
            this.form.shadowRoot = ajaxContainer;
        });

        afterEach(function() {
            jasmine.clock().uninstall();
        });

        it('submit method is overridden', function() {
            var textInput1 = document.createElement('input'),
                textInput2 = document.createElement('input'),
                textInput3 = document.createElement('input');

            textInput1.setAttribute('name', 'test1');
            textInput2.setAttribute('name', 'test2');
            textInput3.setAttribute('name', 'test3');

            this.form.appendChild(textInput1);
            this.form.appendChild(textInput2);
            this.form.appendChild(textInput3);

            ajaxForm.domReady.call(this.form);

            this.form.submit();

            expect(this.form.fire).toHaveBeenCalledWith('submit');
        });
        
        describe('url encoding', function() {
            beforeEach(function() {
                this.coreAjax.url = 'test';
                
                var textInput1 = document.createElement('input'),
                    ce1 = document.createElement('my-ce1'),
                    ce2 = document.createElement('my-ce2');

                textInput1.setAttribute('name', 'test1');
                textInput1.setAttribute('type', 'text');
                textInput1.value = 'foobar';

                ce1.setAttribute('name', 'ce1name');
                ce1.value = 'ce1value';
                
                ce2.value = 'ce2value';
    
                this.form.appendChild(textInput1);
                this.form.appendChild(ce1);
                this.form.appendChild(ce2);

                spyOn(this.form, 'checkValidity').and.returnValue(true);
            });
            
            it('url encodes the form fields and includes them in query string for GET requests', function(done) {
                this.form.setAttribute('method', 'GET');
                
                ajaxForm.domReady.call(this.form);
    
                this.coreAjax.go = function() {
                    expect(this.coreAjax.url).toBe('test?test1=foobar&ce1name=ce1value');
                    done();            
                }.bind(this);
    
                var event = document.createEvent('HTMLEvents');
                event.initEvent('submit', true, true);
                this.form.dispatchEvent(event);
            });
    
            it('url encodes the form fields and includes them in the payload for POST requests', function(done) {
                this.form.setAttribute('method', 'POST');
    
                ajaxForm.domReady.call(this.form);
    
                this.coreAjax.go = function() {
                    expect(this.coreAjax.body).toBe('test1=foobar&ce1name=ce1value');
                    done();            
                }.bind(this);
    
                var event = document.createEvent('HTMLEvents');
                event.initEvent('submit', true, true);
                this.form.dispatchEvent(event);
            });
        });
    });
});
