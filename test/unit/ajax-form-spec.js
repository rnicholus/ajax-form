/* globals jasmine, polymerInstance */
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
});