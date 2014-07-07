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
        
        it('throws an error if the method is not "post" or "put"', function() {
            expect(ajaxForm.domReady.bind(this.form)).toThrow();

            this.form.setAttribute('method', 'get');
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
});