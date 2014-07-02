/* globals jasmine, polymerInstance */
describe('ajax-form custom element tests', function() {
    
    describe('method normalization', function() {
        it('throws an error if the method is not "post" or "put"', function() {
            expect(polymerInstance.spec.domReady.bind(this)).toThrow();

            this.method = 'get';
            expect(polymerInstance.spec.domReady.bind(this)).toThrow();
        });
        
        it('adds a listener to squelch submit events if the method is "post"', function() {
            this.addEventListener = jasmine.createSpy('addEventListener');

            this.method = 'post';
            polymerInstance.spec.domReady.call(this);
            expect(this.addEventListener.calls.mostRecent().args[0]).toBe('submit');
        });

        it('adds a listener to squelch submit events if the method is "put"', function() {
            this.addEventListener = jasmine.createSpy('addEventListener');

            this.method = 'put';
            polymerInstance.spec.domReady.call(this);
            expect(this.addEventListener.calls.mostRecent().args[0]).toBe('submit');
        });
    });
});