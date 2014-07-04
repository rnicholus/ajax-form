/* globals Event, jasmine, polymerInstance */
describe('ajax-form custom element tests', function() {
    beforeEach(function() {
        this.form = document.createElement('form');
    });

    describe('method normalization', function() {
        it('throws an error if the method is not "post" or "put"', function() {
            expect(polymerInstance.spec.domReady.bind(this.form)).toThrow();

            this.form.setAttribute('method', 'get');
            expect(polymerInstance.spec.domReady.bind(this.form)).toThrow();
        });

        it('adds a listener to squelch submit events if the method is "post"', function() {
            spyOn(this.form, 'addEventListener');

            this.form.setAttribute('method', 'post');
            polymerInstance.spec.domReady.call(this.form);
            expect(this.form.addEventListener.calls.mostRecent().args[0]).toBe('submit');
        });

        it('adds a listener to squelch submit events if the method is "put"', function() {
            spyOn(this.form, 'addEventListener');

            this.form.setAttribute('method', 'put');
            polymerInstance.spec.domReady.call(this.form);
            expect(this.form.addEventListener.calls.mostRecent().args[0]).toBe('submit');
        });
    });

    describe('form validation', function() {
        beforeEach(function() {
            jasmine.clock().install();
            
            this.form.setAttribute('method', 'post');
            this.form.fire = jasmine.createSpy('fire');
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

            polymerInstance.spec.domReady.call(this.form);
            
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